import React from 'react';
import {
  ArrowRight,
  ScanLine,
  Activity,
  Clock,
  AlertTriangle,
  Thermometer,
} from 'lucide-react';
import { ArgentineCityWeather, FoodAnalysisResult, RiskLevel } from '../types/cuidar.ts';
import { ResilientImage } from './ResilientImage.tsx';
import { InteractiveManualCarousel } from './InteractiveManualCarousel.tsx';
import { CuidarLogo, CuidarUser, TopRightAuthButton } from './AuthModal.tsx';
import { ScrollReveal } from './ScrollReveal.tsx';

const HERO_IMAGE_PATH = '/assets/images/hero_welcome_woman_scanning_1794792027154.jpg';

interface CoverScreenProps {
  onEnterApp: () => void;
  user: CuidarUser | null;
  onOpenAuthModal: () => void;
}

/**
 * 1. PORTADA DE BIENVENIDA (Pantalla completa inicial antes de ingresar a la app)
 */
export const CoverScreen: React.FC<CoverScreenProps> = ({
  onEnterApp,
  user,
  onOpenAuthModal,
}) => {
  return (
    <div className="relative min-h-screen w-full bg-[#0A0A0A] text-[#F8F8F3] flex flex-col justify-between overflow-hidden">
      {/* Protagonist Cinematic Background Image — Focal point calibrated for Mobile & Desktop */}
      <div className="absolute inset-0 z-0">
        <ResilientImage
          src={HERO_IMAGE_PATH}
          alt="Mujer sonriendo mientras escanea vegetales frescos con su celular en una cocina luminosa"
          className="w-full h-full object-cover object-[66%_28%] sm:object-center scale-[1.01] transition-transform duration-1000"
        />
        {/* Top subtle vignette for logo & login button legibility */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0A0A0A]/70 via-[#0A0A0A]/25 to-transparent" />
        {/* Bottom-only contrast scrim on mobile so the upper 60% of the photo stays luminous & clear */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/65 via-40% to-transparent sm:via-[#0A0A0A]/70 sm:to-[#0A0A0A]/25" />
        {/* Side scrim only on wider desktop screens where text sits on the left */}
        <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/85 via-[#0A0A0A]/40 to-transparent" />
      </div>

      {/* Floating Top Area (NO Header Bar on Welcome Cover) */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 pt-8 flex items-center justify-between gap-6">
        <CuidarLogo size="md" />
        <TopRightAuthButton
          user={user}
          onOpenAuthModal={onOpenAuthModal}
          variant="cover"
        />
      </div>

      {/* Main Protagonist Content Area */}
      <main className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 pb-16 pt-16 md:py-20 flex flex-col justify-end">
        <ScrollReveal className="max-w-2xl space-y-6" durationMs={540} translateY={18}>
          {/* Subtle Slogan */}
          <p className="text-sm sm:text-base font-medium text-[#A8C4AE] tracking-wide">
            La inteligencia de cuidar lo que importa
          </p>

          {/* Main Headline */}
          <h1
            className="text-3xl sm:text-5xl lg:text-[3.35rem] font-display font-semibold text-[#F8F8F3] leading-[1.1] tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            Conocé lo que tus alimentos necesitan antes de que sea tarde
          </h1>

          {/* Primary CTA ("Comenzar") ONLY — triggers live city & weather notification upon click */}
          <div className="pt-2 flex items-center">
            <button
              type="button"
              onClick={onEnterApp}
              className="min-h-[54px] px-9 py-4 rounded-2xl bg-[#6FBF94] text-[#0A0A0A] font-display font-semibold text-base flex items-center justify-center gap-3 shadow-[0_0_16px_rgba(111,191,148,0.13)] hover:bg-[#A8C4AE] active:scale-[0.99] transition-all whitespace-nowrap cursor-pointer"
            >
              <span>Comenzar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
};

interface WelcomeScreenProps {
  onStart: () => void;
  onNavigateInventory: (initialRiskFilter?: 'Todos' | RiskLevel) => void;
  onSelectDiagnosticItem: (item: FoodAnalysisResult) => void;
  onOpenWeatherCalibration: () => void;
  totalScansCount: number;
  inventory: FoodAnalysisResult[];
  weather: ArgentineCityWeather;
  user: CuidarUser | null;
}

/**
 * 2. PANEL DE INICIO (Dashboard Operativo Interactivo + Carrusel de Bienvenida si NO está logueado)
 */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStart,
  onNavigateInventory,
  onSelectDiagnosticItem,
  onOpenWeatherCalibration,
  totalScansCount,
  inventory,
  weather,
  user,
}) => {
  const isLoggedIn = Boolean(user);

  const urgentItemsCount = inventory.filter(
    (item) => item.riskLevel === 'Elevado' || item.remainingHours <= 48
  ).length;

  const cutOrPeeledCount = inventory.filter(
    (item) => item.cutState !== 'Entero'
  ).length;

  const avgFreshnessIndex =
    inventory.length > 0
      ? Math.round(
          inventory.reduce((acc, item) => acc + Math.max(10, 100 - item.riskScore), 0) /
            inventory.length
        )
      : 92;

  const avgRemainingHours =
    inventory.length > 0
      ? Math.round(
          inventory.reduce((acc, item) => acc + item.remainingHours, 0) /
            inventory.length
        )
      : 72;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 py-8 space-y-9">
      {/* Section Title & Quick Scan Button */}
      <ScrollReveal durationMs={480} translateY={14}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-[#6FBF94] tracking-wide">
              La inteligencia de cuidar lo que importa
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#F8F8F3]">
              {user ? `Hola, ${user.name}` : 'Inicio · Tu cocina hoy'}
            </h1>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#050505] border border-[#6FBF94]/40 text-[#6FBF94] shadow-[0_0_8px_rgba(111,191,148,0.06)] hover:bg-[#6FBF94] hover:text-[#0A0A0A] font-display font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer"
          >
            <ScanLine className="w-4 h-4 neon-logo-glow" />
            <span>Ir a Escanear</span>
          </button>
        </div>
      </ScrollReveal>

      {/* 1. Carrusel de Bienvenida Deslizable (Oculto automáticamente cuando el usuario está logueado) */}
      {!isLoggedIn && (
        <ScrollReveal delayMs={70} durationMs={520} translateY={16}>
          <section aria-label="Carrusel de bienvenida">
            <InteractiveManualCarousel onStartScan={onStart} />
          </section>
        </ScrollReveal>
      )}

      {/* 2. Operational Telemetry Dashboard (Interactive Cards connected to app processes) */}
      <section className="space-y-4">
        <ScrollReveal delayMs={100} durationMs={480} translateY={14}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-semibold text-[#F8F8F3]">
                Métricas de Escaneo y Estado Celular
              </h2>
              <p className="text-xs text-[#A0AAA4]">
                Tocá cualquier tarjeta para accionar el proceso correspondiente en tiempo real.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Total de Escaneos Realizados -> Ir a Escanear */}
          <ScrollReveal delayMs={80} durationMs={500} translateY={16}>
            <button
              type="button"
              onClick={onStart}
              className="w-full h-full text-left rounded-2xl border border-[#6FBF94]/35 bg-[#050505]/85 hover:border-[#6FBF94]/65 p-5 flex flex-col justify-between shadow-[0_0_10px_rgba(111,191,148,0.04)] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-[#A0AAA4] w-full">
                <span>Veces que escaneaste</span>
                <ScanLine className="w-4 h-4 text-[#6FBF94] neon-logo-glow group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-mono-tabular font-bold text-[#6FBF94]">
                  {totalScansCount}
                </span>
                <span className="text-xs font-mono-tabular text-[#A0AAA4] ml-2">
                  escaneos
                </span>
              </div>
              <p className="mt-2 text-[11px] text-[#A0AAA4]">
                Nuevo escaneo óptico → <strong className="text-[#F8F8F3] font-mono-tabular">97.8%</strong>
              </p>
            </button>
          </ScrollReveal>

          {/* Metric 2: Índice de Frescura Media -> Ver Inventario */}
          <ScrollReveal delayMs={150} durationMs={500} translateY={16}>
            <button
              type="button"
              onClick={() => onNavigateInventory('Todos')}
              className="w-full h-full text-left rounded-2xl border border-[#6FBF94]/25 bg-[#050505]/80 hover:border-[#6FBF94]/55 p-5 flex flex-col justify-between shadow-[0_0_8px_rgba(111,191,148,0.03)] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-[#A0AAA4] w-full">
                <span>Vitalidad celular media</span>
                <Activity className="w-4 h-4 text-[#6FBF94] neon-logo-glow group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-mono-tabular font-bold text-[#F8F8F3]">
                  {avgFreshnessIndex}
                </span>
                <span className="text-xs font-mono-tabular text-[#6FBF94] ml-1.5">
                  / 100
                </span>
              </div>
              <p className="mt-2 text-[11px] text-[#A0AAA4]">
                Calculado sobre <strong className="text-[#F8F8F3] font-mono-tabular">{inventory.length}</strong> alimentos activos
              </p>
            </button>
          </ScrollReveal>

          {/* Metric 3: Prioridad de Consumo (< 48 h) -> Filtrar Riesgo Elevado en Inventario */}
          <ScrollReveal delayMs={220} durationMs={500} translateY={16}>
            <button
              type="button"
              onClick={() => onNavigateInventory('Elevado')}
              className="w-full h-full text-left rounded-2xl border border-[#6FBF94]/25 bg-[#050505]/80 hover:border-[#F28B82]/60 p-5 flex flex-col justify-between shadow-[0_0_8px_rgba(111,191,148,0.03)] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-[#A0AAA4] w-full">
                <span>Atención prioritaria (&lt; 48h)</span>
                <AlertTriangle className="w-4 h-4 text-[#F28B82] group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-mono-tabular font-bold text-[#F8F8F3]">
                  {urgentItemsCount}
                </span>
                <span className="text-xs font-mono-tabular text-[#A0AAA4] ml-2">
                  alimentos
                </span>
              </div>
              <p className="mt-2 text-[11px] text-[#A0AAA4]">
                <strong className="text-[#F8F8F3] font-mono-tabular">{cutOrPeeledCount}</strong> cortados · Filtrar urgentes →
              </p>
            </button>
          </ScrollReveal>

          {/* Metric 4: Ventana de Conservación Media / Clima Local -> Abrir Calibración Climática */}
          <ScrollReveal delayMs={290} durationMs={500} translateY={16}>
            <button
              type="button"
              onClick={onOpenWeatherCalibration}
              className="w-full h-full text-left rounded-2xl border border-[#6FBF94]/25 bg-[#050505]/80 hover:border-[#6FBF94]/55 p-5 flex flex-col justify-between shadow-[0_0_8px_rgba(111,191,148,0.03)] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs text-[#A0AAA4] w-full">
                <span>Ventana media restante</span>
                <Clock className="w-4 h-4 text-[#6FBF94] neon-logo-glow group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-3 flex items-baseline">
                <span className="text-3xl font-mono-tabular font-bold text-[#A8C4AE]">
                  {avgRemainingHours}
                </span>
                <span className="text-xs font-mono-tabular text-[#A0AAA4] ml-1.5">
                  horas prom.
                </span>
              </div>
              <p className="mt-2 text-[11px] text-[#A0AAA4] flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-[#6FBF94] neon-logo-glow shrink-0" />
                <span className="truncate">
                  {weather.cityName}: {weather.temperature}°C ({weather.humidity}% HR)
                </span>
              </p>
            </button>
          </ScrollReveal>
        </div>
      </section>

      {/* 3. Recent Optical Diagnostics Strip */}
      <ScrollReveal delayMs={120} durationMs={540} translateY={18}>
        <section className="rounded-3xl border border-[#6FBF94]/25 bg-[#050505]/75 p-6 space-y-4 shadow-[0_0_10px_rgba(111,191,148,0.03)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-display font-semibold text-[#F8F8F3]">
                Últimos diagnósticos de escaneo
              </h3>
              <p className="text-xs text-[#A0AAA4]">
                Seleccioná cualquier alimento para inspeccionar o actualizar su estado en el inventario.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateInventory('Todos')}
              className="text-xs font-medium text-[#6FBF94] hover:text-[#A8C4AE] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ver inventario ({inventory.length})</span>
              <ArrowRight className="w-3.5 h-3.5 neon-logo-glow" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {inventory.slice(0, 3).map((item, idx) => (
              <ScrollReveal
                key={item.id}
                delayMs={idx * 80}
                durationMs={480}
                translateY={14}
              >
                <button
                  type="button"
                  onClick={() => onSelectDiagnosticItem(item)}
                  className="w-full text-left rounded-2xl border border-[#6FBF94]/20 bg-[#0A0A0A]/85 hover:border-[#6FBF94]/55 p-3.5 flex items-center gap-3.5 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#6FBF94]/25 shrink-0">
                    <ResilientImage
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-display font-semibold text-[#F8F8F3] truncate">
                        {item.name}
                      </span>
                      <span className="text-[11px] font-mono-tabular text-[#6FBF94] shrink-0">
                        {item.estimatedShelfLife}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#A0AAA4] truncate mt-0.5">
                      {item.cutState} · Riesgo 24h: {item.horizon.risk24h}%
                    </p>
                  </div>
                </button>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
};
