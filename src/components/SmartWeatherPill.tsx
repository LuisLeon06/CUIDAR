import React, { useState } from 'react';
import { CloudSun, Droplets, LocateFixed, MapPin, Thermometer, ChevronDown, X, Info } from 'lucide-react';
import { ArgentineCityWeather } from '../types/cuidar.ts';
import { ARGENTINE_CITIES } from '../lib/predictionEngine.ts';

interface SmartWeatherPillProps {
  weather: ArgentineCityWeather;
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
  onUseGeolocation: () => void;
  isLocating: boolean;
}

export const SmartWeatherPill: React.FC<SmartWeatherPillProps> = ({
  weather,
  selectedCityId,
  onSelectCity,
  onUseGeolocation,
  isLocating,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatDayLabel = (dateStr: string, index: number) => {
    if (index === 0) return 'Hoy';
    if (index === 1) return 'Mañana';
    try {
      const date = new Date(`${dateStr}T12:00:00`);
      if (Number.isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="min-h-[40px] flex items-center gap-2.5 rounded-xl border border-[#6FBF94]/20 bg-[#1C1F1E]/40 hover:bg-[#1C1F1E]/70 hover:border-[#6FBF94]/45 px-3.5 py-2 text-xs text-[#F8F8F3] transition-colors whitespace-nowrap shrink-0"
        title="Clima exterior inteligente (Open-Meteo)"
      >
        <CloudSun className="w-4 h-4 text-[#6FBF94] shrink-0" />
        <span className="font-medium truncate max-w-[115px] sm:max-w-[160px]">{weather.cityName}</span>
        <span aria-hidden="true" className="text-[#A0AAA4]">·</span>
        <span className="font-mono-tabular font-semibold text-[#6FBF94]">{weather.temperature}°C</span>
        <span aria-hidden="true" className="hidden sm:inline text-[#A0AAA4]">·</span>
        <span className="hidden sm:inline font-mono-tabular text-[#A0AAA4]">{weather.humidity}% HR</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#A0AAA4]" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 pt-16 sm:pt-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#6FBF94]/25 bg-[#0A0A0A] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1C1F1E] pb-4">
              <div>
                <h3 className="text-lg font-display font-semibold text-[#F8F8F3]">
                  Clima Inteligente · Open-Meteo
                </h3>
                <p className="text-xs text-[#A0AAA4] mt-0.5">
                  {weather.cityName}, {weather.province} · {weather.conditionLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#A0AAA4] hover:text-[#F8F8F3] hover:bg-[#1C1F1E]/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Primary Current Metrics */}
            <div className="grid grid-cols-2 gap-4 my-5">
              <div className="rounded-xl bg-[#1C1F1E]/35 border border-[#6FBF94]/15 p-4">
                <div className="flex items-center gap-2 text-xs text-[#A0AAA4]">
                  <Thermometer className="w-3.5 h-3.5 text-[#6FBF94]" />
                  <span>Temperatura exterior</span>
                </div>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl font-mono-tabular font-semibold text-[#F8F8F3]">
                    {weather.temperature}
                  </span>
                  <span className="text-xs font-mono-tabular text-[#A0AAA4] ml-1.5">°C</span>
                </div>
              </div>

              <div className="rounded-xl bg-[#1C1F1E]/35 border border-[#6FBF94]/15 p-4">
                <div className="flex items-center gap-2 text-xs text-[#A0AAA4]">
                  <Droplets className="w-3.5 h-3.5 text-[#A8C4AE]" />
                  <span>Humedad relativa</span>
                </div>
                <div className="mt-2 flex items-baseline">
                  <span className="text-2xl font-mono-tabular font-semibold text-[#F8F8F3]">
                    {weather.humidity}
                  </span>
                  <span className="text-xs font-mono-tabular text-[#A0AAA4] ml-1.5">% HR</span>
                </div>
              </div>
            </div>

            {/* Location Selector & GPS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="city-selector"
                  className="text-xs font-medium text-[#A0AAA4] flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#6FBF94]" />
                  <span>Ciudad de referencia en Argentina</span>
                </label>
                <button
                  type="button"
                  onClick={onUseGeolocation}
                  disabled={isLocating}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#6FBF94] hover:text-[#A8C4AE] transition-colors disabled:opacity-50"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>{isLocating ? 'Localizando...' : 'Usar mi GPS'}</span>
                </button>
              </div>

              <select
                id="city-selector"
                value={selectedCityId}
                onChange={(e) => onSelectCity(e.target.value)}
                className="w-full rounded-xl border border-[#1C1F1E] bg-[#1C1F1E]/40 px-3.5 py-2.5 text-sm text-[#F8F8F3] focus:border-[#6FBF94] focus:outline-none"
              >
                {ARGENTINE_CITIES.map((city) => (
                  <option key={city.id} value={city.id} className="bg-[#0A0A0A] text-[#F8F8F3]">
                    {city.name} ({city.province})
                  </option>
                ))}
              </select>
            </div>

            {/* 3-Day Forecast */}
            <div className="mt-5 pt-4 border-t border-[#1C1F1E]">
              <h4 className="text-xs font-medium text-[#A0AAA4] mb-3">
                Pronóstico ambiental próximos 3 días
              </h4>
              <div className="grid grid-cols-3 gap-2.5">
                {weather.forecast.slice(0, 3).map((day, idx) => (
                  <div
                    key={day.date}
                    className="rounded-xl bg-[#1C1F1E]/25 border border-[#1C1F1E] p-3 text-center"
                  >
                    <div className="text-xs font-medium text-[#F8F8F3]">
                      {formatDayLabel(day.date, idx)}
                    </div>
                    <div className="text-sm font-mono-tabular font-semibold text-[#6FBF94] mt-1">
                      {day.tempMax}° <span className="text-[#A0AAA4] font-normal">/ {day.tempMin}°</span>
                    </div>
                    <div className="text-[11px] font-mono-tabular text-[#A0AAA4] mt-0.5">
                      {day.humidityMean}% HR
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Distinction note between exterior climate and real storage */}
            <div className="mt-5 rounded-xl bg-[#1C1F1E]/30 border border-[#6FBF94]/15 p-3.5 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#6FBF94] shrink-0 mt-0.5" />
              <p className="text-xs text-[#A0AAA4] leading-relaxed">
                <strong className="text-[#F8F8F3]">Nota térmica:</strong> El clima exterior orienta la conservación en alacena o frutera, pero el motor de CUIDAR distingue siempre la temperatura real de almacenamiento (ej. Heladera a 4 °C).
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
