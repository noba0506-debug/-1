import { useRef, useState, useEffect, RefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp, Sparkles, Heart } from 'lucide-react';
import IntroSlideshow from './components/IntroSlideshow';
import GallerySection from './components/GallerySection';
import AboutSection from './components/AboutSection';

export default function App() {
  const galleryRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentActiveAnchor, setCurrentActiveAnchor] = useState<'home' | 'gallery' | 'about'>('home');

  // Monitor scroll height to show/hide "Scroll to Top" button & highlight active header region
  useEffect(() => {
    const handleScroll = () => {
      // Toggle button visibility
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      // Track active visual section
      const scrollPos = window.scrollY + 200;
      
      const galleryTop = galleryRef.current?.offsetTop || 0;
      const aboutTop = aboutRef.current?.offsetTop || 0;

      if (scrollPos >= aboutTop) {
        setCurrentActiveAnchor('about');
      } else if (scrollPos >= galleryTop) {
        setCurrentActiveAnchor('gallery');
      } else {
        setCurrentActiveAnchor('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (ref: RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-amber-100 selection:text-amber-900 bg-[#FCFBF9]">
      
      {/* Sticky Minimalist Floating Header */}
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="sticky top-0 z-40 bg-[#FCFBF9]/85 backdrop-blur-md border-b border-stone-200/40 px-6 sm:px-12 py-3.5 flex items-center justify-between pointer-events-auto"
      >
        <div className="flex flex-col text-left">
          <button id="logo-header-btn" onClick={scrollToTop} className="focus:outline-none flex items-center gap-1.5 cursor-pointer text-left">
            <span className="font-serif text-lg font-bold text-stone-900 tracking-wide">사계화</span>
            <span className="font-serif text-[11px] font-light text-stone-500 tracking-wider hidden sm:inline-block">四季花 — 계절이 피워낸 당신</span>
          </button>
        </div>

        {/* Header Navigation Link Items (Minimalist Text Buttons) */}
        <nav className="flex items-center gap-6 sm:gap-8 text-xs font-serif tracking-widest text-stone-600">
          <button
            id="nav-anchor-home"
            onClick={scrollToTop}
            className={`transition-colors duration-300 focus:outline-none cursor-pointer ${
              currentActiveAnchor === 'home' ? 'text-amber-800 font-bold border-b border-amber-800/60 pb-0.5' : 'hover:text-stone-950'
            }`}
          >
            소개
          </button>
          <button
            id="nav-anchor-gallery"
            onClick={() => scrollToSection(galleryRef)}
            className={`transition-colors duration-300 focus:outline-none cursor-pointer ${
              currentActiveAnchor === 'gallery' ? 'text-amber-800 font-bold border-b border-amber-800/60 pb-0.5' : 'hover:text-stone-950'
            }`}
          >
            전시관
          </button>
          <button
            id="nav-anchor-about"
            onClick={() => scrollToSection(aboutRef)}
            className={`transition-colors duration-300 focus:outline-none cursor-pointer ${
              currentActiveAnchor === 'about' ? 'text-amber-800 font-bold border-b border-amber-800/60 pb-0.5' : 'hover:text-stone-950'
            }`}
          >
            작가 노트
          </button>
        </nav>

        {/* Photographer credit name */}
        <div className="hidden md:block text-right pointer-events-none">
          <span className="text-[10px] tracking-widest text-stone-400 font-sans block">ARTIST DIRECTOR</span>
          <span className="text-xs tracking-wider text-stone-800 font-serif">김태곤 (KIM TAEGON)</span>
        </div>
      </motion.header>

      {/* Main Single Flow Sections */}
      <main className="flex-grow w-full">
        {/* Intro slides cover (Entry Point) */}
        <IntroSlideshow onEnterGallery={() => scrollToSection(galleryRef)} />

        {/* Gallery Masonry Area */}
        <div ref={galleryRef} className="scroll-mt-[50px]">
          <GallerySection sectionRef={galleryRef} />
        </div>

        {/* Artist Resume & Essay Note */}
        <div ref={aboutRef} className="scroll-mt-[50px]">
          <AboutSection />
        </div>
      </main>

      {/* Aesthetic Footer */}
      <footer className="bg-stone-50 border-t border-stone-200/40 py-12 px-6 text-center text-stone-400 text-xs font-serif font-light space-y-3">
        <div className="flex justify-center items-center gap-2">
          <span className="h-0.5 w-8 bg-stone-200" />
          <span className="text-stone-500 uppercase tracking-widest text-[10px] sm:text-xs">
            사계화(四季花) : 계절이 피워낸 당신
          </span>
          <span className="h-0.5 w-8 bg-stone-200" />
        </div>
        <p className="text-stone-400 font-sans tracking-wide">
          Copyright © 2026 사진작가 김태곤. All rights reserved.
        </p>
        <p className="text-[10px] text-stone-400/70 font-sans flex items-center justify-center gap-1">
          <span>Crafted with</span>
          <Heart size={9} className="text-rose-400 fill-rose-400" />
          <span>for Korean Fine Art Portraiture Series.</span>
        </p>
      </footer>

      {/* Floating Scroll to Top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            id="floating-scroll-top-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-40 bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 border border-stone-200 p-3 rounded-full shadow-lg backdrop-blur-xs transition-colors duration-300 cursor-pointer focus:outline-none"
            title="맨 위로 가기"
          >
            <ArrowUp size={16} />
          </motion.button>
        )}
      </AnimatePresence>
      
    </div>
  );
}
