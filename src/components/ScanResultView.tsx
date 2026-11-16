import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  CutState,
  FoodAnalysisResult,
  StorageCondition,
} from '../types/cuidar.ts';
import { CircularRiskGauge } from './CircularRiskGauge.tsx';
import { ResilientImage } from './ResilientImage.tsx';
import { computePredictionModel } from '../lib/predictionEngine.ts';
import { ScrollReveal } from './ScrollReveal.tsx';

interface ScanResultViewProps {
  result: FoodAnalysisResult;
  ambientTempC: number;
  ambientHumidity: number;
  onSaveToInventory: (updatedResult: FoodAnalysisResult) => void;
  onResetScan: () => void;
}

export const ScanResultView: React.FC<ScanResultViewProps> = ({
  result,
  ambientTempC,
  ambientHumidity,
  onSaveToInventory,
  onResetScan,
}) => {
  const [liveResult, setLiveResult] = useState<FoodAnalysisResult>(result);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Recalculate prediction when user adjusts state or storage condition interactively
  const handleRecalculate = (
    newCutState: CutState,
    newStorage: StorageCondition,
    newHours: number
  ) => {
    const recalculated = computePredictionModel({
      foodName: liveResult.name,
      variety: liveResult.variety,
      category: liveResult.category,
      cutState: newCutState,
      ripenessLevel: liveResult.analysis.ripenessLevel,
      storageCondition: newStorage,
      hoursSinceCut: newHours,
      ambientTempC,
      ambientHumidity,
      imageUrl: liveResult.imageUrl,
    });
    setLiveResult({
      ...recalculated,
      id: liveResult.id,
    });
  };

  const handleSave = () => {
    setSavedToast(true);
    onSaveToInventory(liveResult);
  };

  const getHorizonBarColor = (val: number) => {
    if (val >= 65) return 'bg-[#F28B82]';
    if (val >= 38) return 'bg-[#F5C469]';
    return 'bg-[#6FBF94]';
  };

  return (
    <ScrollReveal
      className="w-full max-w-xl mx-auto space-y-6"
      durationMs={520}
      translateY={16}
    >
      {/* Main Minimalist Result Card */}
      <div className="rounded-3xl border border-[#6FBF94]/35 bg-[#050505]/85 backdrop-blur-md p-6 sm:p-8 shadow-2xl">
        {/* Top Row: Food Identity + Circular Risk Gauge */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-[#6FBF94]/30 shrink-0">
              <ResilientImage
                src={liveResult.imageUrl}
                alt={liveResult.name}
                fallbackLabel={liveResult.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-xs text-[#A0AAA4]">
                <span>{liveResult.category}</span>
                {liveResult.variety && (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span>{liveResult.variety}</span>
                  </>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#F8F8F3] tracking-tight">
                {liveResult.name}
              </h2>

              <div className="space-y-0.5 pt-1 text-sm">
                <p className="text-[#A0AAA4]">
                  Estado:{' '}
                  <strong className="text-[#F8F8F3] font-medium">
                    {liveResult.cutState}
                  </strong>
                </p>
                <p className="text-[#A0AAA4]">
                  Vida útil estimada:{' '}
                  <strong className="text-[#6FBF94] font-mono-tabular font-semibold">
                    {liveResult.estimatedShelfLife}
                  </strong>
                </p>
                <p className="text-[#A0AAA4]">
                  Riesgo de deterioro:{' '}
                  <strong
                    className={`font-medium ${
                      liveResult.riskLevel === 'Elevado'
                        ? 'text-[#F28B82]'
                        : liveResult.riskLevel === 'Moderado'
                        ? 'text-[#F5C469]'
                        : 'text-[#6FBF94]'
                    }`}
                  >
                    {liveResult.riskLevel}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* Animated Circular Risk Indicator */}
          <div className="shrink-0">
            <CircularRiskGauge
              score={liveResult.riskScore}
              riskLevel={liveResult.riskLevel}
              size={130}
            />
          </div>
        </div>

        {/* Clean 24h / 48h / 72h Prediction Horizon */}
        <div className="mt-7 pt-5 border-t border-[#1C1F1E] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A0AAA4]">
              Proyección de deterioro (24h · 48h · 72h)
            </span>
            <button
              type="button"
              onClick={() => setShowSimulator(!showSimulator)}
              className="flex items-center gap-1.5 text-xs text-[#6FBF94] hover:text-[#A8C4AE] transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showSimulator ? 'Ocultar parámetros' : 'Ajustar condición'}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'A 24 horas', value: liveResult.horizon.risk24h },
              { label: 'A 48 horas', value: liveResult.horizon.risk48h },
              { label: 'A 72 horas', value: liveResult.horizon.risk72h },
            ].map((step) => (
              <div
                key={step.label}
                className="rounded-xl bg-[#0A0A0A]/65 border border-[#1C1F1E] p-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#A0AAA4]">{step.label}</span>
                  <span className="font-mono-tabular font-semibold text-[#F8F8F3]">
                    {step.value}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-[#1C1F1E] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getHorizonBarColor(
                      step.value
                    )}`}
                    style={{ width: `${step.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Parameter Adjuster (Collapsible) */}
          {showSimulator && (
            <div className="mt-3 rounded-2xl bg-[#0A0A0A]/80 border border-[#6FBF94]/20 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-[#A0AAA4]">Integridad física:</span>
                <div className="flex items-center gap-1 bg-[#1C1F1E]/50 p-1 rounded-xl">
                  {(['Entero', 'Cortado', 'Pelado'] as CutState[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() =>
                        handleRecalculate(
                          st,
                          liveResult.analysis.conservationCondition,
                          st === 'Entero' ? 0 : Math.max(2, liveResult.hoursSinceCut)
                        )
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        liveResult.cutState === st
                          ? 'bg-[#6FBF94] text-[#0A0A0A] font-semibold'
                          : 'text-[#A0AAA4] hover:text-[#F8F8F3]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-[#A0AAA4]">Conservación real:</span>
                <div className="flex items-center gap-1 bg-[#1C1F1E]/50 p-1 rounded-xl">
                  {(
                    [
                      'Heladera (4°C)',
                      'Alacena fresca (15°C)',
                      'Temperatura ambiente',
                    ] as StorageCondition[]
                  ).map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() =>
                        handleRecalculate(
                          liveResult.cutState,
                          cond,
                          liveResult.hoursSinceCut
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        liveResult.analysis.conservationCondition === cond
                          ? 'bg-[#6FBF94] text-[#0A0A0A] font-semibold'
                          : 'text-[#A0AAA4] hover:text-[#F8F8F3]'
                      }`}
                    >
                      {cond === 'Heladera (4°C)'
                        ? 'Heladera 4°C'
                        : cond === 'Alacena fresca (15°C)'
                        ? 'Alacena 15°C'
                        : 'Ambiente'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Button 1: "Ver análisis" */}
        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="w-full min-h-[48px] flex items-center justify-between px-4 py-3 rounded-2xl border border-[#1C1F1E] bg-[#0A0A0A]/55 hover:border-[#6FBF94]/40 text-sm font-medium text-[#F8F8F3] transition-colors cursor-pointer"
          >
            <span>Ver análisis</span>
            {showAnalysis ? (
              <ChevronUp className="w-4 h-4 text-[#6FBF94]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#A0AAA4]" />
            )}
          </button>

          {showAnalysis && (
            <div className="rounded-2xl bg-[#0A0A0A]/75 border border-[#1C1F1E] p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <span className="text-[#A0AAA4] block">Temperatura de conservación</span>
                  <strong className="text-[#F8F8F3] font-mono-tabular mt-0.5 block">
                    {liveResult.analysis.temperatureCurrent}
                  </strong>
                  <span className="text-[11px] text-[#6FBF94]">
                    Óptimo: {liveResult.analysis.temperatureOptimal}
                  </span>
                </div>

                <div>
                  <span className="text-[#A0AAA4] block">Humedad relativa</span>
                  <strong className="text-[#F8F8F3] font-mono-tabular mt-0.5 block">
                    {liveResult.analysis.humidityCurrent}
                  </strong>
                  <span className="text-[11px] text-[#A8C4AE]">
                    Óptimo: {liveResult.analysis.humidityOptimal}
                  </span>
                </div>

                <div>
                  <span className="text-[#A0AAA4] block">Nivel de maduración</span>
                  <strong className="text-[#F8F8F3] mt-0.5 block">
                    {liveResult.analysis.ripenessLevel}
                  </strong>
                </div>

                <div>
                  <span className="text-[#A0AAA4] block">Condiciones de conservación</span>
                  <strong className="text-[#F8F8F3] mt-0.5 block">
                    {liveResult.analysis.conservationCondition}
                  </strong>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1C1F1E]">
                <span className="text-[#A0AAA4] block mb-1">Estado físico detectado</span>
                <p className="text-[#F8F8F3] leading-relaxed">
                  {liveResult.analysis.physicalState}
                </p>
              </div>

              <div className="pt-2 border-t border-[#1C1F1E]">
                <span className="text-[#A0AAA4] block mb-1.5">
                  Factores que afectan su deterioro
                </span>
                <ul className="space-y-1.5 text-[#F8F8F3]">
                  {liveResult.analysis.deteriorationFactors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#6FBF94]">·</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Collapsible Button 2: "Recomendaciones" */}
          <button
            type="button"
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="w-full min-h-[48px] flex items-center justify-between px-4 py-3 rounded-2xl border border-[#1C1F1E] bg-[#0A0A0A]/55 hover:border-[#6FBF94]/40 text-sm font-medium text-[#F8F8F3] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6FBF94]" />
              <span>Recomendaciones</span>
            </span>
            {showRecommendations ? (
              <ChevronUp className="w-4 h-4 text-[#6FBF94]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#A0AAA4]" />
            )}
          </button>

          {showRecommendations && (
            <div className="rounded-2xl bg-[#0A0A0A]/75 border border-[#6FBF94]/20 p-5 space-y-2.5 text-xs text-[#F8F8F3]">
              {liveResult.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="font-mono-tabular text-[#6FBF94] font-semibold">
                    0{i + 1}.
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orientative Scientific Disclaimer */}
        <div className="mt-5 flex items-center gap-2 text-[11px] text-[#A0AAA4]">
          <ShieldAlert className="w-3.5 h-3.5 text-[#A8C4AE] shrink-0" />
          <span>{liveResult.scientificDisclaimer}</span>
        </div>

        {/* Primary Action & Secondary Reset */}
        <div className="mt-6 pt-4 border-t border-[#1C1F1E] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={savedToast}
            className="flex-1 min-h-[48px] rounded-2xl bg-[#6FBF94] text-[#0A0A0A] font-display font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#A8C4AE] transition-colors cursor-pointer disabled:opacity-80"
          >
            <Check className="w-4 h-4" />
            <span>
              {savedToast ? 'Guardado en tu inventario' : 'Guardar en inventario'}
            </span>
          </button>

          <button
            type="button"
            onClick={onResetScan}
            className="min-h-[48px] px-5 rounded-2xl border border-[#1C1F1E] bg-[#0A0A0A]/60 text-[#A0AAA4] hover:text-[#F8F8F3] hover:border-[#6FBF94]/35 text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Escanear otro</span>
          </button>
        </div>
      </div>
    </ScrollReveal>
  );
};
