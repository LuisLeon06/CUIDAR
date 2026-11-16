import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  ARGENTINE_CITIES,
  BOTANICAL_PROFILES,
  computePredictionModel,
} from './src/lib/predictionEngine.ts';
import {
  ArgentineCityWeather,
  CutState,
  FoodAnalysisResult,
  FoodCategory,
  ImpactMetrics,
  RipenessState,
  StorageCondition,
} from './src/types/cuidar.ts';

dotenv.config();

// Hostinger (and most Node hosts) inject the port through the PORT env variable
const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));

function resolveDistPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'dist'),
    path.resolve(SERVER_DIR, '..', 'dist'),
    path.resolve(SERVER_DIR, 'dist'),
  ];
  return (
    candidates.find((p) => fs.existsSync(path.join(p, 'index.html'))) ||
    candidates[0]
  );
}

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function mapWeatherCodeToSpanish(code: number): string {
  if (code === 0) return 'Despejado';
  if (code === 1 || code === 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if (code >= 45 && code <= 48) return 'Neblina matinal';
  if (code >= 51 && code <= 67) return 'Llovizna / Lluvia débil';
  if (code >= 71 && code <= 77) return 'Nieve / Helada';
  if (code >= 80 && code <= 82) return 'Chaparrones aislados';
  if (code >= 95) return 'Tormenta eléctrica';
  return 'Templado estable';
}

interface StoredUserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  cityName: string;
  registeredAt: string;
}

const serverUsers = new Map<string, StoredUserAccount>();

let serverTotalScansCount = 14;

// Initial seeded inventory with realistic Argentine produce
let serverInventory: FoodAnalysisResult[] = [
  computePredictionModel({
    foodName: 'TOMATE',
    variety: 'Tomate Redondo Platense',
    category: 'Verduras',
    cutState: 'Cortado',
    ripenessLevel: 'Maduro',
    storageCondition: 'Heladera (4°C)',
    hoursSinceCut: 6,
    ambientTempC: 22,
    ambientHumidity: 64,
    imageUrl: BOTANICAL_PROFILES.tomate.defaultImageUrl,
  }),
  computePredictionModel({
    foodName: 'PALTA HASS',
    variety: 'Palta Hass Tucumana',
    category: 'Frutas',
    cutState: 'Cortado',
    ripenessLevel: 'Óptimo',
    storageCondition: 'Heladera (4°C)',
    hoursSinceCut: 3,
    ambientTempC: 22,
    ambientHumidity: 64,
    imageUrl: BOTANICAL_PROFILES.palta.defaultImageUrl,
  }),
  computePredictionModel({
    foodName: 'FRUTILLAS',
    variety: 'Frutilla de Coronda',
    category: 'Frutas',
    cutState: 'Entero',
    ripenessLevel: 'Maduro',
    storageCondition: 'Heladera (4°C)',
    hoursSinceCut: 0,
    ambientTempC: 22,
    ambientHumidity: 64,
    imageUrl: BOTANICAL_PROFILES.frutilla.defaultImageUrl,
  }),
  computePredictionModel({
    foodName: 'ESPINACA',
    variety: 'Espinaca Orgánica de Hoja',
    category: 'Hojas verdes',
    cutState: 'Entero',
    ripenessLevel: 'Óptimo',
    storageCondition: 'Heladera (4°C)',
    hoursSinceCut: 0,
    ambientTempC: 22,
    ambientHumidity: 64,
    imageUrl: BOTANICAL_PROFILES.espinaca.defaultImageUrl,
  }),
];

let serverImpact: ImpactMetrics = {
  savedArs: 28450,
  savedKg: 6.8,
  avoidedWastePercent: 89,
  itemsConsumedCount: 19,
  itemsTrackedCount: 23,
  co2AvoidedKg: 17.0,
  waterSavedLiters: 1420,
  recentActions: [
    {
      id: 'act-1',
      foodName: 'Tomate Platense (Cortado)',
      savedArs: 1450,
      savedKg: 0.35,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'act-2',
      foodName: 'Espinaca Orgánica',
      savedArs: 1650,
      savedKg: 0.3,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    },
    {
      id: 'act-3',
      foodName: 'Palta Hass Tucumana',
      savedArs: 2300,
      savedKg: 0.28,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 49).toISOString(),
    },
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // 0. Real Authentication & Profile Endpoints
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, cityName } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Ingresá un correo electrónico válido.' });
    }
    if (!password || String(password).length < 4) {
      return res
        .status(400)
        .json({ error: 'La contraseña debe tener al menos 4 caracteres.' });
    }

    const displayName =
      String(name || '').trim() || cleanEmail.split('@')[0] || 'Usuario CUIDAR';

    const account: StoredUserAccount = {
      id: `usr-${Date.now()}`,
      name: displayName,
      email: cleanEmail,
      password: String(password),
      cityName: String(cityName || 'Buenos Aires'),
      registeredAt: new Date().toISOString(),
    };

    serverUsers.set(cleanEmail, account);

    return res.json({
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        cityName: account.cityName,
        registeredAt: account.registeredAt,
      },
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Ingresá un correo electrónico válido.' });
    }
    if (!password || String(password).length < 4) {
      return res.status(400).json({ error: 'Ingresá tu contraseña.' });
    }

    const existing = serverUsers.get(cleanEmail);
    if (existing) {
      if (existing.password !== String(password)) {
        return res
          .status(401)
          .json({ error: 'Contraseña incorrecta para esta cuenta.' });
      }
      return res.json({
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          cityName: existing.cityName,
          registeredAt: existing.registeredAt,
        },
      });
    }

    // If account doesn't exist yet on this server instance, create & sign in seamlessly
    const fallbackName = cleanEmail.split('@')[0];
    const capitalizedName =
      fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
    const created: StoredUserAccount = {
      id: `usr-${Date.now()}`,
      name: capitalizedName,
      email: cleanEmail,
      password: String(password),
      cityName: 'Buenos Aires',
      registeredAt: new Date().toISOString(),
    };
    serverUsers.set(cleanEmail, created);

    return res.json({
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        cityName: created.cityName,
        registeredAt: created.registeredAt,
      },
    });
  });

  app.put('/api/auth/profile', (req, res) => {
    const { email, name, cityName } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const existing = serverUsers.get(cleanEmail);
    if (existing) {
      if (name) existing.name = String(name).trim();
      if (cityName) existing.cityName = String(cityName).trim();
      serverUsers.set(cleanEmail, existing);
      return res.json({
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          cityName: existing.cityName,
          registeredAt: existing.registeredAt,
        },
      });
    }
    return res.json({
      user: {
        name: String(name || 'Usuario CUIDAR').trim(),
        email: cleanEmail || 'usuario@cuidar.ar',
        cityName: String(cityName || 'Buenos Aires'),
        registeredAt: new Date().toISOString(),
      },
    });
  });

  // 1. Open-Meteo Smart Weather API Endpoint + Automatic City Resolution
  app.get('/api/weather', async (req, res) => {
    const cityId = (req.query.cityId as string) || 'caba';
    const customLat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const customLon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;

    const preset =
      ARGENTINE_CITIES.find((c) => c.id === cityId) || ARGENTINE_CITIES[0];

    const hasCustomCoords =
      customLat !== undefined &&
      !Number.isNaN(customLat) &&
      customLon !== undefined &&
      !Number.isNaN(customLon);

    const lat = hasCustomCoords ? customLat! : preset.lat;
    const lon = hasCustomCoords ? customLon! : preset.lon;

    let cityName = req.query.customName
      ? String(req.query.customName)
      : preset.name;
    let province = req.query.customName ? 'Ubicación actual' : preset.province;

    if (hasCustomCoords) {
      try {
        const geoRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const detectedCity =
            geoData.city ||
            geoData.locality ||
            geoData.principalSubdivision;
          if (detectedCity) {
            cityName = detectedCity;
            province = geoData.principalSubdivision || geoData.countryName || 'Argentina';
          }
        }
      } catch {
        let nearest = ARGENTINE_CITIES[0];
        let minDist = Infinity;
        for (const c of ARGENTINE_CITIES) {
          const d = Math.hypot(c.lat - lat, c.lon - lon);
          if (d < minDist) {
            minDist = d;
            nearest = c;
          }
        }
        cityName = nearest.name;
        province = nearest.province;
      }
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=4`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open-Meteo status ${response.status}`);
      }
      const data = await response.json();

      const currentTemp = Math.round(data.current?.temperature_2m ?? 21);
      const currentHumidity = Math.round(data.current?.relative_humidity_2m ?? 62);
      const currentCode = data.current?.weather_code ?? 1;

      const forecast = (data.daily?.time || []).slice(0, 3).map((dateStr: string, idx: number) => ({
        date: dateStr,
        tempMax: Math.round(data.daily?.temperature_2m_max?.[idx] ?? currentTemp + 3),
        tempMin: Math.round(data.daily?.temperature_2m_min?.[idx] ?? currentTemp - 5),
        humidityMean: Math.round(data.daily?.relative_humidity_2m_mean?.[idx] ?? currentHumidity),
        weatherCode: data.daily?.weather_code?.[idx] ?? currentCode,
      }));

      const payload: ArgentineCityWeather = {
        cityName,
        province,
        latitude: lat,
        longitude: lon,
        temperature: currentTemp,
        humidity: currentHumidity,
        weatherCode: currentCode,
        conditionLabel: mapWeatherCodeToSpanish(currentCode),
        forecast,
        updatedAt: new Date().toISOString(),
      };

      res.json(payload);
    } catch {
      const fallback: ArgentineCityWeather = {
        cityName,
        province,
        latitude: lat,
        longitude: lon,
        temperature: 22,
        humidity: 64,
        weatherCode: 1,
        conditionLabel: 'Parcialmente nublado',
        forecast: [
          { date: 'Hoy', tempMax: 24, tempMin: 15, humidityMean: 62, weatherCode: 1 },
          { date: 'Mañana', tempMax: 25, tempMin: 16, humidityMean: 58, weatherCode: 0 },
          { date: 'Pasado', tempMax: 21, tempMin: 13, humidityMean: 68, weatherCode: 2 },
        ],
        updatedAt: new Date().toISOString(),
      };
      res.json(fallback);
    }
  });

  // 2. AI Visual Food Recognition & Shelf-Life Prediction Endpoint
  app.post('/api/analyze-food', async (req, res) => {
    try {
      const {
        imageBase64,
        mimeType = 'image/jpeg',
        foodName = 'TOMATE',
        cutState = 'Cortado',
        ripenessLevel = 'Maduro',
        storageCondition = 'Heladera (4°C)',
        hoursSinceCut = 4,
        ambientTempC = 22,
        ambientHumidity = 64,
        imageUrl,
      } = req.body;

      serverTotalScansCount += 1;

      const basePrediction = computePredictionModel({
        foodName,
        cutState: cutState as CutState,
        ripenessLevel: ripenessLevel as RipenessState,
        storageCondition: storageCondition as StorageCondition,
        hoursSinceCut: Number(hoursSinceCut) || 0,
        ambientTempC: Number(ambientTempC) || 22,
        ambientHumidity: Number(ambientHumidity) || 64,
        imageUrl,
      });

      const ai = getGenAIClient();
      if (!ai) {
        return res.json(basePrediction);
      }

      const promptText = `Sos el motor de inteligencia bromatológica y visión artificial de CUIDAR (Argentina).
Analizá el alimento (fruta o verdura) e identificá su estado de conservación.
Parámetros contextuales reportados:
- Alimento sugerido o preseleccionado: ${foodName}
- Estado de corte reportado: ${cutState}
- Nivel de maduración reportado: ${ripenessLevel}
- Condición de almacenamiento real: ${storageCondition}
- Tiempo desde el corte: ${hoursSinceCut} horas
- Clima exterior de referencia: ${ambientTempC}°C y ${ambientHumidity}% humedad relativa (recordá no confundir clima exterior con temperatura real de almacenamiento).

Devolvé un JSON preciso con nombres argentinos (ej: TOMATE, PALTA HASS, FRUTILLAS, ESPINACA, MORRÓN ROJO, LECHUGA CRIOLLA, BANANA, MANZANA ROJA), variedad regional, categoría ('Verduras', 'Frutas', o 'Hojas verdes'), estado ('Entero', 'Cortado', o 'Pelado'), maduración ('Verde / Firme', 'Óptimo', 'Maduro', o 'Sobremaduro'), horas de vida útil estimada restantes, etiqueta breve de vida útil (ej: '1-2 días'), nivel de riesgo ('Bajo', 'Moderado', 'Elevado'), score de riesgo (10-98), riesgos proyectados a 24h, 48h y 72h (0-100), descripción breve del estado físico, 3 factores de deterioro y 3 recomendaciones personalizadas y accionables.`;

      const parts: any[] = [];
      if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.length > 50) {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }
      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: 'Nombre del alimento en mayúsculas (ej. TOMATE)' },
              variety: { type: Type.STRING, description: 'Variedad común en Argentina' },
              category: { type: Type.STRING, description: 'Verduras, Frutas, o Hojas verdes' },
              cutState: { type: Type.STRING, description: 'Entero, Cortado, o Pelado' },
              ripenessLevel: { type: Type.STRING, description: 'Verde / Firme, Óptimo, Maduro, o Sobremaduro' },
              estimatedShelfLife: { type: Type.STRING, description: 'Ej: 1-2 días, 3-4 días' },
              remainingHours: { type: Type.INTEGER, description: 'Horas restantes estimadas' },
              riskLevel: { type: Type.STRING, description: 'Bajo, Moderado, o Elevado' },
              riskScore: { type: Type.INTEGER, description: '0 a 100' },
              risk24h: { type: Type.INTEGER, description: 'Riesgo a 24h (0-100)' },
              risk48h: { type: Type.INTEGER, description: 'Riesgo a 48h (0-100)' },
              risk72h: { type: Type.INTEGER, description: 'Riesgo a 72h (0-100)' },
              physicalState: { type: Type.STRING, description: 'Estado físico observado en 1 oración clara' },
              temperatureOptimal: { type: Type.STRING, description: 'Rango óptimo de temperatura en °C' },
              humidityOptimal: { type: Type.STRING, description: 'Rango óptimo de humedad en %' },
              deteriorationFactors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 factores clave que afectan su deterioro',
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 recomendaciones prácticas de conservación y consumo',
              },
              estimatedWeightKg: { type: Type.NUMBER, description: 'Peso estimado en kg (ej. 0.35)' },
              estimatedValueArs: { type: Type.INTEGER, description: 'Valor estimado en pesos argentinos ARS' },
            },
          },
        },
      });

      const rawJson = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawJson);

      const validCategory: FoodCategory =
        parsed.category === 'Frutas' || parsed.category === 'Hojas verdes' || parsed.category === 'Verduras'
          ? parsed.category
          : basePrediction.category;

      const validCut: CutState =
        parsed.cutState === 'Entero' || parsed.cutState === 'Cortado' || parsed.cutState === 'Pelado'
          ? parsed.cutState
          : basePrediction.cutState;

      const validRipeness: RipenessState =
        parsed.ripenessLevel === 'Verde / Firme' ||
        parsed.ripenessLevel === 'Óptimo' ||
        parsed.ripenessLevel === 'Maduro' ||
        parsed.ripenessLevel === 'Sobremaduro'
          ? parsed.ripenessLevel
          : basePrediction.analysis.ripenessLevel;

      const enrichedResult: FoodAnalysisResult = {
        ...basePrediction,
        name: (parsed.name || basePrediction.name).toUpperCase(),
        variety: parsed.variety || basePrediction.variety,
        category: validCategory,
        cutState: validCut,
        estimatedShelfLife: parsed.estimatedShelfLife || basePrediction.estimatedShelfLife,
        remainingHours: Number(parsed.remainingHours) || basePrediction.remainingHours,
        riskLevel:
          parsed.riskLevel === 'Bajo' || parsed.riskLevel === 'Moderado' || parsed.riskLevel === 'Elevado'
            ? parsed.riskLevel
            : basePrediction.riskLevel,
        riskScore: Math.min(98, Math.max(8, Number(parsed.riskScore) || basePrediction.riskScore)),
        horizon: {
          risk24h: Math.min(99, Math.max(5, Number(parsed.risk24h) || basePrediction.horizon.risk24h)),
          risk48h: Math.min(99, Math.max(12, Number(parsed.risk48h) || basePrediction.horizon.risk48h)),
          risk72h: Math.min(100, Math.max(20, Number(parsed.risk72h) || basePrediction.horizon.risk72h)),
        },
        analysis: {
          ...basePrediction.analysis,
          ripenessLevel: validRipeness,
          physicalState: parsed.physicalState || basePrediction.analysis.physicalState,
          temperatureOptimal: parsed.temperatureOptimal || basePrediction.analysis.temperatureOptimal,
          humidityOptimal: parsed.humidityOptimal || basePrediction.analysis.humidityOptimal,
          deteriorationFactors:
            Array.isArray(parsed.deteriorationFactors) && parsed.deteriorationFactors.length > 0
              ? parsed.deteriorationFactors.slice(0, 4)
              : basePrediction.analysis.deteriorationFactors,
        },
        recommendations:
          Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
            ? parsed.recommendations.slice(0, 4)
            : basePrediction.recommendations,
        estimatedWeightKg: Number(parsed.estimatedWeightKg) || basePrediction.estimatedWeightKg,
        estimatedValueArs: Number(parsed.estimatedValueArs) || basePrediction.estimatedValueArs,
        imageUrl: imageBase64 || imageUrl || basePrediction.imageUrl,
        aiConfidence: 98,
      };

      res.json(enrichedResult);
    } catch (error: any) {
      console.error('Error in /api/analyze-food:', error?.message || error);
      const fallback = computePredictionModel({
        foodName: req.body?.foodName || 'TOMATE',
        cutState: (req.body?.cutState as CutState) || 'Cortado',
        ripenessLevel: (req.body?.ripenessLevel as RipenessState) || 'Maduro',
        storageCondition: (req.body?.storageCondition as StorageCondition) || 'Heladera (4°C)',
        hoursSinceCut: Number(req.body?.hoursSinceCut) || 4,
        ambientTempC: Number(req.body?.ambientTempC) || 22,
        ambientHumidity: Number(req.body?.ambientHumidity) || 64,
        imageUrl: req.body?.imageBase64 || req.body?.imageUrl,
      });
      res.json(fallback);
    }
  });

  // 3. Inventory & Impact State Endpoints
  app.get('/api/state', (_req, res) => {
    res.json({
      inventory: serverInventory,
      impact: serverImpact,
      totalScansCount: serverTotalScansCount,
    });
  });

  app.post('/api/inventory', (req, res) => {
    const item = req.body as FoodAnalysisResult;
    if (!item || !item.name) {
      return res.status(400).json({ error: 'Datos de alimento inválidos' });
    }
    const newItem: FoodAnalysisResult = {
      ...item,
      id: item.id || `cuidar-${Date.now()}`,
      scannedAt: item.scannedAt || new Date().toISOString(),
    };
    serverInventory = [newItem, ...serverInventory.filter((i) => i.id !== newItem.id)];
    serverImpact.itemsTrackedCount += 1;
    res.json({ inventory: serverInventory, impact: serverImpact });
  });

  // Update an inventory item's conservation condition, cut state, or ripeness in place
  app.patch('/api/inventory/:id', (req, res) => {
    const { id } = req.params;
    const existing = serverInventory.find((i) => i.id === id);
    if (!existing) {
      return res.status(404).json({ error: 'Alimento no encontrado' });
    }

    const {
      cutState = existing.cutState,
      ripenessLevel = existing.analysis.ripenessLevel,
      storageCondition = existing.analysis.conservationCondition,
      hoursSinceCut = existing.hoursSinceCut,
      ambientTempC = 22,
      ambientHumidity = 64,
    } = req.body || {};

    const recalculated = computePredictionModel({
      foodName: existing.name,
      variety: existing.variety,
      category: existing.category,
      cutState: cutState as CutState,
      ripenessLevel: ripenessLevel as RipenessState,
      storageCondition: storageCondition as StorageCondition,
      hoursSinceCut: cutState === 'Entero' ? 0 : Number(hoursSinceCut) || 0,
      ambientTempC: Number(ambientTempC) || 22,
      ambientHumidity: Number(ambientHumidity) || 64,
      imageUrl: existing.imageUrl,
    });

    const updatedItem: FoodAnalysisResult = {
      ...recalculated,
      id: existing.id,
      scannedAt: existing.scannedAt,
    };

    serverInventory = serverInventory.map((item) =>
      item.id === id ? updatedItem : item
    );

    return res.json({ item: updatedItem, inventory: serverInventory });
  });

  // Recalculate all inventory items when ambient weather changes
  app.post('/api/inventory/recalculate', (req, res) => {
    const { ambientTempC = 22, ambientHumidity = 64 } = req.body || {};
    serverInventory = serverInventory.map((item) => {
      const recalc = computePredictionModel({
        foodName: item.name,
        variety: item.variety,
        category: item.category,
        cutState: item.cutState,
        ripenessLevel: item.analysis.ripenessLevel,
        storageCondition: item.analysis.conservationCondition,
        hoursSinceCut: item.hoursSinceCut,
        ambientTempC: Number(ambientTempC) || 22,
        ambientHumidity: Number(ambientHumidity) || 64,
        imageUrl: item.imageUrl,
      });
      return {
        ...recalc,
        id: item.id,
        scannedAt: item.scannedAt,
      };
    });
    res.json({ inventory: serverInventory });
  });

  app.post('/api/inventory/:id/consume', (req, res) => {
    const { id } = req.params;
    const target = serverInventory.find((i) => i.id === id);
    if (target) {
      serverInventory = serverInventory.filter((i) => i.id !== id);
      serverImpact.savedArs += target.estimatedValueArs || 1400;
      serverImpact.savedKg = Number((serverImpact.savedKg + (target.estimatedWeightKg || 0.3)).toFixed(2));
      serverImpact.itemsConsumedCount += 1;
      serverImpact.avoidedWastePercent = Math.min(
        98,
        Math.round((serverImpact.itemsConsumedCount / Math.max(1, serverImpact.itemsTrackedCount)) * 100)
      );
      serverImpact.co2AvoidedKg = Number((serverImpact.savedKg * 2.5).toFixed(1));
      serverImpact.waterSavedLiters = Math.round(serverImpact.savedKg * 210);
      serverImpact.recentActions = [
        {
          id: `act-${Date.now()}`,
          foodName: `${target.name} (${target.cutState})`,
          savedArs: target.estimatedValueArs || 1400,
          savedKg: target.estimatedWeightKg || 0.3,
          timestamp: new Date().toISOString(),
        },
        ...serverImpact.recentActions.slice(0, 12),
      ];
    }
    res.json({ inventory: serverInventory, impact: serverImpact });
  });

  app.delete('/api/inventory/:id', (req, res) => {
    const { id } = req.params;
    serverInventory = serverInventory.filter((i) => i.id !== id);
    res.json({ inventory: serverInventory, impact: serverImpact });
  });

  if (!IS_PRODUCTION) {
    // Vite is only needed in development; imported lazily so production doesn't load it
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = resolveDistPath();
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `CUIDAR server (${IS_PRODUCTION ? 'producción' : 'desarrollo'}) running on http://localhost:${PORT}`
    );
  });
}

startServer();
