import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ScanLine, Download, Target } from 'lucide-react';
import { ImpactMetrics } from '../types/cuidar.ts';
import { ScrollReveal } from './ScrollReveal.tsx';

interface ImpactViewProps {
  impact: ImpactMetrics;
  onGoToScanner: () => void;
}

export const ImpactView: React.FC<ImpactViewProps> = ({
  impact,
  onGoToScanner,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [monthlyGoalArs, setMonthlyGoalArs] = useState<number>(45000);

  const goalProgressPercent = Math.min(
    100,
    Math.round((impact.savedArs / Math.max(1000, monthlyGoalArs)) * 100)
  );

  const handleDownloadCsvReport = () => {
    const headers = ['Fecha', 'Alimento Aprovechado', 'Peso (kg)', 'Ahorro (ARS)'];
    const rows = impact.recentActions.map((act) => [
      new Date(act.timestamp).toLocaleDateString('es-AR'),
      `"${act.foodName.replace(/"/g, '""')}"`,
      act.savedKg.toString(),
      act.savedArs.toString(),
    ]);

    const summaryRows = [
      [],
      ['RESUMEN GENERAL CUIDAR', '', '', ''],
      ['Total Ahorrado (ARS)', impact.savedArs.toString(), '', ''],
      ['Total Aprovechado (kg)', impact.savedKg.toFixed(2), '', ''],
      ['Desperdicio Evitado (%)', `${impact.avoidedWastePercent}%`, '', ''],
      ['Huella CO2 Evitada (kg)', impact.co2AvoidedKg.toString(), '', ''],
      ['Agua Virtual Preservada (L)', impact.waterSavedLiters.toString(), '', ''],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      ...summaryRows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `reporte-impacto-cuidar-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 py-8 space-y-8">
      {/* Header */}
      <ScrollReveal durationMs={480} translateY={14}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-[#F8F8F3]">
              Mi Impacto
            </h1>
            <p className="text-xs sm:text-sm text-[#A0AAA4] mt-1">
              Ahorro económico y reducción de desperdicio alimentario gracias al monitoreo preventivo.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadCsvReport}
              className="min-h-[42px] px-4 py-2.5 rounded-xl bg-[#050505] border border-[#6FBF94]/30 text-[#F8F8F3] hover:border-[#6FBF94]/60 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#6FBF94] neon-logo-glow" />
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={onGoToScanner}
              className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#050505] border border-[#6FBF94]/40 text-[#6FBF94] shadow-[0_0_8px_rgba(111,191,148,0.06)] hover:bg-[#6FBF94] hover:text-[#0A0A0A] font-display font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ScanLine className="w-4 h-4 neon-logo-glow" />
              <span>Escanear alimento</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Three Primary Indicators (with Staggered ScrollReveal & Subtle Neon Edges) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Dinero ahorrado en ARS */}
        <ScrollReveal delayMs={60} durationMs={520} translateY={16}>
          <div className="h-full rounded-3xl border border-[#6FBF94]/35 bg-[#050505]/90 p-7 flex flex-col justify-between shadow-[0_0_10px_rgba(111,191,148,0.04)]">
            <span className="text-xs font-medium text-[#A0AAA4]">
              Dinero ahorrado en ARS
            </span>
            <div className="mt-4 flex items-baseline">
              <span className="text-3xl sm:text-4xl font-mono-tabular font-bold text-[#6FBF94]">
                $ {impact.savedArs.toLocaleString('es-AR')}
              </span>
              <span className="text-xs font-mono-tabular text-[#A0AAA4] ml-2">
                ARS
              </span>
            </div>
            <p className="mt-3 text-xs text-[#A0AAA4]">
              Valor estimado de frutas y verduras consumidas antes de su deterioro.
            </p>
          </div>
        </ScrollReveal>

        {/* 2. Kilogramos de alimentos aprovechados */}
        <ScrollReveal delayMs={140} durationMs={520} translateY={16}>
          <div className="h-full rounded-3xl border border-[#6FBF94]/25 bg-[#050505]/85 p-7 flex flex-col justify-between shadow-[0_0_8px_rgba(111,191,148,0.03)]">
            <span className="text-xs font-medium text-[#A0AAA4]">
              Alimentos aprovechados
            </span>
            <div className="mt-4 flex items-baseline">
              <span className="text-3xl sm:text-4xl font-mono-tabular font-bold text-[#F8F8F3]">
                {impact.savedKg.toFixed(1)}
              </span>
              <span className="text-xs font-mono-tabular text-[#A8C4AE] ml-2">
                kg
              </span>
            </div>
            <p className="mt-3 text-xs text-[#A0AAA4]">
              {impact.itemsConsumedCount} alimentos frescos aprovechados a tiempo en tu cocina.
            </p>
          </div>
        </ScrollReveal>

        {/* 3. Porcentaje de desperdicio evitado */}
        <ScrollReveal delayMs={220} durationMs={520} translateY={16}>
          <div className="h-full rounded-3xl border border-[#6FBF94]/25 bg-[#050505]/85 p-7 flex flex-col justify-between shadow-[0_0_8px_rgba(111,191,148,0.03)]">
            <span className="text-xs font-medium text-[#A0AAA4]">
              Desperdicio evitado
            </span>
            <div className="mt-4 flex items-baseline">
              <span className="text-3xl sm:text-4xl font-mono-tabular font-bold text-[#A8C4AE]">
                {impact.avoidedWastePercent}
              </span>
              <span className="text-xs font-mono-tabular text-[#A0AAA4] ml-1.5">
                %
              </span>
            </div>
            <p className="mt-3 text-xs text-[#A0AAA4]">
              Eficiencia de conservación sobre el total de alimentos registrados.
            </p>
          </div>
        </ScrollReveal>
      </div>

      {/* Interactive Monthly Household Goal Process */}
      <ScrollReveal delayMs={240} durationMs={500} translateY={15}>
        <div className="rounded-3xl border border-[#6FBF94]/25 bg-[#050505]/80 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Target className="w-5 h-5 text-[#6FBF94] neon-logo-glow shrink-0" />
              <div>
                <h2 className="text-sm font-display font-semibold text-[#F8F8F3]">
                  Meta mensual de ahorro familiar
                </h2>
                <p className="text-xs text-[#A0AAA4]">
                  Proyección anual estimada:{' '}
                  <strong className="text-[#6FBF94] font-mono-tabular">
                    $ {(impact.savedArs * 12).toLocaleString('es-AR')} ARS / año
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#A0AAA4]">Objetivo mensual:</span>
              <select
                value={monthlyGoalArs}
                onChange={(e) => setMonthlyGoalArs(Number(e.target.value))}
                className="rounded-xl border border-[#6FBF94]/30 bg-[#0A0A0A] px-3 py-1.5 text-xs font-mono-tabular text-[#F8F8F3] focus:outline-none cursor-pointer"
              >
                <option value={30000}>$ 30.000 ARS</option>
                <option value={45000}>$ 45.000 ARS</option>
                <option value={60000}>$ 60.000 ARS</option>
                <option value={90000}>$ 90.000 ARS</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#A0AAA4]">
                Progreso hacia tu meta ($ {impact.savedArs.toLocaleString('es-AR')} / ${' '}
                {monthlyGoalArs.toLocaleString('es-AR')} ARS)
              </span>
              <span className="font-mono-tabular font-semibold text-[#6FBF94]">
                {goalProgressPercent}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#1C1F1E] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#6FBF94] transition-all duration-500"
                style={{ width: `${goalProgressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Collapsible Additional Statistics */}
      <ScrollReveal delayMs={280} durationMs={500} translateY={15}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="min-h-[48px] px-5 py-3 rounded-2xl border border-[#6FBF94]/25 bg-[#050505]/85 hover:border-[#6FBF94]/55 text-xs sm:text-sm font-medium text-[#F8F8F3] flex items-center gap-2.5 transition-all cursor-pointer"
            >
              <span>
                {showDetails
                  ? 'Ocultar estadísticas adicionales'
                  : 'Desplegar estadísticas adicionales y bitácora'}
              </span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4 text-[#6FBF94]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#6FBF94]" />
              )}
            </button>
          </div>

          {showDetails && (
            <ScrollReveal durationMs={460} translateY={14}>
              <div className="rounded-3xl border border-[#6FBF94]/25 bg-[#050505]/80 p-6 space-y-6">
                {/* Environmental Footprint Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-[#1C1F1E]">
                  <div>
                    <span className="text-xs text-[#A0AAA4] block">
                      Huella de carbono evitada
                    </span>
                    <strong className="text-xl font-mono-tabular font-semibold text-[#F8F8F3] mt-1 block">
                      {impact.co2AvoidedKg} <span className="text-xs text-[#A0AAA4]">kg CO₂e</span>
                    </strong>
                  </div>

                  <div>
                    <span className="text-xs text-[#A0AAA4] block">
                      Agua virtual preservada
                    </span>
                    <strong className="text-xl font-mono-tabular font-semibold text-[#F8F8F3] mt-1 block">
                      {impact.waterSavedLiters.toLocaleString('es-AR')}{' '}
                      <span className="text-xs text-[#A0AAA4]">litros</span>
                    </strong>
                  </div>

                  <div>
                    <span className="text-xs text-[#A0AAA4] block">
                      Alimentos monitoreados
                    </span>
                    <strong className="text-xl font-mono-tabular font-semibold text-[#F8F8F3] mt-1 block">
                      {impact.itemsTrackedCount}{' '}
                      <span className="text-xs text-[#A0AAA4]">registros</span>
                    </strong>
                  </div>
                </div>

                {/* Recent Rescued Foods History */}
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-[#A0AAA4]">
                    Últimos alimentos aprovechados a tiempo
                  </h3>
                  <div className="divide-y divide-[#1C1F1E]">
                    {impact.recentActions.map((act) => (
                      <div
                        key={act.id}
                        className="py-3 flex items-center justify-between text-xs"
                      >
                        <span className="text-[#F8F8F3] font-medium">{act.foodName}</span>
                        <div className="flex items-center gap-3 font-mono-tabular">
                          <span className="text-[#A0AAA4]">{act.savedKg} kg</span>
                          <span className="text-[#6FBF94] font-semibold">
                            + $ {act.savedArs.toLocaleString('es-AR')} ARS
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>
      </ScrollReveal>
    </div>
  );
};
