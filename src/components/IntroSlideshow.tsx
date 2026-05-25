import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDown } from 'lucide-react';
import { GENERATED_IMAGES } from '../data';

interface IntroSlideshowProps {
  onEnterGallery: () => void;
}

const SLIDES = [
  {
    image: GENERATED_IMAGES.springMaster,
    seasonKo: '春 • 봄의 만개',
    seasonEn: 'Spring Blooming',
    themeColor: 'rgba(255, 240, 243, 0.4)',
  },
  {
    image: GENERATED_IMAGES.summerMaster,
    seasonKo: '夏 • 청록의 우거짐',
    seasonEn: 'Summer Verdue',
    themeColor: 'rgba(230, 247, 240, 0.4)',
  },
  {
    image: GENERATED_IMAGES.autumnMaster,
    seasonKo: '秋 • 성숙과 서정',
    seasonEn: 'Autumn Nostalgia',
    themeColor: 'rgba(251, 247, 237, 0.4)',
  },
  {
    image: GENERATED_IMAGES.winterMaster,
    seasonKo: '冬 • 고요의 순백',
    seasonEn: 'Winter Silence',
    themeColor: 'rgba(240, 243, 250, 0.4)',
  },
];

export default function IntroSlideshow({ onEnterGallery }: IntroSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[95vh] sm:h-screen overflow-hidden bg-stone-950 flex flex-col justify-between p-8 sm:p-16">
      {/* Absolute Slide Images */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.95, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.8 } }}
            transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 w-full h-full will-change-[transform,opacity]"
          >
            <img
              src={SLIDES[currentIndex].image}
              alt="Slide"
              className="w-full h-full object-cover object-center will-change-transform"
              referrerPolicy="no-referrer"
            />
            {/* Beautiful Radial Vignette Overlay to darken surroundings & highlight character in center */}
            <div 
              className="absolute inset-0 pointer-events-none z-1"
              style={{
                background: 'radial-gradient(circle at center, rgba(0,0,0,0) 15%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.85) 100%)'
              }}
            />
            {/* Ambient Dark Bottom Gradients to guarantee text and labels legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35 pointer-events-none z-2" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Header - Logo Area */}
      <div className="relative z-10 w-full flex justify-between items-start pointer-events-none">
        <div className="text-white tracking-widest text-xs font-light font-sans flex flex-col gap-1">
          <span className="opacity-60">PHOTOGRAPHY PORTFOLIO BY</span>
          <span className="font-serif tracking-widest text-sm opacity-90 font-semibold">김태곤 (KIM TAEGON)</span>
        </div>
        <div className="text-white/60 text-xs font-mono select-none hidden sm:block">
          No. 01 / COLLECTION 2026
        </div>
      </div>

      {/* Main Title Typography (Elegant Myeongjo/Serif) */}
      <div className="relative z-10 my-auto text-left max-w-4xl pt-12 sm:pt-0">
        <div className="overflow-hidden mb-3">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="flex items-center gap-3 text-stone-200 text-xs sm:text-sm tracking-[0.2em] font-sans font-medium"
          >
            <span>FINE ART PHOTOGRAPHY EXHIBITION</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-200" />
            <span className="text-amber-200 font-serif font-semibold">
              {SLIDES[currentIndex].seasonKo}
            </span>
          </motion.div>
        </div>

        <div className="overflow-hidden mb-6">
          <motion.h1
            initial={{ y: 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl md:text-7xl text-white font-serif font-bold leading-[1.2] text-stone-50 select-none tracking-tight"
          >
            사계화 <span className="font-medium text-stone-200"><span className="text-3xl sm:text-5xl font-serif">(四季花)</span></span>
          </motion.h1>
        </div>

        <div className="overflow-hidden md:mb-8 max-w-2xl">
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-white font-serif font-medium leading-relaxed tracking-wide"
          >
            계절이 피워낸 당신.
            <span className="block mt-1 text-sm sm:text-base text-stone-100 font-serif font-medium ms-0.5">
              각 계절마다 다르게 피어나는 꽃처럼, 부단히 흘러가며 깊어지는 우리의 아름다움.
            </span>
          </motion.p>
        </div>

        {/* Enter Gallery CTA Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
        >
          <button
            id="enter-gallery-cta-btn"
            onClick={onEnterGallery}
            className="group px-8 py-3.5 bg-stone-100 hover:bg-white text-stone-900 border border-stone-200 rounded-full font-sans text-xs sm:text-sm tracking-widest font-bold transition-all duration-300 flex items-center gap-3 shadow-lg shadow-black/20"
          >
            갤러리 감상하기
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="text-stone-900 font-bold"
            >
              →
            </motion.span>
          </button>
        </motion.div>
      </div>

      {/* Footer Instructions / Slide Indicators */}
      <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between items-end sm:items-center gap-6">
        <div className="flex gap-2">
          {SLIDES.map((_, idx) => (
            <button
              id={`slide-indicator-${idx}`}
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className="h-1.5 transition-all duration-500 rounded-full focus:outline-none"
              style={{
                width: currentIndex === idx ? '32px' : '8px',
                backgroundColor: currentIndex === idx ? '#f59e0b' : 'rgba(255, 255, 255, 0.3)',
              }}
              title={`사진 ${idx + 1}`}
            />
          ))}
        </div>

        {/* Floating Guide to Scroll Down */}
        <button
          id="scroll-helper-btn"
          onClick={onEnterGallery}
          className="group flex items-center gap-2 text-stone-400 hover:text-white text-xs tracking-widest transition-colors duration-300 font-sans cursor-pointer focus:outline-none"
        >
          <span>SCROLL FOR DETAILS</span>
          <div className="w-8 h-8 rounded-full border border-stone-700/60 flex items-center justify-center group-hover:border-stone-400 group-hover:transform group-hover:translate-y-1 transition-all duration-300">
            <ArrowDown size={14} className="text-stone-400 group-hover:text-white" />
          </div>
        </button>
      </div>
    </div>
  );
}
