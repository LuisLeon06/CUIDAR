import { useState, useEffect, useCallback } from 'react';
import {
  Home,
  ScanLine,
  Package,
  BarChart3,
  BookOpen,
  MapPin,
  CloudSun,
  X,
  RefreshCw,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArgentineCityWeather,
  CutState,
  FoodAnalysisResult,
  ImpactMetrics,
  RipenessState,
  RiskLevel,
  StorageCondition,
} from './types/cuidar.ts';
import {
  ARGENTINE_CITIES,
  BOTANICAL_PROFILES,
  computePredictionModel,
} from './lib/predictionEngine.ts';
import { fetchWeatherDirect } from './lib/clientWeather.ts';
import { CoverScreen, WelcomeScreen } from './components/WelcomeScreen.tsx';
import { ScannerPanel } from './components/ScannerPanel.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { ImpactView } from './components/ImpactView.tsx';
import { InteractiveManualCarousel } from './components/InteractiveManualCarousel.tsx';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallControl.tsx';
import {
  AuthModal,
  CuidarLogo,
  CuidarUser,
  TopRightAuthButton,
} from './components/AuthModal.tsx';

type NavSection = 'inicio' | 'escanear' | 'inventario' | 'impacto';

const STORAGE_KEY_INVENTORY = 'cuidar_inventory_v1';
const STORAGE_KEY_IMPACT = 'cuidar_impact_v1';
const STORAGE_KEY_SCANS_COUNT = 'cuidar_total_scans_v1';
const STORAGE_KEY_AUTH_USER = 'cuidar_auth_user_v1';
const LEGACY_STORAGE_KEY_PAGE_BG = 'cuidar_page_bg_v1';

const DEFAULT_WEATHER: ArgentineCityWeather = {
  cityName: 'Buenos Aires',
  province: 'CABA',
  latitude: -34.6037,
  longitude: -58.3816,
  temperature: 22,
  humidity: 64,
  weatherCode: 1,
  conditionLabel: 'Parcialmente nublado',
  forecast: [
    { date: 'Hoy', tempMax: 24, tempMin: 16, humidityMean: 62, weatherCode: 1 },
    { date: 'Mañana', tempMax: 25, tempMin: 17, humidityMean: 58, weatherCode: 0 },
    { date: 'Pasado', tempMax: 21, tempMin: 14, humidityMean: 68, weatherCode: 2 },
  ],
  updatedAt: new Date().toISOString(),
};

const INITIAL_INVENTORY: FoodAnalysisResult[] = [
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

const INITIAL_IMPACT: ImpactMetrics = {
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

export default function App() {
  // Load logged-in user if previously registered
  const [user, setUser] = useState<CuidarUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Show Portada de Bienvenida ONLY if user is NOT logged in
  const [showWelcomeCover, setShowWelcomeCover] = useState<boolean>(() => !user);
  const [activeSection, setActiveSection] = useState<NavSection>('inicio');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Welcome carousel modal shown upon entering Inicio ONLY if user is NOT logged in
  const [showEntryManualModal, setShowEntryManualModal] = useState<boolean>(false);

  // Cross-module navigation state (Inicio -> Inventario filter or item detail)
  const [inventoryInitialRiskFilter, setInventoryInitialRiskFilter] = useState<
    'Todos' | RiskLevel
  >('Todos');
  const [inventorySelectedItem, setInventorySelectedItem] =
    useState<FoodAnalysisResult | null>(null);

  // Live Location & Weather Notification triggered right when clicking "Comenzar"
  const [weather, setWeather] = useState<ArgentineCityWeather>(DEFAULT_WEATHER);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationWeatherToast, setShowLocationWeatherToast] = useState(false);

  const [totalScansCount, setTotalScansCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCANS_COUNT);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!Number.isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return 14;
  });

  const [inventory, setInventory] = useState<FoodAnalysisResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INVENTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_INVENTORY;
  });

  const [impact, setImpact] = useState<ImpactMetrics>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_IMPACT);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_IMPACT;
  });

  // The page color selector was removed (black theme only): clear any old saved preference
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY_PAGE_BG);
    } catch {
      // ignore
    }
  }, []);

  // Sync with backend state on initial load
  useEffect(() => {
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.inventory && !localStorage.getItem(STORAGE_KEY_INVENTORY)) {
          setInventory(data.inventory);
        }
        if (data?.impact && !localStorage.getItem(STORAGE_KEY_IMPACT)) {
          setImpact(data.impact);
        }
        if (
          typeof data?.totalScansCount === 'number' &&
          !localStorage.getItem(STORAGE_KEY_SCANS_COUNT)
        ) {
          setTotalScansCount(data.totalScansCount);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventory));
    } catch {
      // ignore
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_IMPACT, JSON.stringify(impact));
    } catch {
      // ignore
    }
  }, [impact]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCANS_COUNT, String(totalScansCount));
    } catch {
      // ignore
    }
  }, [totalScansCount]);

  // Recalculate all inventory items whenever local weather changes
  const recalculateInventoryWithWeather = useCallback(
    async (newWeather: ArgentineCityWeather) => {
      setInventory((prev) =>
        prev.map((item) => {
          const recalc = computePredictionModel({
            foodName: item.name,
            variety: item.variety,
            category: item.category,
            cutState: item.cutState,
            ripenessLevel: item.analysis.ripenessLevel,
            storageCondition: item.analysis.conservationCondition,
            hoursSinceCut: item.hoursSinceCut,
            ambientTempC: newWeather.temperature,
            ambientHumidity: newWeather.humidity,
            imageUrl: item.imageUrl,
          });
          return {
            ...recalc,
            id: item.id,
            scannedAt: item.scannedAt,
            estimatedWeightKg: item.estimatedWeightKg,
            estimatedValueArs: item.estimatedValueArs,
          };
        })
      );

      try {
        await fetch('/api/inventory/recalculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ambientTempC: newWeather.temperature,
            ambientHumidity: newWeather.humidity,
          }),
        });
      } catch {
        // local state updated
      }
    },
    []
  );

  // Try the Express backend first; if it's not available (static hosting), call the weather API from the browser
  const loadWeather = useCallback(
    async (params: { cityId?: string; lat?: number; lon?: number }) => {
      try {
        const query =
          params.lat !== undefined && params.lon !== undefined
            ? `lat=${params.lat}&lon=${params.lon}`
            : `cityId=${encodeURIComponent(params.cityId || 'caba')}`;
        const res = await fetch(`/api/weather?${query}`);
        const isJson = (res.headers.get('content-type') || '').includes('application/json');
        if (res.ok && isJson) {
          const data: ArgentineCityWeather = await res.json();
          if (data && typeof data.temperature === 'number') return data;
        }
      } catch {
        // backend unavailable
      }
      return fetchWeatherDirect(params);
    },
    []
  );

  // Fetch weather by cityId
  const fetchWeatherByCityId = useCallback(
    async (cityId: string) => {
      const data = await loadWeather({ cityId });
      if (data) {
        setWeather(data);
        await recalculateInventoryWithWeather(data);
      }
    },
    [loadWeather, recalculateInventoryWithWeather]
  );

  useEffect(() => {
    fetchWeatherByCityId('caba');
  }, [fetchWeatherByCityId]);

  // Trigger live city geolocation + weather notification
  const triggerCityAndWeatherNotification = useCallback(() => {
    setShowLocationWeatherToast(true);

    if (!navigator.geolocation) {
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const data = await loadWeather({ lat: latitude, lon: longitude });
          if (data) {
            setWeather(data);
            await recalculateInventoryWithWeather(data);
          }
        } catch {
          // keep current weather fallback
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 7000 }
    );
  }, [recalculateInventoryWithWeather]);

  const handleSuccessAuth = (loggedUser: CuidarUser) => {
    setUser(loggedUser);
    setShowWelcomeCover(false);
    setShowEntryManualModal(false);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(loggedUser));
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    } catch {
      // ignore
    }
  };

  // When the user clicks "Comenzar" on the Portada de Bienvenida
  const handleEnterFromCover = () => {
    setShowWelcomeCover(false);
    setActiveSection('inicio');
    triggerCityAndWeatherNotification();
    if (!user) {
      setShowEntryManualModal(true);
    }
  };

  const handleScanCompleted = () => {
    setTotalScansCount((prev) => prev + 1);
  };

  const handleSaveToInventory = async (item: FoodAnalysisResult) => {
    setInventory((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
    setImpact((prev) => ({
      ...prev,
      itemsTrackedCount: prev.itemsTrackedCount + 1,
    }));
    try {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    } catch {
      // local state already updated
    }
  };

  // Update an inventory item's conservation condition or cut state in place
  const handleUpdateItemCondition = async (
    id: string,
    updates: {
      cutState: CutState;
      ripenessLevel: RipenessState;
      storageCondition: StorageCondition;
      hoursSinceCut: number;
    }
  ) => {
    const existing = inventory.find((i) => i.id === id);
    if (!existing) return;

    const recalc = computePredictionModel({
      foodName: existing.name,
      variety: existing.variety,
      category: existing.category,
      cutState: updates.cutState,
      ripenessLevel: updates.ripenessLevel,
      storageCondition: updates.storageCondition,
      hoursSinceCut: updates.hoursSinceCut,
      ambientTempC: weather.temperature,
      ambientHumidity: weather.humidity,
      imageUrl: existing.imageUrl,
    });

    const updatedItem: FoodAnalysisResult = {
      ...recalc,
      id: existing.id,
      scannedAt: existing.scannedAt,
      estimatedWeightKg: existing.estimatedWeightKg,
      estimatedValueArs: existing.estimatedValueArs,
    };

    setInventory((prev) =>
      prev.map((item) => (item.id === id ? updatedItem : item))
    );

    try {
      await fetch(`/api/inventory/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          ambientTempC: weather.temperature,
          ambientHumidity: weather.humidity,
        }),
      });
    } catch {
      // local state already updated
    }
  };

  const handleConsumeItem = async (id: string) => {
    const target = inventory.find((i) => i.id === id);
    if (!target) return;

    setInventory((prev) => prev.filter((i) => i.id !== id));
    setImpact((prev) => {
      const nextSavedArs = prev.savedArs + (target.estimatedValueArs || 1400);
      const nextSavedKg = Number(
        (prev.savedKg + (target.estimatedWeightKg || 0.3)).toFixed(2)
      );
      const nextConsumed = prev.itemsConsumedCount + 1;
      const nextAvoided = Math.min(
        98,
        Math.round((nextConsumed / Math.max(1, prev.itemsTrackedCount)) * 100)
      );
      return {
        ...prev,
        savedArs: nextSavedArs,
        savedKg: nextSavedKg,
        itemsConsumedCount: nextConsumed,
        avoidedWastePercent: nextAvoided,
        co2AvoidedKg: Number((nextSavedKg * 2.5).toFixed(1)),
        waterSavedLiters: Math.round(nextSavedKg * 210),
        recentActions: [
          {
            id: `act-${Date.now()}`,
            foodName: `${target.name} (${target.cutState})`,
            savedArs: target.estimatedValueArs || 1400,
            savedKg: target.estimatedWeightKg || 0.3,
            timestamp: new Date().toISOString(),
          },
          ...prev.recentActions.slice(0, 12),
        ],
      };
    });

    try {
      await fetch(`/api/inventory/${encodeURIComponent(id)}/consume`, {
        method: 'POST',
      });
    } catch {
      // local state already updated
    }
  };

  const handleDeleteItem = async (id: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/inventory/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      // local state already updated
    }
  };

  const navItems: { id: NavSection; label: string; icon: typeof Home }[] = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'escanear', label: 'Escanear', icon: ScanLine },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'impacto', label: 'Mi impacto', icon: BarChart3 },
  ];

  // 1. PORTADA DE BIENVENIDA COMPLETA (Solo aparece si NO está logueado; sin Header)
  if (showWelcomeCover && !user) {
    return (
      <>
        <OfflineIndicator />
        <CoverScreen
          onEnterApp={handleEnterFromCover}
          user={user}
          onOpenAuthModal={() => setShowAuthModal(true)}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          user={user}
          onSuccessAuth={handleSuccessAuth}
          onLogout={handleLogout}
          onSelectCityId={fetchWeatherByCityId}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-[#F8F8F3] flex flex-col">
      <OfflineIndicator />

      {/* UNIFIED TOP HEADER: Fixed dark surface (#050505) + Toned-down Neon strictly on Logos & Edges */}
      <header className="sticky top-0 z-40 w-full bg-[#050505] border-t border-t-[#6FBF94]/45 border-b border-b-[#6FBF94]/30 shadow-[0_2px_14px_rgba(111,191,148,0.05)]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 lg:px-14 h-16 flex items-center justify-between gap-3">
          {/* Left: Clean Official CUIDAR Logo (No button outline) */}
          <button
            type="button"
            onClick={() => setActiveSection('inicio')}
            className="flex items-center gap-2.5 text-left cursor-pointer group focus:outline-none"
          >
            <CuidarLogo size="sm" />
          </button>

          {/* Right: Live Weather Trigger + Welcome Tour + Login Button */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <PWAInstallButton compact />

            {/* Compact Live City & Weather Trigger in Header */}
            <button
              type="button"
              onClick={() => setShowLocationWeatherToast((prev) => !prev)}
              className="hidden md:inline-flex min-h-[40px] px-3 py-1.5 rounded-xl bg-[#050505] border border-[#6FBF94]/30 text-xs font-medium text-[#A0AAA4] hover:text-[#F8F8F3] hover:border-[#6FBF94]/60 items-center gap-1.5 transition-all cursor-pointer"
              title="Ver o calibrar tu ciudad y clima actual"
            >
              <CloudSun className="w-3.5 h-3.5 text-[#6FBF94] neon-logo-glow shrink-0" />
              <span className="truncate max-w-[110px]">{weather.cityName}</span>
              <span className="font-mono-tabular text-[#6FBF94]">
                {weather.temperature}°C
              </span>
            </button>

            {!user && (
              <button
                type="button"
                onClick={() => setShowEntryManualModal(true)}
                className="hidden lg:inline-flex min-h-[40px] px-3 py-1.5 rounded-xl border border-[#6FBF94]/30 bg-[#050505] text-xs font-medium text-[#A0AAA4] hover:text-[#F8F8F3] hover:border-[#6FBF94]/60 items-center gap-1.5 transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#6FBF94] neon-logo-glow" />
                <span>Bienvenida</span>
              </button>
            )}

            {/* Top-Right Login / Account Button */}
            <TopRightAuthButton
              user={user}
              onOpenAuthModal={() => setShowAuthModal(true)}
            />
          </div>
        </div>
      </header>

      {/* FLOATING LIVE LOCATION & WEATHER NOTIFICATION + INTERACTIVE CITY CALIBRATION */}
      <AnimatePresence>
        {showLocationWeatherToast && (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-20 right-4 left-4 sm:left-auto sm:right-8 z-[60] max-w-md rounded-2xl bg-[#050505]/95 backdrop-blur-xl border border-[#6FBF94]/40 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.75),0_0_14px_rgba(111,191,148,0.07)] space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1C1F1E]/60 border border-[#6FBF94]/35 flex items-center justify-center shrink-0">
                  {isLocating ? (
                    <MapPin className="w-5 h-5 text-[#6FBF94] neon-logo-glow animate-pulse" />
                  ) : (
                    <CloudSun className="w-5 h-5 text-[#6FBF94] neon-logo-glow" />
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6FBF94] block">
                    {isLocating
                      ? 'Detectando tu ubicación...'
                      : 'Ubicación y Clima Actual'}
                  </span>

                  {isLocating ? (
                    <p className="text-xs text-[#F8F8F3]">
                      Ubicándote en tu ciudad actual para calibrar el clima de conservación...
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-display font-semibold text-[#F8F8F3]">
                        Estás en {weather.cityName}
                        {weather.province ? `, ${weather.province}` : ''}
                      </p>
                      <p className="text-xs text-[#A8C4AE] font-mono-tabular">
                        Clima actual: <strong>{weather.temperature}°C</strong> ·{' '}
                        {weather.conditionLabel} · {weather.humidity}% HR
                      </p>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLocationWeatherToast(false)}
                aria-label="Cerrar notificación de clima"
                className="w-7 h-7 rounded-lg border border-[#1C1F1E] bg-[#0A0A0A] text-[#A0AAA4] hover:text-[#F8F8F3] hover:border-[#6FBF94]/50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive City Switcher & GPS Refresh inside the notification */}
            <div className="pt-2.5 border-t border-[#1C1F1E] flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-[#A0AAA4] whitespace-nowrap">Cambiar ciudad:</span>
                <select
                  value={
                    ARGENTINE_CITIES.find((c) => c.name === weather.cityName)?.id ||
                    'caba'
                  }
                  onChange={(e) => fetchWeatherByCityId(e.target.value)}
                  className="flex-1 rounded-lg border border-[#1C1F1E] bg-[#0A0A0A] px-2 py-1 text-xs text-[#F8F8F3] focus:border-[#6FBF94]/50 focus:outline-none cursor-pointer"
                >
                  {ARGENTINE_CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.province})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={triggerCityAndWeatherNotification}
                disabled={isLocating}
                className="px-2.5 py-1 rounded-lg border border-[#6FBF94]/30 bg-[#1C1F1E]/40 hover:bg-[#1C1F1E]/70 text-[#6FBF94] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                title="Detectar mi ubicación actual por GPS"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`}
                />
                <span>GPS</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT STAGE WITH ANIMATED MODULE TRANSITIONS */}
      <div className="flex-1 pb-24 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {activeSection === 'inicio' && (
              <WelcomeScreen
                onStart={() => setActiveSection('escanear')}
                onNavigateInventory={(riskFilter = 'Todos') => {
                  setInventoryInitialRiskFilter(riskFilter);
                  setActiveSection('inventario');
                }}
                onSelectDiagnosticItem={(item) => {
                  setInventoryInitialRiskFilter('Todos');
                  setInventorySelectedItem(item);
                  setActiveSection('inventario');
                }}
                onOpenWeatherCalibration={() => setShowLocationWeatherToast(true)}
                totalScansCount={totalScansCount}
                inventory={inventory}
                weather={weather}
                user={user}
              />
            )}

            {activeSection === 'escanear' && (
              <ScannerPanel
                weather={weather}
                inventoryCount={inventory.length}
                onSaveToInventory={handleSaveToInventory}
                onScanCompleted={handleScanCompleted}
                onNavigateInventory={() => {
                  setInventoryInitialRiskFilter('Todos');
                  setActiveSection('inventario');
                }}
                onNavigateImpact={() => setActiveSection('impacto')}
              />
            )}

            {activeSection === 'inventario' && (
              <InventoryView
                items={inventory}
                ambientTempC={weather.temperature}
                ambientHumidity={weather.humidity}
                initialRiskFilter={inventoryInitialRiskFilter}
                initialSelectedItem={inventorySelectedItem}
                onClearInitialSelection={() => setInventorySelectedItem(null)}
                onConsumeItem={handleConsumeItem}
                onDeleteItem={handleDeleteItem}
                onAddManualItem={handleSaveToInventory}
                onUpdateItemCondition={handleUpdateItemCondition}
                onGoToScanner={() => setActiveSection('escanear')}
              />
            )}

            {activeSection === 'impacto' && (
              <ImpactView
                impact={impact}
                onGoToScanner={() => setActiveSection('escanear')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* BOTTOM MODULE EXPLORER BAR: Fixed dark surface (#050505) + Toned-down Neon strictly on Edges & Module Logos */}
      <nav
        aria-label="Explorar módulos"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#050505] border-t border-t-[#6FBF94]/35 shadow-[0_-2px_14px_rgba(111,191,148,0.05)]"
      >
        <div className="max-w-5xl mx-auto h-18 grid grid-cols-4 items-center gap-3 px-4 sm:px-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`relative min-h-[50px] py-1.5 px-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer group ${
                  isActive
                    ? 'text-[#6FBF94]'
                    : 'text-[#A0AAA4] hover:text-[#F8F8F3]'
                }`}
              >
                {/* Animated Subtle Neon Edge Pill around active module */}
                {isActive && (
                  <motion.div
                    layoutId="activeModuleNeonEdge"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-xl border border-[#6FBF94]/45 bg-[#0A0A0A]/70 shadow-[0_0_8px_rgba(111,191,148,0.07),inset_0_0_4px_rgba(111,191,148,0.03)] pointer-events-none"
                  />
                )}

                <Icon
                  className={`relative z-10 w-5 h-5 transition-transform duration-200 ${
                    isActive
                      ? 'text-[#6FBF94] neon-logo-glow scale-105'
                      : 'text-[#6FBF94]/65 group-hover:text-[#6FBF94]'
                  }`}
                />
                <span
                  className={`relative z-10 text-[11px] font-medium tracking-tight mt-1 whitespace-nowrap ${
                    isActive ? 'text-[#6FBF94] font-semibold' : ''
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Welcome Carousel Modal right upon entering Inicio (ONLY if not logged in) */}
      {showEntryManualModal && !user && (
        <InteractiveManualCarousel
          isModal
          onDismissModal={() => setShowEntryManualModal(false)}
          onStartScan={() => {
            setShowEntryManualModal(false);
            setActiveSection('escanear');
          }}
        />
      )}

      {/* Login / Registro Modal accessible from Top-Right of every module */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        user={user}
        onSuccessAuth={handleSuccessAuth}
        onLogout={handleLogout}
        onSelectCityId={fetchWeatherByCityId}
      />
    </div>
  );
}
