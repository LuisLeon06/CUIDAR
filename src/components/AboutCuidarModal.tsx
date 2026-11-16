import React, { useState } from 'react';
import { X, Cpu, Compass, BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';
import { CuidarLogo } from './AuthModal.tsx';

interface AboutCuidarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScan: () => void;
}

type GuideTab = 'guia' | 'flujos' | 'arquitectura';

export const AboutCuidarModal: React.FC<AboutCuidarModalProps> = ({
  isOpen,
  onClose,
  onStartScan,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('guia');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[86vh] flex flex-col rounded-3xl border border-[#6FBF94]/25 bg-[#0A0A0A] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1C1F1E]">
          <div className="flex items-center gap-3.5">
            <CuidarLogo size="md" showText={false} />
            <div>
              <span className="text-xs font-medium text-[#6FBF94]">CUIDAR · FUTURE FOOD INTELLIGENCE</span>
              <h2 className="text-xl font-display font-semibold text-[#F8F8F3] mt-0.5">
                La inteligencia de cuidar lo que importa
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#A0AAA4] hover:text-[#F8F8F3] hover:bg-[#1C1F1E]/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean Segmented Tabs */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#1C1F1E]/40 border border-[#1C1F1E]">
            <button
              type="button"
              onClick={() => setActiveTab('guia')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'guia'
                  ? 'bg-[#6FBF94] text-[#0A0A0A] font-semibold'
                  : 'text-[#A0AAA4] hover:text-[#F8F8F3]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guía de Usuario</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('flujos')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'flujos'
                  ? 'bg-[#6FBF94] text-[#0A0A0A] font-semibold'
                  : 'text-[#A0AAA4] hover:text-[#F8F8F3]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Flujos & Predictor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('arquitectura')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'arquitectura'
                  ? 'bg-[#6FBF94] text-[#0A0A0A] font-semibold'
                  : 'text-[#A0AAA4] hover:text-[#F8F8F3]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Arquitectura Técnica</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm text-[#A0AAA4]">
          {activeTab === 'guia' && (
            <div className="space-y-4">
              <p className="text-[#F8F8F3] leading-relaxed">
                CUIDAR está diseñado bajo una premisa simple: <strong className="text-[#6FBF94]">abrir, escanear, comprender y cuidar</strong>. Sin formularios complejos ni pantallas saturadas.
              </p>

              <div className="space-y-3">
                <div className="rounded-2xl bg-[#1C1F1E]/30 border border-[#1C1F1E] p-4">
                  <h3 className="text-sm font-display font-semibold text-[#F8F8F3]">
                    01. Escanear o subir fotografía
                  </h3>
                  <p className="text-xs text-[#A0AAA4] mt-1 leading-relaxed">
                    En el panel central, pulsá <strong className="text-[#F8F8F3]">Escanear alimento</strong> para usar la cámara de tu celular o computadora, elegí <strong className="text-[#F8F8F3]">Subir fotografía</strong> desde tu galería, o probá muestras calibradas al instante.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#1C1F1E]/30 border border-[#1C1F1E] p-4">
                  <h3 className="text-sm font-display font-semibold text-[#F8F8F3]">
                    02. Comprender el riesgo y horizonte 24h / 48h / 72h
                  </h3>
                  <p className="text-xs text-[#A0AAA4] mt-1 leading-relaxed">
                    Obtené al instante la vida útil estimada y el indicador circular de riesgo. Desplegá <strong className="text-[#F8F8F3]">Ver análisis</strong> o <strong className="text-[#F8F8F3]">Recomendaciones</strong> únicamente cuando desees profundizar.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#1C1F1E]/30 border border-[#1C1F1E] p-4">
                  <h3 className="text-sm font-display font-semibold text-[#F8F8F3]">
                    03. Gestionar tu Inventario y medir Mi Impacto
                  </h3>
                  <p className="text-xs text-[#A0AAA4] mt-1 leading-relaxed">
                    Guardá el alimento en tu inventario visual. Cuando lo consumas a tiempo, marcalo como <strong className="text-[#6FBF94]">Aprovechado</strong> para sumar pesos argentinos ($ ARS) y kilogramos rescatados en <strong className="text-[#F8F8F3]">Mi impacto</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'flujos' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#1C1F1E]/30 border border-[#1C1F1E] p-4">
                <h3 className="text-sm font-display font-semibold text-[#F8F8F3]">
                  Motor de Predicción Higrotérmica y Celular
                </h3>
                <p className="text-xs text-[#A0AAA4] mt-1.5 leading-relaxed">
                  El sistema evalúa 7 variables críticas: tipo botánico del alimento, integridad epidérmica (Entero, Cortado o Pelado), grado de maduración, temperatura real de almacenamiento (Heladera 4 °C vs Ambiente), humedad relativa exterior (vía Open-Meteo), método de conservación y horas transcurridas desde el corte.
                </p>
              </div>

              <div className="rounded-2xl bg-[#1C1F1E]/30 border border-[#1C1F1E] p-4">
                <h3 className="text-sm font-display font-semibold text-[#F8F8F3]">
                  Arquitectura de Información Progresiva
                </h3>
                <p className="text-xs text-[#A0AAA4] mt-1.5 leading-relaxed">
                  Para evitar la fatiga cognitiva, cada vista tiene una única acción principal:
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs text-[#F8F8F3]">
                  <div className="p-2.5 rounded-xl bg-[#0A0A0A]/70 border border-[#1C1F1E]">
                    <span className="text-[#6FBF94] font-medium">Nivel 1 (Inmediato):</span> Nombre, Estado, Vida útil y Riesgo circular.
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0A0A0A]/70 border border-[#1C1F1E]">
                    <span className="text-[#A8C4AE] font-medium">Nivel 2 (Bajo demanda):</span> Curva 24/48/72h, Análisis técnico y Recomendaciones.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl bg-[#1C1F1E]/20 border border-[#6FBF94]/20 p-3.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-[#6FBF94] shrink-0 mt-0.5" />
                <span>
                  Todas las predicciones se presentan como orientativas y preventivas hasta contar con validación bromatológica instrumental.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'arquitectura' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="rounded-2xl bg-[#1C1F1E]/30 border border-[#1C1F1E] p-4">
                <h3 className="text-sm font-display font-semibold text-[#F8F8F3]">
                  Stack Tecnológico Modular
                </h3>
                <p className="mt-1 text-[#A0AAA4]">
                  • <strong className="text-[#F8F8F3]">Frontend & UI:</strong> React 19 + TypeScript + Tailwind CSS v4 con estética dark-botanical y soporte PWA instalable (<code className="text-[#6FBF94]">vite-plugin-pwa</code>).
                </p>
                <p className="mt-1 text-[#A0AAA4]">
                  • <strong className="text-[#F8F8F3]">Visión Artificial & IA:</strong> Integración server-side con <code className="text-[#6FBF94]">@google/genai</code> (<code className="text-[#6FBF94]">gemini-4-hydrogen</code>) con esquemas JSON tipados para reconocimiento morfológico y estimación de madurez.
                </p>
                <p className="mt-1 text-[#A0AAA4]">
                  • <strong className="text-[#F8F8F3]">Telemetría Climática:</strong> API <code className="text-[#6FBF94]">Open-Meteo</code> en tiempo real con geolocalización GPS y presets de regiones argentinas (CABA, Córdoba, Rosario, Mendoza, Tucumán, Bariloche, Mar del Plata, Salta).
                </p>
                <p className="mt-1 text-[#A0AAA4]">
                  • <strong className="text-[#F8F8F3]">Persistencia Híbrida:</strong> API REST modular en Express (<code className="text-[#6FBF94]">/api/analyze-food</code>, <code className="text-[#6FBF94]">/api/weather</code>, <code className="text-[#6FBF94]">/api/inventory</code>) sincronizada con almacenamiento local offline-first.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-4 border-t border-[#1C1F1E] flex items-center justify-between gap-4 bg-[#0A0A0A]">
          <span className="text-xs text-[#A0AAA4]">Plataforma Argentina de Inteligencia Alimentaria</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartScan();
            }}
            className="flex items-center gap-2 rounded-xl bg-[#6FBF94] px-5 py-2.5 text-xs font-semibold text-[#0A0A0A] hover:bg-[#A8C4AE] transition-colors whitespace-nowrap"
          >
            <span>Ir al Escáner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
