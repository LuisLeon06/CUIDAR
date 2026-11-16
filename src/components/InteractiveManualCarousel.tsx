import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  X,
  ScanLine,
  Sun,
  Clock,
  HeartHandshake,
} from 'lucide-react';
import { ResilientImage } from './ResilientImage.tsx';

interface InteractiveManualCarouselProps {
  onStartScan: () => void;
  isModal?: boolean;
  onDismissModal?: () => void;
}

interface WelcomeSlide {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  badgeLabel: string;
  badgeValue: string;
  interactiveOptions: { label: string; resultText: string }[];
  icon: typeof ScanLine;
}

const WELCOME_SLIDES: WelcomeSlide[] = [
  {
    id: 'escanear',
    tag: 'Bienvenida a CUIDAR',
    title: 'Miramos tus alimentos con vos',
    subtitle: 'Solo acercá tu cámara o subí una foto para conocer su frescura real.',
    imageUrl: '/src/assets/images/food_tomato_cut_1794792028176.jpg',
    imageAlt: 'Tomate fresco recién cortado',
    badgeLabel: 'Tomate fresco',
    badgeValue: 'Listo para analizar',
    interactiveOptions: [
      { label: 'Entero', resultText: 'Dura hasta 6 días fresco' },
      { label: 'Cortado', resultText: 'Ideal consumir en 1 a 2 días' },
    ],
    icon: ScanLine,
  },
  {
    id: 'clima',
    tag: 'Clima y hogar',
    title: 'Se adapta al calor de tu cocina',
    subtitle: 'Elegí entre el clima de tu ciudad o la temperatura dentro de tu casa.',
    imageUrl: '/src/assets/images/food_avocado_hass_1794792028440.jpg',
    imageAlt: 'Palta Hass fresca abierta a la mitad',
    badgeLabel: 'Palta Hass',
    badgeValue: 'Sensible al calor',
    interactiveOptions: [
      { label: 'En heladera (4°C)', resultText: 'Conserva su textura 4 días' },
      { label: 'En mesada (22°C)', resultText: 'Madura rápido en 24 horas' },
    ],
    icon: Sun,
  },
  {
    id: 'tiempo',
    tag: 'Anticípate sin esfuerzo',
    title: 'Sabé qué consumir primero',
    subtitle: 'Te avisamos con suavidad qué frutas y verduras necesitan tu atención hoy.',
    imageUrl: '/src/assets/images/food_strawberries_fresh_1794792030083.jpg',
    imageAlt: 'Frutillas frescas con gotas de agua',
    badgeLabel: 'Frutillas',
    badgeValue: 'Frescura delicada',
    interactiveOptions: [
      { label: 'Hoy (24h)', resultText: 'Óptimas, dulces y firmes' },
      { label: 'En 48h', resultText: 'Ideales para licuado o postre' },
    ],
    icon: Clock,
  },
  {
    id: 'cuidado',
    tag: 'Tu mesa y tu impacto',
    title: 'Aprovechá cada ingrediente',
    subtitle: 'Guardá tus compras en tu alacena visual y evitá que nada se desperdicie.',
    imageUrl: '/src/assets/images/food_spinach_leaves_1794792030679.jpg',
    imageAlt: 'Hojas de espinaca fresca orgánica',
    badgeLabel: 'Hojas verdes',
    badgeValue: 'Cuidado diario',
    interactiveOptions: [
      { label: 'Guardar fresco', resultText: 'Seguimiento visual activo' },
      { label: 'Aprovechado', resultText: 'Suma ahorro a tu hogar' },
    ],
    icon: HeartHandshake,
  },
];

export const InteractiveManualCarousel: React.FC<InteractiveManualCarouselProps> = ({
  onStartScan,
  isModal = false,
  onDismissModal,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);

  const totalSlides = WELCOME_SLIDES.length;
  const slide = WELCOME_SLIDES[currentSlide];
  const SlideIcon = slide.icon;

  const goToSlide = (idx: number) => {
    setCurrentSlide(idx);
    setSelectedOptionIdx(0);
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % totalSlides);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    const swipeThreshold = 40;
    if (info.offset.x < -swipeThreshold || info.velocity.x < -280) {
      nextSlide();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > 280) {
      prevSlide();
    }
  };

  const carouselCard = (
    <div className="relative rounded-3xl border border-[#6FBF94]/20 bg-[#1C1F1E]/25 backdrop-blur-xl overflow-hidden shadow-2xl select-none">
      {/* Subtle warm ambient glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#6FBF94]/10 blur-3xl pointer-events-none" />

      {isModal && onDismissModal && (
        <button
          type="button"
          onClick={onDismissModal}
          aria-label="Cerrar bienvenida"
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-[#0A0A0A]/70 backdrop-blur-md border border-[#F8F8F3]/15 flex items-center justify-center text-[#A0AAA4] hover:text-[#F8F8F3] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Draggable Visual Carousel Stage */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.22}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="grid grid-cols-1 md:grid-cols-12 items-stretch cursor-grab active:cursor-grabbing"
        >
          {/* Left / Top Visual Protagonist Image */}
          <div className="md:col-span-5 relative min-h-[210px] sm:min-h-[240px] overflow-hidden">
            <ResilientImage
              src={slide.imageUrl}
              alt={slide.imageAlt}
              className="w-full h-full object-cover object-center scale-[1.02] transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/20 to-transparent md:bg-gradient-to-r md:from-transparent md:via-[#0A0A0A]/15 md:to-[#0A0A0A]/90" />

            {/* Floating warm visual caption on the image */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl bg-[#0A0A0A]/75 backdrop-blur-md border border-[#6FBF94]/25 px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-[#6FBF94]/20 flex items-center justify-center text-[#6FBF94]">
                  <SlideIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-medium text-[#F8F8F3] block leading-none">
                    {slide.badgeLabel}
                  </span>
                  <span className="text-[11px] text-[#A8C4AE] mt-0.5 block">
                    {slide.badgeValue}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right / Bottom Warm Minimalist Content */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
            <div className="space-y-2.5">
              <span className="text-xs font-medium text-[#A8C4AE] tracking-wide block">
                {slide.tag}
              </span>

              <h3 className="text-xl sm:text-2xl font-display font-semibold text-[#F8F8F3] tracking-tight">
                {slide.title}
              </h3>

              <p className="text-sm text-[#A0AAA4] leading-relaxed max-w-md">
                {slide.subtitle}
              </p>
            </div>

            {/* Warm, Soft Interactive Touch Toggle */}
            <div className="rounded-2xl bg-[#0A0A0A]/60 border border-[#1C1F1E] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-[#1C1F1E]/50 p-1 rounded-xl">
                {slide.interactiveOptions.map((opt, idx) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setSelectedOptionIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                      selectedOptionIdx === idx
                        ? 'bg-[#6FBF94] text-[#0A0A0A] font-semibold shadow-sm'
                        : 'text-[#A0AAA4] hover:text-[#F8F8F3]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <span className="text-xs font-medium text-[#A8C4AE] px-1">
                {slide.interactiveOptions[selectedOptionIdx]?.resultText}
              </span>
            </div>

            {/* Carousel Controls & Gentle Navigation */}
            <div className="pt-1 flex items-center justify-between gap-4">
              {/* Visual Carousel Dots */}
              <div className="flex items-center gap-2">
                {WELCOME_SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    aria-label={s.title}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      currentSlide === idx
                        ? 'w-7 bg-[#6FBF94]'
                        : 'w-2 bg-[#1C1F1E] hover:bg-[#A0AAA4]'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Anterior"
                  className="w-9 h-9 rounded-xl border border-[#1C1F1E] bg-[#0A0A0A]/60 hover:border-[#6FBF94]/40 flex items-center justify-center text-[#A0AAA4] hover:text-[#F8F8F3] transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {currentSlide < totalSlides - 1 ? (
                  <button
                    type="button"
                    onClick={nextSlide}
                    className="h-9 px-4 rounded-xl bg-[#1C1F1E] hover:bg-[#1C1F1E]/80 text-[#F8F8F3] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#6FBF94]" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onDismissModal) onDismissModal();
                      onStartScan();
                    }}
                    className="h-9 px-4 rounded-xl bg-[#6FBF94] hover:bg-[#A8C4AE] text-[#0A0A0A] text-xs font-display font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Escanear ahora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
        onClick={onDismissModal}
      >
        <div
          className="w-full max-w-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          {carouselCard}
        </div>
      </div>
    );
  }

  return carouselCard;
};
