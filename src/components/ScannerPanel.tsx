import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  Upload,
  Package,
  BarChart3,
  SlidersHorizontal,
  X,
  ScanLine,
  Thermometer,
  CloudSun,
  Home,
} from 'lucide-react';
import {
  ArgentineCityWeather,
  CutState,
  FoodAnalysisResult,
  RipenessState,
  StorageCondition,
  ThermalReferenceMode,
} from '../types/cuidar.ts';
import { BOTANICAL_PROFILES, computePredictionModel } from '../lib/predictionEngine.ts';
import { ScanResultView } from './ScanResultView.tsx';
import { ScrollReveal } from './ScrollReveal.tsx';

interface ScannerPanelProps {
  weather: ArgentineCityWeather;
  inventoryCount: number;
  onSaveToInventory: (item: FoodAnalysisResult) => void;
  onScanCompleted: () => void;
  onNavigateInventory: () => void;
  onNavigateImpact: () => void;
}

export const ScannerPanel: React.FC<ScannerPanelProps> = ({
  weather,
  inventoryCount,
  onSaveToInventory,
  onScanCompleted,
  onNavigateInventory,
  onNavigateImpact,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStageText, setScanStageText] = useState('Reconociendo estructura celular...');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<FoodAnalysisResult | null>(null);

  // Selector: Temperatura local (Open-Meteo) vs Temperatura ambiente (Interior)
  const [thermalMode, setThermalMode] = useState<ThermalReferenceMode>('local');
  const [indoorAmbientTempC, setIndoorAmbientTempC] = useState<number>(20);

  // Sample & Calibration Drawer
  const [showCalibration, setShowCalibration] = useState(false);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('tomate');
  const [customFoodName, setCustomFoodName] = useState<string>('');
  const [cutState, setCutState] = useState<CutState>('Cortado');
  const [ripenessLevel, setRipenessLevel] = useState<RipenessState>('Maduro');
  const [storageCondition, setStorageCondition] =
    useState<StorageCondition>('Heladera (4°C)');
  const [hoursSinceCut, setHoursSinceCut] = useState<number>(6);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeReferenceTempC =
    thermalMode === 'local' ? weather.temperature : indoorAmbientTempC;

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = mediaStream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 60);
    } catch {
      setCameraError(
        'Cámara no disponible en este entorno. Ejecutando análisis inteligente sobre muestra óptica calibrada.'
      );
      await executeScanAnalysis();
    }
  };

  const captureFrameBase64 = (): string | null => {
    if (!videoRef.current || !cameraActive) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(640, video.videoWidth);
    canvas.height = Math.min(640, video.videoHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.84);
  };

  const executeScanAnalysis = async (customBase64?: string, customMime?: string) => {
    setIsScanning(true);
    setScanStageText('Identificando morfología y epidermis...');

    const stageTimer1 = setTimeout(() => {
      setScanStageText(
        `Calibrando con Temp. ${
          thermalMode === 'local' ? 'Local' : 'Ambiente'
        } (${activeReferenceTempC}°C)...`
      );
    }, 550);
    const stageTimer2 = setTimeout(() => {
      setScanStageText('Calculando curva de deterioro 24h · 48h · 72h...');
    }, 1100);

    const capturedBase64 = customBase64 || captureFrameBase64();
    if (cameraActive) {
      stopCamera();
    }

    const profile = BOTANICAL_PROFILES[selectedPresetKey] || BOTANICAL_PROFILES.tomate;
    const targetFoodName = customFoodName.trim() || profile.name;
    const visualUrl = capturedBase64 || previewImage || profile.defaultImageUrl;

    const effectiveStorage: StorageCondition =
      thermalMode === 'ambiente' ? 'Temperatura ambiente' : storageCondition;
    const effectiveHours = cutState === 'Entero' ? 0 : hoursSinceCut;

    try {
      const [response] = await Promise.all([
        fetch('/api/analyze-food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: capturedBase64 || previewImage || undefined,
            mimeType: customMime || 'image/jpeg',
            foodName: targetFoodName,
            cutState,
            ripenessLevel,
            storageCondition: effectiveStorage,
            hoursSinceCut: effectiveHours,
            ambientTempC: activeReferenceTempC,
            ambientHumidity: weather.humidity,
            imageUrl: visualUrl,
          }),
        }),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: FoodAnalysisResult = await response.json();
      if (!data || !data.name) throw new Error('Respuesta inválida');
      setScanResult(data);
      onScanCompleted();
    } catch {
      // Backend not available (e.g. static hosting): run the local prediction engine
      const localResult = computePredictionModel({
        foodName: targetFoodName,
        cutState,
        ripenessLevel,
        storageCondition: effectiveStorage,
        hoursSinceCut: effectiveHours,
        ambientTempC: activeReferenceTempC,
        ambientHumidity: weather.humidity,
        imageUrl: visualUrl,
      });
      setScanResult(localResult);
      onScanCompleted();
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setIsScanning(false);
    }
  };

  const handlePrimaryScanClick = async () => {
    if (cameraActive) {
      await executeScanAnalysis();
    } else if (previewImage) {
      await executeScanAnalysis(previewImage);
    } else {
      await executeScanAnalysis();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Str = ev.target?.result as string;
      if (base64Str) {
        setPreviewImage(base64Str);
        await executeScanAnalysis(base64Str, file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
  };

  const selectedProfile =
    BOTANICAL_PROFILES[selectedPresetKey] || BOTANICAL_PROFILES.tomate;
  const activeDisplayName = customFoodName.trim().toUpperCase() || selectedProfile.name;

  return (
    <div className="min-h-[calc(100vh-9rem)] w-full flex flex-col justify-between px-5 sm:px-10 lg:px-14 py-6 max-w-[1440px] mx-auto">
      {/* Centerpiece Experience: Either Scan Result OR Central Futuristic Scanner */}
      <main className="my-auto py-4 flex flex-col items-center justify-center">
        {scanResult ? (
          <ScanResultView
            result={scanResult}
            ambientTempC={activeReferenceTempC}
            ambientHumidity={weather.humidity}
            onSaveToInventory={(item) => {
              onSaveToInventory(item);
            }}
            onResetScan={() => {
              setScanResult(null);
              setPreviewImage(null);
            }}
          />
        ) : (
          <ScrollReveal
            className="w-full max-w-xl flex flex-col items-center text-center"
            durationMs={520}
            translateY={16}
          >
            {/* Direct Selector: Temperatura Local vs Temperatura Ambiente (Subtle Neon Edge) */}
            <div className="w-full mb-5 rounded-2xl border border-[#6FBF94]/30 bg-[#050505]/85 p-3 backdrop-blur-md shadow-[0_0_10px_rgba(111,191,148,0.04)]">
              <div className="flex items-center justify-between text-[11px] text-[#A0AAA4] px-2 pb-2">
                <span className="flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-[#6FBF94] neon-logo-glow" />
                  <span>Referencia térmica de escaneo</span>
                </span>
                <span className="font-mono-tabular text-[#6FBF94] font-semibold">
                  Activa: {activeReferenceTempC} °C
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 bg-[#0A0A0A] p-1 rounded-xl border border-[#6FBF94]/15">
                <button
                  type="button"
                  onClick={() => setThermalMode('local')}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    thermalMode === 'local'
                      ? 'bg-[#050505] border border-[#6FBF94]/50 text-[#6FBF94] font-semibold shadow-[0_0_8px_rgba(111,191,148,0.07)]'
                      : 'text-[#A0AAA4] hover:text-[#F8F8F3]'
                  }`}
                >
                  <CloudSun className="w-3.5 h-3.5 shrink-0 text-[#6FBF94] neon-logo-glow" />
                  <span>Temp. Local ({weather.temperature}°C)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThermalMode('ambiente')}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    thermalMode === 'ambiente'
                      ? 'bg-[#050505] border border-[#6FBF94]/50 text-[#6FBF94] font-semibold shadow-[0_0_8px_rgba(111,191,148,0.07)]'
                      : 'text-[#A0AAA4] hover:text-[#F8F8F3]'
                  }`}
                >
                  <Home className="w-3.5 h-3.5 shrink-0 text-[#6FBF94] neon-logo-glow" />
                  <span>Temp. Ambiente ({indoorAmbientTempC}°C)</span>
                </button>
              </div>

              {thermalMode === 'ambiente' && (
                <div className="mt-2.5 pt-2 border-t border-[#1C1F1E] flex items-center justify-between px-2 text-xs">
                  <span className="text-[#A0AAA4]">Ajustar interior (cocina/alacena):</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setIndoorAmbientTempC((t) => Math.max(4, t - 1))
                      }
                      className="w-7 h-7 rounded-lg bg-[#1C1F1E] text-[#F8F8F3] hover:bg-[#6FBF94] hover:text-[#0A0A0A] font-mono-tabular font-semibold transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono-tabular font-semibold text-[#F8F8F3] w-12 text-center">
                      {indoorAmbientTempC} °C
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setIndoorAmbientTempC((t) => Math.min(34, t + 1))
                      }
                      className="w-7 h-7 rounded-lg bg-[#1C1F1E] text-[#F8F8F3] hover:bg-[#6FBF94] hover:text-[#0A0A0A] font-mono-tabular font-semibold transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Ambient Illuminated Circular Scanner Area */}
            <div className="relative flex items-center justify-center my-1">
              {/* Ambient Outer Glow */}
              <div
                className={`absolute -inset-6 rounded-full bg-[#6FBF94]/8 blur-2xl transition-opacity duration-700 pointer-events-none ${
                  isScanning ? 'opacity-90 scale-105' : 'opacity-45'
                }`}
              />

              {/* Rotating Technical Hairline Ring */}
              <svg
                className="w-72 h-72 sm:w-80 sm:h-80 animate-ring-slow pointer-events-none"
                viewBox="0 0 320 320"
              >
                <circle
                  cx="160"
                  cy="160"
                  r="152"
                  fill="none"
                  stroke="#1C1F1E"
                  strokeWidth="1.5"
                />
                <circle
                  cx="160"
                  cy="160"
                  r="152"
                  fill="none"
                  stroke="#6FBF94"
                  strokeWidth="1.5"
                  strokeDasharray="36 84"
                  strokeLinecap="round"
                  strokeOpacity="0.45"
                />
              </svg>

              {/* Inner Interactive Circular Portal */}
              <div className="absolute w-60 h-60 sm:w-68 sm:h-68 rounded-full overflow-hidden border border-[#6FBF94]/25 bg-[#1C1F1E]/25 backdrop-blur-md flex flex-col items-center justify-center shadow-[inset_0_0_24px_rgba(111,191,148,0.04)]">
                {/* Preview background image or live camera stream */}
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={previewImage || selectedProfile.defaultImageUrl}
                    alt={activeDisplayName}
                    referrerPolicy="no-referrer"
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${
                      isScanning ? 'scale-105 opacity-55' : 'opacity-30 hover:opacity-45'
                    }`}
                  />
                )}

                {/* Dark botanical vignette */}
                <div className="absolute inset-0 bg-radial from-[#0A0A0A]/40 via-[#0A0A0A]/65 to-[#0A0A0A]/90" />

                {/* Futuristic Laser Line when scanning */}
                {isScanning && (
                  <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-[#6FBF94] to-transparent shadow-[0_0_6px_rgba(111,191,148,0.45)] animate-scan-laser z-20" />
                )}

                {/* Central Primary Button: "Escanear alimento" */}
                <button
                  type="button"
                  onClick={handlePrimaryScanClick}
                  disabled={isScanning}
                  className="relative z-10 flex flex-col items-center justify-center w-full h-full p-6 group cursor-pointer focus:outline-none"
                >
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isScanning
                        ? 'bg-[#6FBF94] text-[#0A0A0A] scale-105 shadow-[0_0_20px_rgba(111,191,148,0.20)]'
                        : 'bg-[#6FBF94] text-[#0A0A0A] group-hover:bg-[#A8C4AE] group-hover:scale-105 shadow-[0_0_16px_rgba(111,191,148,0.11)]'
                    }`}
                  >
                    <ScanLine className="w-7 h-7" />
                  </div>

                  <span className="mt-4 text-lg sm:text-xl font-display font-semibold text-[#F8F8F3] tracking-tight whitespace-nowrap">
                    {isScanning
                      ? 'Analizando...'
                      : cameraActive
                      ? 'Capturar y analizar'
                      : 'Escanear alimento'}
                  </span>

                  <span className="mt-1 text-xs text-[#A8C4AE] max-w-[210px] leading-snug">
                    {isScanning
                      ? scanStageText
                      : `${activeDisplayName} · ${cutState} · ${activeReferenceTempC}°C`}
                  </span>
                </button>
              </div>
            </div>

            {cameraError && (
              <p className="mt-2 text-xs text-[#A8C4AE] max-w-xs">{cameraError}</p>
            )}

            {/* Secondary Actions: Subir fotografía + Activar cámara en vivo + Calibrar muestra */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#6FBF94]/25 bg-[#1C1F1E]/40 hover:bg-[#1C1F1E]/75 hover:border-[#6FBF94]/45 text-xs font-medium text-[#F8F8F3] flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#6FBF94]" />
                <span>Subir fotografía</span>
              </button>

              <button
                type="button"
                onClick={cameraActive ? stopCamera : startCamera}
                disabled={isScanning}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#1C1F1E] bg-[#0A0A0A]/70 hover:border-[#6FBF94]/35 text-xs font-medium text-[#A0AAA4] hover:text-[#F8F8F3] flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#A8C4AE]" />
                <span>{cameraActive ? 'Cerrar cámara' : 'Usar cámara'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCalibration(!showCalibration)}
                className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#1C1F1E] bg-[#0A0A0A]/70 hover:border-[#6FBF94]/35 text-xs font-medium text-[#A0AAA4] hover:text-[#F8F8F3] flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                title="Seleccionar muestra o estado físico de prueba"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#6FBF94]" />
                <span>Elegir alimento / estado</span>
              </button>
            </div>

            {/* Expandable Sample & Parameter Selector */}
            {showCalibration && (
              <div className="mt-4 w-full rounded-2xl border border-[#6FBF94]/20 bg-[#050505]/90 backdrop-blur-md p-4 text-left space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#F8F8F3]">
                    Seleccionar alimento y condición inicial
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCalibration(false)}
                    className="text-[#A0AAA4] hover:text-[#F8F8F3]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Preset Produce Selector (8 varieties) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.values(BOTANICAL_PROFILES).map((prof) => (
                    <button
                      key={prof.key}
                      type="button"
                      onClick={() => {
                        setSelectedPresetKey(prof.key);
                        setCustomFoodName('');
                        setPreviewImage(null);
                      }}
                      className={`px-2.5 py-2 rounded-xl text-xs font-medium border transition-colors text-center truncate cursor-pointer ${
                        selectedPresetKey === prof.key && !customFoodName
                          ? 'border-[#6FBF94]/60 bg-[#6FBF94]/15 text-[#F8F8F3]'
                          : 'border-[#1C1F1E] bg-[#0A0A0A]/60 text-[#A0AAA4] hover:text-[#F8F8F3]'
                      }`}
                    >
                      {prof.name}
                    </button>
                  ))}
                </div>

                {/* Custom Food Name Input */}
                <div>
                  <label className="text-[11px] text-[#A0AAA4] block mb-1">
                    O escribí cualquier otra fruta o verdura:
                  </label>
                  <input
                    type="text"
                    value={customFoodName}
                    onChange={(e) => setCustomFoodName(e.target.value)}
                    placeholder="Ej. Zapallito verde, Zanahoria, Brócoli, Limón..."
                    className="w-full rounded-xl border border-[#1C1F1E] bg-[#0A0A0A] px-3 py-2 text-xs text-[#F8F8F3] placeholder:text-[#A0AAA4]/60 focus:border-[#6FBF94]/50 focus:outline-none"
                  />
                </div>

                {/* Cut State */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-[#A0AAA4]">Estado físico:</span>
                  <div className="flex items-center gap-1 bg-[#0A0A0A]/80 p-1 rounded-xl">
                    {(['Entero', 'Cortado', 'Pelado'] as CutState[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setCutState(st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          cutState === st
                            ? 'bg-[#6FBF94] text-[#0A0A0A] font-semibold'
                            : 'text-[#A0AAA4] hover:text-[#F8F8F3]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ripeness & Storage */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-[11px] text-[#A0AAA4] block mb-1">
                      Maduración
                    </label>
                    <select
                      value={ripenessLevel}
                      onChange={(e) => setRipenessLevel(e.target.value as RipenessState)}
                      className="w-full rounded-xl border border-[#1C1F1E] bg-[#0A0A0A] px-2.5 py-1.5 text-xs text-[#F8F8F3]"
                    >
                      <option value="Verde / Firme">Verde / Firme</option>
                      <option value="Óptimo">Óptimo</option>
                      <option value="Maduro">Maduro</option>
                      <option value="Sobremaduro">Sobremaduro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#A0AAA4] block mb-1">
                      Conservación
                    </label>
                    <select
                      value={storageCondition}
                      onChange={(e) =>
                        setStorageCondition(e.target.value as StorageCondition)
                      }
                      className="w-full rounded-xl border border-[#1C1F1E] bg-[#0A0A0A] px-2.5 py-1.5 text-xs text-[#F8F8F3]"
                    >
                      <option value="Heladera (4°C)">Heladera (4°C)</option>
                      <option value="Alacena fresca (15°C)">Alacena fresca (15°C)</option>
                      <option value="Temperatura ambiente">Temperatura ambiente</option>
                    </select>
                  </div>
                </div>

                {cutState !== 'Entero' && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[#A0AAA4]">
                      Tiempo desde el corte:
                    </span>
                    <span className="text-xs font-mono-tabular text-[#6FBF94]">
                      {hoursSinceCut} h
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={36}
                      step={2}
                      value={hoursSinceCut}
                      onChange={(e) => setHoursSinceCut(Number(e.target.value))}
                      className="w-28 accent-[#6FBF94]"
                    />
                  </div>
                )}
              </div>
            )}
          </ScrollReveal>
        )}
      </main>

      {/* Discreet Bottom Access to Inventory & Personal Impact Stats */}
      <ScrollReveal delayMs={140} durationMs={480} translateY={14}>
        <footer className="w-full pt-4 border-t border-[#1C1F1E]/60 flex items-center justify-between text-xs text-[#A0AAA4]">
          <button
            type="button"
            onClick={onNavigateInventory}
            className="min-h-[40px] flex items-center gap-2 hover:text-[#F8F8F3] transition-colors cursor-pointer"
          >
            <Package className="w-4 h-4 text-[#6FBF94]" />
            <span>Inventario ({inventoryCount})</span>
          </button>

          <button
            type="button"
            onClick={onNavigateImpact}
            className="min-h-[40px] flex items-center gap-2 hover:text-[#F8F8F3] transition-colors cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-[#A8C4AE]" />
            <span>Estadísticas personales</span>
          </button>
        </footer>
      </ScrollReveal>
    </div>
  );
};
