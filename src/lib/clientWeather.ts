import { ArgentineCityWeather } from '../types/cuidar.ts';
import { ARGENTINE_CITIES } from './predictionEngine.ts';

/**
 * Client-side weather fallback used when the Express backend (/api/weather)
 * is not available, e.g. when the app is deployed as a static site on Hostinger.
 * Open-Meteo and BigDataCloud's client endpoint both allow browser (CORS) requests.
 */

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

async function resolveCityName(
  lat: number,
  lon: number
): Promise<{ cityName: string; province: string }> {
  try {
    const geoRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`
    );
    if (geoRes.ok) {
      const geo = await geoRes.json();
      const city = geo.city || geo.locality || geo.principalSubdivision;
      if (city) {
        return {
          cityName: city,
          province: geo.principalSubdivision || geo.countryName || 'Argentina',
        };
      }
    }
  } catch {
    // fall through to nearest preset
  }
  let nearest = ARGENTINE_CITIES[0];
  let minDist = Infinity;
  for (const c of ARGENTINE_CITIES) {
    const d = Math.hypot(c.lat - lat, c.lon - lon);
    if (d < minDist) {
      minDist = d;
      nearest = c;
    }
  }
  return { cityName: nearest.name, province: nearest.province };
}

export async function fetchWeatherDirect(params: {
  cityId?: string;
  lat?: number;
  lon?: number;
}): Promise<ArgentineCityWeather | null> {
  const preset =
    ARGENTINE_CITIES.find((c) => c.id === params.cityId) || ARGENTINE_CITIES[0];
  const hasCoords =
    typeof params.lat === 'number' &&
    typeof params.lon === 'number' &&
    !Number.isNaN(params.lat) &&
    !Number.isNaN(params.lon);

  const lat = hasCoords ? (params.lat as number) : preset.lat;
  const lon = hasCoords ? (params.lon as number) : preset.lon;

  let cityName = preset.name;
  let province = preset.province;
  if (hasCoords) {
    const resolved = await resolveCityName(lat, lon);
    cityName = resolved.cityName;
    province = resolved.province;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=4`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();

    const currentTemp = Math.round(data.current?.temperature_2m ?? 21);
    const currentHumidity = Math.round(data.current?.relative_humidity_2m ?? 62);
    const currentCode = data.current?.weather_code ?? 1;

    const forecast = (data.daily?.time || [])
      .slice(0, 3)
      .map((dateStr: string, idx: number) => ({
        date: dateStr,
        tempMax: Math.round(data.daily?.temperature_2m_max?.[idx] ?? currentTemp + 3),
        tempMin: Math.round(data.daily?.temperature_2m_min?.[idx] ?? currentTemp - 5),
        humidityMean: Math.round(
          data.daily?.relative_humidity_2m_mean?.[idx] ?? currentHumidity
        ),
        weatherCode: data.daily?.weather_code?.[idx] ?? currentCode,
      }));

    return {
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
  } catch {
    return null;
  }
}
