import React, { useState } from 'react';
import { Download, Smartphone, X, WifiOff } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAction}
        className={`flex items-center gap-2 rounded-xl border border-[#6FBF94]/25 bg-[#1C1F1E]/50 text-[#F8F8F3] hover:border-[#6FBF94]/60 hover:bg-[#1C1F1E]/80 transition-colors whitespace-nowrap shrink-0 ${
          compact ? 'px-3 py-2 text-xs' : 'px-3.5 py-2 text-xs font-medium'
        }`}
        title="Instalar aplicación CUIDAR en tu dispositivo"
      >
        <Download className="w-3.5 h-3.5 text-[#6FBF94]" />
        <span>Instalar App</span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#6FBF94]/25 bg-[#0A0A0A] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-[#6FBF94]" />
                <h3 className="text-base font-display font-semibold text-[#F8F8F3]">
                  Instalar CUIDAR ({isIOS ? 'iPhone / iPad' : 'PWA Multiplataforma'})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#A0AAA4] hover:text-[#F8F8F3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2.5 text-sm text-[#A0AAA4] leading-relaxed">
              {isIOS ? (
                <>
                  <p>1. Tocá el botón <strong className="text-[#F8F8F3]">Compartir</strong> en la barra de Safari.</p>
                  <p>2. Deslizá y seleccioná <strong className="text-[#F8F8F3]">Agregar a pantalla de inicio</strong>.</p>
                </>
              ) : (
                <>
                  <p>1. Abrí el menú de tu navegador (Chrome, Edge o Android) en la esquina superior.</p>
                  <p>2. Seleccioná <strong className="text-[#F8F8F3]">Instalar aplicación</strong> o <strong className="text-[#F8F8F3]">Agregar a pantalla principal</strong> para usar CUIDAR en pantalla completa.</p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-5 w-full rounded-xl bg-[#1C1F1E] py-2.5 text-xs font-medium text-[#F8F8F3] hover:bg-[#1C1F1E]/80 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border border-[#A8C4AE]/40 bg-[#1C1F1E]/95 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-[#F8F8F3] shadow-lg">
      <WifiOff className="w-3.5 h-3.5 text-[#6FBF94]" />
      <span>Modo sin conexión — motor predictivo local activo</span>
    </div>
  );
};
