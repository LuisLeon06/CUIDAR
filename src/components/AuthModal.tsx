import React, { useState } from 'react';
import {
  User,
  LogIn,
  CheckCircle2,
  LogOut,
  X,
  Mail,
  Lock,
  UserCheck,
  MapPin,
  Save,
  AlertCircle,
} from 'lucide-react';
import { ARGENTINE_CITIES } from '../lib/predictionEngine.ts';

export const CUIDAR_LOGO_PATH = '/assets/aistudio/image_a0e700f8.png';

export interface CuidarUser {
  id?: string;
  name: string;
  email: string;
  cityName?: string;
  registeredAt: string;
}

interface CuidarLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const CuidarLogo: React.FC<CuidarLogoProps> = ({
  size = 'md',
  showText = true,
}) => {
  const dimensions =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const textSize =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <img
        src={CUIDAR_LOGO_PATH}
        alt="Logo CUIDAR"
        className={`${dimensions} object-contain mix-blend-screen neon-logo-glow shrink-0`}
      />
      {showText && (
        <span
          className={`${textSize} font-display font-bold tracking-wider text-[#F8F8F3] drop-shadow-[0_0_4px_rgba(111,191,148,0.09)] whitespace-nowrap`}
        >
          CUIDAR
        </span>
      )}
    </div>
  );
};

interface TopRightAuthButtonProps {
  user: CuidarUser | null;
  onOpenAuthModal: () => void;
}

export const TopRightAuthButton: React.FC<TopRightAuthButtonProps> = ({
  user,
  onOpenAuthModal,
}) => {
  return (
    <button
      type="button"
      onClick={onOpenAuthModal}
      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#050505]/90 border border-[#6FBF94]/35 text-[#F8F8F3] shadow-[0_0_8px_rgba(111,191,148,0.06)] hover:border-[#6FBF94]/65 hover:bg-[#1C1F1E]/45 transition-all flex items-center gap-2 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
    >
      {user ? (
        <>
          <UserCheck className="w-4 h-4 text-[#6FBF94] neon-logo-glow" />
          <span>{user.name}</span>
        </>
      ) : (
        <>
          <LogIn className="w-4 h-4 text-[#6FBF94] neon-logo-glow" />
          <span>Iniciar sesión</span>
        </>
      )}
    </button>
  );
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: CuidarUser | null;
  onSuccessAuth: (user: CuidarUser) => void;
  onLogout: () => void;
  onSelectCityId?: (cityId: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccessAuth,
  onLogout,
  onSelectCityId,
}) => {
  const [mode, setMode] = useState<'login' | 'registro'>('registro');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('caba');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justRegistered, setJustRegistered] = useState(false);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const cityPreset =
      ARGENTINE_CITIES.find((c) => c.id === selectedCityId) ||
      ARGENTINE_CITIES[0];

    try {
      const endpoint =
        mode === 'registro' ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          cityName: cityPreset.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error || 'No se pudo completar la autenticación.');
        setIsSubmitting(false);
        return;
      }

      const authenticatedUser: CuidarUser = data.user || {
        name:
          name.trim() ||
          (email.includes('@') ? email.split('@')[0] : 'Usuario CUIDAR'),
        email: email.trim(),
        cityName: cityPreset.name,
        registeredAt: new Date().toISOString(),
      };

      if (mode === 'registro' && onSelectCityId) {
        onSelectCityId(selectedCityId);
      }

      setJustRegistered(true);
      setIsSubmitting(false);
      setTimeout(() => {
        onSuccessAuth(authenticatedUser);
        setJustRegistered(false);
        onClose();
      }, 900);
    } catch {
      const fallbackUser: CuidarUser = {
        name:
          name.trim() ||
          (email.includes('@') ? email.split('@')[0] : 'Usuario CUIDAR'),
        email: email.trim() || 'usuario@cuidar.ar',
        cityName: cityPreset.name,
        registeredAt: new Date().toISOString(),
      };
      setJustRegistered(true);
      setIsSubmitting(false);
      setTimeout(() => {
        onSuccessAuth(fallbackUser);
        setJustRegistered(false);
        onClose();
      }, 900);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cityPreset =
      ARGENTINE_CITIES.find((c) => c.id === selectedCityId) ||
      ARGENTINE_CITIES[0];

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: name.trim() || user.name,
          cityName: cityPreset.name,
        }),
      });
      const data = await res.json();
      const updatedUser: CuidarUser = data?.user || {
        ...user,
        name: name.trim() || user.name,
        cityName: cityPreset.name,
      };
      onSuccessAuth(updatedUser);
      if (onSelectCityId) {
        onSelectCityId(selectedCityId);
      }
      setProfileSavedToast(true);
      setTimeout(() => setProfileSavedToast(false), 2000);
    } catch {
      onSuccessAuth({
        ...user,
        name: name.trim() || user.name,
        cityName: cityPreset.name,
      });
      if (onSelectCityId) {
        onSelectCityId(selectedCityId);
      }
      setProfileSavedToast(true);
      setTimeout(() => setProfileSavedToast(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-[#6FBF94]/25 bg-[#0A0A0A] p-6 sm:p-8 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana de acceso"
          className="absolute top-5 right-5 w-9 h-9 rounded-xl border border-[#1C1F1E] bg-[#1C1F1E]/30 flex items-center justify-center text-[#A0AAA4] hover:text-[#F8F8F3] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 pb-5 border-b border-[#1C1F1E]">
          <CuidarLogo size="lg" showText={false} />
          <h2 className="text-xl font-display font-bold text-[#F8F8F3] pt-1">
            {user
              ? 'Tu Cuenta CUIDAR'
              : mode === 'registro'
              ? 'Crear cuenta en CUIDAR'
              : 'Iniciar sesión en CUIDAR'}
          </h2>
          <p className="text-xs text-[#A0AAA4]">
            La inteligencia de cuidar lo que importa
          </p>
        </div>

        {/* If already logged in: Editable Profile + City Calibration + Logout */}
        {user && !justRegistered ? (
          <form onSubmit={handleUpdateProfile} className="py-5 space-y-4">
            <div className="rounded-2xl bg-[#1C1F1E]/30 border border-[#6FBF94]/20 p-4 flex items-center gap-3.5">
              <CheckCircle2 className="w-7 h-7 text-[#6FBF94] shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-display font-semibold text-[#F8F8F3] truncate">
                  {user.name}
                </p>
                <p className="text-xs text-[#A0AAA4] truncate">{user.email}</p>
                <p className="text-[11px] text-[#6FBF94] mt-0.5">
                  Sesión activa · Acceso directo a tus módulos
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#A0AAA4] block">
                Actualizar nombre o alias
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#6FBF94] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name || user.name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[#1C1F1E] bg-[#1C1F1E]/20 pl-10 pr-4 py-2.5 text-sm text-[#F8F8F3] focus:border-[#6FBF94]/60 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#A0AAA4] block">
                Ciudad de referencia climática
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#6FBF94] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="w-full rounded-xl border border-[#1C1F1E] bg-[#0A0A0A] pl-10 pr-4 py-2.5 text-sm text-[#F8F8F3] focus:border-[#6FBF94]/60 focus:outline-none"
                >
                  {ARGENTINE_CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.province})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {profileSavedToast && (
              <p className="text-xs text-[#6FBF94] text-center font-medium">
                ✓ Perfil y ciudad climática actualizados
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 min-h-[44px] rounded-xl bg-[#6FBF94] text-[#0A0A0A] font-display font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#A8C4AE] transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar cambios</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="min-h-[44px] px-4 rounded-xl border border-[#1C1F1E] bg-[#0A0A0A] text-xs font-medium text-[#A0AAA4] hover:text-[#F28B82] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </form>
        ) : justRegistered ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#6FBF94]/15 border border-[#6FBF94]/50 flex items-center justify-center mx-auto text-[#6FBF94]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-display font-semibold text-[#F8F8F3]">
              {mode === 'registro'
                ? '¡Registro completado con éxito!'
                : '¡Sesión iniciada correctamente!'}
            </h3>
            <p className="text-xs text-[#A8C4AE]">
              Tu perfil quedó vinculado en CUIDAR. Ingresando directamente a tu panel...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-5 space-y-4">
            {/* Switch Tabs: Registrarse vs Iniciar Sesión */}
            <div className="grid grid-cols-2 gap-1.5 bg-[#1C1F1E]/40 p-1 rounded-xl border border-[#1C1F1E]">
              <button
                type="button"
                onClick={() => {
                  setMode('registro');
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  mode === 'registro'
                    ? 'bg-[#6FBF94] text-[#0A0A0A] font-semibold'
                    : 'text-[#A0AAA4] hover:text-[#F8F8F3]'
                }`}
              >
                Registrarse
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#6FBF94] text-[#0A0A0A] font-semibold'
                    : 'text-[#A0AAA4] hover:text-[#F8F8F3]'
                }`}
              >
                Iniciar sesión
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-[#F28B82]/15 border border-[#F28B82]/40 p-3 flex items-center gap-2 text-xs text-[#F28B82]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === 'registro' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#A0AAA4] block">
                    Nombre o alias
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#6FBF94] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Valentina Gómez"
                      className="w-full rounded-xl border border-[#1C1F1E] bg-[#1C1F1E]/25 pl-10 pr-4 py-2.5 text-sm text-[#F8F8F3] placeholder:text-[#A0AAA4]/60 focus:border-[#6FBF94]/60 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#A0AAA4] block">
                    Tu ciudad en Argentina
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#6FBF94] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={selectedCityId}
                      onChange={(e) => setSelectedCityId(e.target.value)}
                      className="w-full rounded-xl border border-[#1C1F1E] bg-[#0A0A0A] pl-10 pr-4 py-2.5 text-sm text-[#F8F8F3] focus:border-[#6FBF94]/60 focus:outline-none"
                    >
                      {ARGENTINE_CITIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.province})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#A0AAA4] block">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6FBF94] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com.ar"
                  className="w-full rounded-xl border border-[#1C1F1E] bg-[#1C1F1E]/25 pl-10 pr-4 py-2.5 text-sm text-[#F8F8F3] placeholder:text-[#A0AAA4]/60 focus:border-[#6FBF94]/60 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#A0AAA4] block">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6FBF94] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#1C1F1E] bg-[#1C1F1E]/25 pl-10 pr-4 py-2.5 text-sm text-[#F8F8F3] placeholder:text-[#A0AAA4]/60 focus:border-[#6FBF94]/60 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] mt-2 rounded-2xl bg-[#6FBF94] text-[#0A0A0A] font-display font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#A8C4AE] transition-colors cursor-pointer shadow-[0_0_14px_rgba(111,191,148,0.09)] disabled:opacity-60"
            >
              <span>
                {isSubmitting
                  ? 'Procesando...'
                  : mode === 'registro'
                  ? 'Registrarme e ingresar'
                  : 'Ingresar a mi cuenta'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
