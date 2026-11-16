import React, { useState, useEffect } from 'react';
import {
  Check,
  Trash2,
  X,
  ScanLine,
  ShieldAlert,
  Plus,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import {
  CutState,
  FoodAnalysisResult,
  FoodCategory,
  RipenessState,
  RiskLevel,
  StorageCondition,
} from '../types/cuidar.ts';
import { BOTANICAL_PROFILES, computePredictionModel } from '../lib/predictionEngine.ts';
import { ResilientImage } from './ResilientImage.tsx';
import { CircularRiskGauge } from './CircularRiskGauge.tsx';
import { ScrollReveal } from './ScrollReveal.tsx';

interface InventoryViewProps {
  items: FoodAnalysisResult[];
  ambientTempC: number;
  ambientHumidity: number;
  initialRiskFilter?: 'Todos' | RiskLevel;
  initialSelectedItem?: FoodAnalysisResult | null;
  onClearInitialSelection?: () => void;
  onConsumeItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onAddManualItem: (item: FoodAnalysisResult) => void;
  onUpdateItemCondition: (
    id: string,
    updates: {
      cutState: CutState;
      ripenessLevel: RipenessState;
      storageCondition: StorageCondition;
      hoursSinceCut: number;
    }
  ) => void;
  onGoToScanner: () => void;
}

type SortOption = 'risk_desc' | 'hours_asc' | 'value_desc';

export const InventoryView: React.FC<InventoryViewProps> = ({
  items,
  ambientTempC,
  ambientHumidity,
  initialRiskFilter = 'Todos',
  initialSelectedItem = null,
  onClearInitialSelection,
  onConsumeItem,
  onDeleteItem,
  onAddManualItem,
  onUpdateItemCondition,
  onGoToScanner,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'Todos' | FoodCategory>('Todos');
  const [riskFilter, setRiskFilter] = useState<'Todos' | RiskLevel>(initialRiskFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('risk_desc');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    initialSelectedItem?.id || null
  );

  // Manual Add Food Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [presetKey, setPresetKey] = useState<string>('tomate');
  const [customName, setCustomName] = useState('');
  const [manualCategory, setManualCategory] = useState<FoodCategory>('Verduras');
  const [manualCutState, setManualCutState] = useState<CutState>('Entero');
  const [manualRipeness, setManualRipeness] = useState<RipenessState>('Óptimo');
  const [manualStorage, setManualStorage] =
    useState<StorageCondition>('Heladera (4°C)');
  const [manualWeightKg, setManualWeightKg] = useState<string>('0.35');
  const [manualValueArs, setManualValueArs] = useState<string>('1500');

  useEffect(() => {
    setRiskFilter(initialRiskFilter);
  }, [initialRiskFilter]);

  useEffect(() => {
    if (initialSelectedItem) {
      setSelectedItemId(initialSelectedItem.id);
    }
  }, [initialSelectedItem]);

  const selectedItem = items.find((i) => i.id === selectedItemId) || null;

  const closeDetailModal = () => {
    setSelectedItemId(null);
    if (onClearInitialSelection) onClearInitialSelection();
  };

  const handleSelectPresetInModal = (key: string) => {
    setPresetKey(key);
    setCustomName('');
    const prof = BOTANICAL_PROFILES[key];
    if (prof) {
      setManualCategory(prof.category);
      setManualWeightKg(String(prof.avgWeightKg));
      setManualValueArs(String(prof.avgPriceArs));
    }
  };

  const handleCreateManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    const prof = BOTANICAL_PROFILES[presetKey] || BOTANICAL_PROFILES.tomate;
    const finalName = customName.trim() || prof.name;

    const computed = computePredictionModel({
      foodName: finalName,
      variety: customName.trim() ? 'Registro manual de cocina' : prof.variety,
      category: manualCategory,
      cutState: manualCutState,
      ripenessLevel: manualRipeness,
      storageCondition: manualStorage,
      hoursSinceCut: manualCutState === 'Entero' ? 0 : 2,
      ambientTempC,
      ambientHumidity,
      imageUrl: prof.defaultImageUrl,
    });

    const newItem: FoodAnalysisResult = {
      ...computed,
      estimatedWeightKg: Math.max(0.05, parseFloat(manualWeightKg) || prof.avgWeightKg),
      estimatedValueArs: Math.max(100, parseInt(manualValueArs, 10) || prof.avgPriceArs),
    };

    onAddManualItem(newItem);
    setShowAddModal(false);
    setCustomName('');
  };

  const filteredItems = items
    .filter((item) => {
      const matchesCat = categoryFilter === 'Todos' || item.category === categoryFilter;
      const matchesRisk = riskFilter === 'Todos' || item.riskLevel === riskFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.variety || '').toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCat && matchesRisk && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'risk_desc') return b.riskScore - a.riskScore;
      if (sortBy === 'hours_asc') return a.remainingHours - b.remainingHours;
      return (b.estimatedValueArs || 0) - (a.estimatedValueArs || 0);
    });

  const getRiskTextStyle = (level: RiskLevel) => {
    if (level === 'Elevado') return 'text-[#F28B82]';
    if (level === 'Moderado') return 'text-[#F5C469]';
    return 'text-[#6FBF94]';
  };

  const getRiskGlyph = (level: RiskLevel) => {
    if (level === 'Elevado') return '▲';
    if (level === 'Moderado') return '◆';
    return '●';
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-5 sm:px-10 py-8 space-y-7">
      {/* Header & Primary Actions */}
      <ScrollReveal durationMs={480} translateY={14}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-[#F8F8F3]">
              Inventario Inteligente
            </h1>
            <p className="text-xs sm:text-sm text-[#A0AAA4] mt-1">
              Seleccioná cualquier alimento para actualizar su conservación, ver su curva 24h · 48h · 72h o marcarlo como aprovechado.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="min-h-[42px] px-4 py-2.5 rounded-xl bg-[#050505] border border-[#6FBF94]/30 text-[#F8F8F3] hover:border-[#6FBF94]/65 font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#6FBF94] neon-logo-glow" />
              <span>Agregar manual</span>
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

      {/* Search, Sort & Interactive Filter Controls */}
      <ScrollReveal delayMs={70} durationMs={500} translateY={15}>
        <div className="space-y-3">
          {/* Search + Sort Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#6FBF94] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar fruta o verdura en tu inventario..."
                className="w-full rounded-xl border border-[#6FBF94]/25 bg-[#050505]/80 pl-10 pr-4 py-2 text-xs sm:text-sm text-[#F8F8F3] placeholder:text-[#A0AAA4]/60 focus:border-[#6FBF94]/55 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#6FBF94]/25 bg-[#050505]/80 px-3 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#6FBF94] shrink-0" />
              <span className="text-xs text-[#A0AAA4] whitespace-nowrap">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs text-[#F8F8F3] font-medium focus:outline-none cursor-pointer"
              >
                <option value="risk_desc" className="bg-[#0A0A0A]">
                  Mayor riesgo / Prioridad
                </option>
                <option value="hours_asc" className="bg-[#0A0A0A]">
                  Menor tiempo restante
                </option>
                <option value="value_desc" className="bg-[#0A0A0A]">
                  Mayor valor en ARS
                </option>
              </select>
            </div>
          </div>

          {/* Category & Risk Filter Pills */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#050505]/80 border border-[#6FBF94]/25 overflow-x-auto max-w-full">
              {(['Todos', 'Verduras', 'Frutas', 'Hojas verdes'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#6FBF94] text-[#0A0A0A] font-semibold'
                      : 'text-[#A0AAA4] hover:text-[#F8F8F3]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#050505]/80 border border-[#6FBF94]/25">
              {(['Todos', 'Elevado', 'Moderado', 'Bajo'] as const).map((risk) => (
                <button
                  key={risk}
                  type="button"
                  onClick={() => setRiskFilter(risk)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    riskFilter === risk
                      ? 'bg-[#1C1F1E] text-[#F8F8F3] border border-[#6FBF94]/40'
                      : 'text-[#A0AAA4] hover:text-[#F8F8F3]'
                  }`}
                >
                  {risk === 'Todos' ? 'Riesgo: Todos' : risk}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Minimalist Visual Inventory Grid */}
      {filteredItems.length === 0 ? (
        <ScrollReveal delayMs={120} durationMs={500} translateY={16}>
          <div className="rounded-3xl border border-[#6FBF94]/25 bg-[#050505]/75 p-12 text-center space-y-3">
            <p className="text-sm text-[#F8F8F3] font-medium">
              No hay alimentos que coincidan con este filtro.
            </p>
            <p className="text-xs text-[#A0AAA4]">
              Podés limpiar el filtro, agregar un alimento manualmente o escanear con la cámara.
            </p>
          </div>
        </ScrollReveal>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, idx) => (
            <ScrollReveal
              key={item.id}
              delayMs={60 + idx * 55}
              durationMs={520}
              translateY={16}
            >
              <button
                type="button"
                onClick={() => setSelectedItemId(item.id)}
                className="w-full group text-left rounded-2xl border border-[#6FBF94]/25 bg-[#050505]/80 hover:bg-[#1C1F1E]/40 hover:border-[#6FBF94]/55 shadow-[0_0_8px_rgba(111,191,148,0.03)] p-4 flex items-center gap-4 transition-all cursor-pointer"
              >
                {/* 1. Small Photograph */}
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#6FBF94]/25 shrink-0">
                  <ResilientImage
                    src={item.imageUrl}
                    alt={item.name}
                    fallbackLabel={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* 2. Name + 3. Estimated Remaining Time + 4. Risk Indicator */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-display font-semibold text-[#F8F8F3] truncate">
                      {item.name}
                    </h3>
                    <span className="text-[11px] font-mono-tabular text-[#A0AAA4] shrink-0">
                      {item.cutState}
                    </span>
                  </div>
                  <p className="text-xs font-mono-tabular text-[#A8C4AE] mt-0.5">
                    {item.estimatedShelfLife}
                  </p>
                  <p
                    className={`text-xs font-medium mt-1 ${getRiskTextStyle(
                      item.riskLevel
                    )}`}
                  >
                    {getRiskGlyph(item.riskLevel)} Riesgo {item.riskLevel} ({item.riskScore}%)
                  </p>
                </div>
              </button>
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* Manual Food Registration Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl border border-[#6FBF94]/25 bg-[#0A0A0A] p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1C1F1E] pb-3.5">
              <div>
                <h2 className="text-lg font-display font-bold text-[#F8F8F3]">
                  Registrar alimento en tu inventario
                </h2>
                <p className="text-xs text-[#A0AAA4]">
                  Calculamos automáticamente su vida útil y curva de deterioro.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-9 h-9 rounded-xl border border-[#1C1F1E] flex items-center justify-center text-[#A0AAA4] hover:text-[#F8F8F3] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualItem} className="space-y-4 text-xs">
              <div>
                <label className="text-[#A0AAA4] block mb-1.5">
                  Seleccioná un alimento frecuente:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.values(BOTANICAL_PROFILES).map((prof) => (
                    <button
                      key={prof.key}
                      type="button"
                      onClick={() => handleSelectPresetInModal(prof.key)}
                      className={`px-2.5 py-2 rounded-xl border font-medium transition-colors truncate cursor-pointer ${
                        presetKey === prof.key && !customName
                          ? 'border-[#6FBF94]/60 bg-[#6FBF94]/15 text-[#F8F8F3]'
                          : 'border-[#1C1F1E] bg-[#050505] text-[#A0AAA4] hover:text-[#F8F8F3]'
                      }`}
                    >
                      {prof.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A0AAA4] block mb-1">
                    O escribí otro nombre:
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ej. Brócoli, Limón, Uvas..."
                    className="w-full rounded-xl border border-[#1C1F1E] bg-[#050505] px-3 py-2 text-[#F8F8F3] focus:border-[#6FBF94]/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#A0AAA4] block mb-1">Categoría:</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as FoodCategory)}
                    className="w-full rounded-xl border border-[#1C1F1E] bg-[#050505] px-3 py-2 text-[#F8F8F3]"
                  >
                    <option value="Verduras">Verduras</option>
                    <option value="Frutas">Frutas</option>
                    <option value="Hojas verdes">Hojas verdes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[#A0AAA4] block mb-1">Estado físico:</label>
                  <select
                    value={manualCutState}
                    onChange={(e) => setManualCutState(e.target.value as CutState)}
                    className="w-full rounded-xl border border-[#1C1F1E] bg-[#050505] px-3 py-2 text-[#F8F8F3]"
                  >
                    <option value="Entero">Entero</option>
                    <option value="Cortado">Cortado</option>
                    <option value="Pelado">Pelado</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#A0AAA4] block mb-1">Maduración:</label>
                  <select
                    value={manualRipeness}
                    onChange={(e) => setManualRipeness(e.target.value as RipenessState)}
                    className="w-full rounded-xl border border-[#1C1F1E] bg-[#050505] px-3 py-2 text-[#F8F8F3]"
                  >
                    <option value="Verde / Firme">Verde / Firme</option>
                    <option value="Óptimo">Óptimo</option>
                    <option value="Maduro">Maduro</option>
                    <option value="Sobremaduro">Sobremaduro</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#A0AAA4] block mb-1">Conservación:</label>
                  <select
                    value={manualStorage}
                    onChange={(e) =>
                      setManualStorage(e.target.value as StorageCondition)
                    }
                    className="w-full rounded-xl border border-[#1C1F1E] bg-[#050505] px-3 py-2 text-[#F8F8F3]"
                  >
                    <option value="Heladera (4°C)">Heladera (4°C)</option>
                    <option value="Alacena fresca (15°C)">Alacena (15°C)</option>
                    <option value="Temperatura ambiente">Ambiente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A0AAA4] block mb-1">
                    Peso estimado (kg):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="10"
                    value={manualWeightKg}
                    onChange={(e) => setManualWeightKg(e.target.value)}
                    className="w-full rounded-xl border border-[#1C1F1E] bg-[#050505] px-3 py-2 text-[#F8F8F3] font-mono-tabular"
                  />
                </div>

                <div>
                  <label className="text-[#A0AAA4] block mb-1">
                    Valor estimado (ARS):
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="100"
                    value={manualValueArs}
                    onChange={(e) => setManualValueArs(e.target.value)}
                    className="w-full rounded-xl border border-[#1C1F1E] bg-[#050505] px-3 py-2 text-[#F8F8F3] font-mono-tabular"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[42px] px-4 rounded-xl border border-[#1C1F1E] text-[#A0AAA4] hover:text-[#F8F8F3] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-6 rounded-xl bg-[#6FBF94] text-[#0A0A0A] font-display font-semibold hover:bg-[#A8C4AE] transition-colors cursor-pointer"
                >
                  Guardar en inventario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expandable Detail & Live Condition Recalculation Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={closeDetailModal}
        >
          <div
            className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl border border-[#6FBF94]/25 bg-[#0A0A0A] p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#1C1F1E] pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#6FBF94]/25 shrink-0">
                  <ResilientImage
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-xs text-[#A0AAA4]">
                    {selectedItem.category} · {selectedItem.cutState}
                  </span>
                  <h2 className="text-2xl font-display font-bold text-[#F8F8F3]">
                    {selectedItem.name}
                  </h2>
                  <p className="text-xs font-mono-tabular text-[#6FBF94] mt-0.5">
                    Vida útil estimada: {selectedItem.estimatedShelfLife}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDetailModal}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#A0AAA4] hover:text-[#F8F8F3] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive In-Place State & Storage Updater */}
            <div className="rounded-2xl bg-[#050505] border border-[#6FBF94]/20 p-4 space-y-3 text-xs">
              <span className="text-[#6FBF94] font-medium block">
                Actualizar estado o lugar de conservación en tiempo real:
              </span>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[#A0AAA4]">Estado físico:</span>
                <div className="flex items-center gap-1 bg-[#1C1F1E]/40 p-1 rounded-xl">
                  {(['Entero', 'Cortado', 'Pelado'] as CutState[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() =>
                        onUpdateItemCondition(selectedItem.id, {
                          cutState: st,
                          ripenessLevel: selectedItem.analysis.ripenessLevel,
                          storageCondition: selectedItem.analysis.conservationCondition,
                          hoursSinceCut:
                            st === 'Entero' ? 0 : Math.max(2, selectedItem.hoursSinceCut),
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        selectedItem.cutState === st
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
                <span className="text-[#A0AAA4]">Ubicación actual:</span>
                <div className="flex items-center gap-1 bg-[#1C1F1E]/40 p-1 rounded-xl">
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
                        onUpdateItemCondition(selectedItem.id, {
                          cutState: selectedItem.cutState,
                          ripenessLevel: selectedItem.analysis.ripenessLevel,
                          storageCondition: cond,
                          hoursSinceCut: selectedItem.hoursSinceCut,
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        selectedItem.analysis.conservationCondition === cond
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

            {/* Risk Gauge & 24h / 48h / 72h Horizon */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5 rounded-2xl bg-[#1C1F1E]/20 border border-[#1C1F1E] p-4">
              <CircularRiskGauge
                score={selectedItem.riskScore}
                riskLevel={selectedItem.riskLevel}
                size={112}
              />

              <div className="flex-1 w-full space-y-2.5">
                <span className="text-xs text-[#A0AAA4] block">
                  Proyección de riesgo horario
                </span>
                {[
                  { label: 'Riesgo a 24 h', val: selectedItem.horizon.risk24h },
                  { label: 'Riesgo a 48 h', val: selectedItem.horizon.risk48h },
                  { label: 'Riesgo a 72 h', val: selectedItem.horizon.risk72h },
                ].map((h) => (
                  <div key={h.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#A0AAA4]">{h.label}</span>
                      <span className="font-mono-tabular text-[#F8F8F3]">{h.val}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#1C1F1E]">
                      <div
                        className="h-full rounded-full bg-[#6FBF94] transition-all duration-500"
                        style={{ width: `${h.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Conditions & Recommendations */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#1C1F1E]/20 border border-[#1C1F1E] p-4">
                <div>
                  <span className="text-[#A0AAA4] block">Conservación activa</span>
                  <strong className="text-[#F8F8F3] mt-0.5 block">
                    {selectedItem.analysis.conservationCondition}
                  </strong>
                </div>
                <div>
                  <span className="text-[#A0AAA4] block">Maduración</span>
                  <strong className="text-[#F8F8F3] mt-0.5 block">
                    {selectedItem.analysis.ripenessLevel}
                  </strong>
                </div>
                <div>
                  <span className="text-[#A0AAA4] block">Temperatura óptima</span>
                  <strong className="text-[#6FBF94] font-mono-tabular mt-0.5 block">
                    {selectedItem.analysis.temperatureOptimal}
                  </strong>
                </div>
                <div>
                  <span className="text-[#A0AAA4] block">Valor estimado</span>
                  <strong className="text-[#F8F8F3] font-mono-tabular mt-0.5 block">
                    $ {selectedItem.estimatedValueArs.toLocaleString('es-AR')} ARS ·{' '}
                    {selectedItem.estimatedWeightKg} kg
                  </strong>
                </div>
              </div>

              <div className="rounded-2xl bg-[#1C1F1E]/20 border border-[#1C1F1E] p-4 space-y-2">
                <span className="text-[#6FBF94] font-medium block">
                  Recomendaciones de conservación
                </span>
                {selectedItem.recommendations.map((rec, idx) => (
                  <p key={idx} className="text-[#F8F8F3] leading-relaxed">
                    · {rec}
                  </p>
                ))}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#A0AAA4]">
                <ShieldAlert className="w-3.5 h-3.5 text-[#A8C4AE] shrink-0" />
                <span>{selectedItem.scientificDisclaimer}</span>
              </div>
            </div>

            {/* Actions: Marcar como aprovechado (Suma a Mi Impacto) o Eliminar */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onConsumeItem(selectedItem.id);
                  closeDetailModal();
                }}
                className="flex-1 min-h-[46px] rounded-xl bg-[#6FBF94] text-[#0A0A0A] font-display font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-[#A8C4AE] transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  Marcar como aprovechado (+$ {selectedItem.estimatedValueArs} ARS)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onDeleteItem(selectedItem.id);
                  closeDetailModal();
                }}
                className="min-h-[46px] px-4 rounded-xl border border-[#1C1F1E] bg-[#0A0A0A] text-[#A0AAA4] hover:text-[#F28B82] flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Descartar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
