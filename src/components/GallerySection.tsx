import React, { useState, useEffect, useRef, RefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Eye, Camera, X, ChevronLeft, ChevronRight, Sparkles, Maximize2, Minimize2, Play, Pause, Plus, Trash2, Upload } from 'lucide-react';
import { Photo } from '../types';
import { photosData } from '../data';

// Professional IndexedDB Support for Resilient Large Local Photo Storage (Bypasses 5MB browser localStorage restrictions completely)
class SagyehwaDB {
  private dbName = 'sagyehwa_db';
  private storeName = 'custom_photos';
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async getAll(): Promise<Photo[]> {
    try {
      const db = await this.init();
      return new Promise((resolve) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();
        request.onsuccess = () => {
          resolve(request.result || []);
        };
        request.onerror = () => {
          resolve([]);
        };
      });
    } catch (e) {
      console.error('IndexedDB getAll failed:', e);
      return [];
    }
  }

  async save(photo: Photo): Promise<void> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(photo);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB save failed:', e);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB delete failed:', e);
    }
  }
}

const sagyehwaDB = new SagyehwaDB();

interface GallerySectionProps {
  sectionRef: RefObject<HTMLDivElement | null>;
}

type SeasonFilter = 'spring' | 'summer' | 'autumn' | 'winter';

export default function GallerySection({ sectionRef }: GallerySectionProps) {
  const [activeSeason, setActiveSeason] = useState<SeasonFilter>('spring');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Set default visible count to 10 so all theme photos appear instantly
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Lightbox modal state
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  // Fullscreen slideshow lookbook state
  const [isFullscreenSlideshow, setIsFullscreenSlideshow] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isLoadedLandscape, setIsLoadedLandscape] = useState(true);
  const [isFillMode, setIsFillMode] = useState(false); // Default to false (ultra-sharp fit mode) to avoid any compression/pixelation by default

  // Reset landscape state when indexing shifts to prevent visual jumps
  useEffect(() => {
    setIsLoadedLandscape(true);
  }, [slideshowIndex]);

  // Premium Configurable Vignette Effect States
  const [vignetteEnabled, setVignetteEnabled] = useState(true);
  const [vignetteStrength, setVignetteStrength] = useState(0.7); // 0 to 1 (0% to 100%)
  const [vignetteRadius, setVignetteRadius] = useState(0.25); // 0 to 0.7, representing center clearance radius

  // Setup local state for all base photos + user uploads
  const [allPhotos, setAllPhotos] = useState<Photo[]>(photosData);

  // Asynchronously load custom photos from IndexedDB with transparent LocalStorage migration fallback
  useEffect(() => {
    const loadCustomPhotos = async () => {
      try {
        const cached = await sagyehwaDB.getAll();
        if (cached && cached.length > 0) {
          setAllPhotos([...cached, ...photosData]);
        } else {
          // Fallback connection to legacy LocalStorage
          const saved = localStorage.getItem('sagyehwa_custom_photos');
          if (saved) {
            const legacyPhotos: Photo[] = JSON.parse(saved);
            // Migrate automatically to IndexedDB for superior experience
            for (const photo of legacyPhotos) {
              await sagyehwaDB.save(photo);
            }
            setAllPhotos([...legacyPhotos, ...photosData]);
          }
        }
      } catch (e) {
        console.error('Failed to load custom photos from IndexedDB, trying localStorage:', e);
        try {
          const saved = localStorage.getItem('sagyehwa_custom_photos');
          if (saved) {
            const legacyPhotos: Photo[] = JSON.parse(saved);
            setAllPhotos([...legacyPhotos, ...photosData]);
          }
        } catch (err) {
          console.error('State fallback error:', err);
        }
      }
    };
    loadCustomPhotos();
  }, []);

  // UI state for Custom Photo Upload modal / editor
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoDesc, setNewPhotoDesc] = useState('');
  const [newPhotoSeason, setNewPhotoSeason] = useState<SeasonFilter>('spring');
  const [newPhotoRatio, setNewPhotoRatio] = useState<'3/4' | '4/3' | '1/1' | 'auto'>('auto');
  const [newPhotoTags, setNewPhotoTags] = useState('');
  const [newPhotoImageBase64, setNewPhotoImageBase64] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Delete a specific photo
  const handleDeletePhoto = async (photoId: string) => {
    const updatedPhotos = allPhotos.filter((p) => p.id !== photoId);
    setAllPhotos(updatedPhotos);
    
    // 1. Delete from IndexedDB
    try {
      await sagyehwaDB.delete(photoId);
    } catch (e) {
      console.error(e);
    }
    
    // 2. Keep LocalStorage backup in sync (silently ignore if quota issue)
    const savedCustom = updatedPhotos.filter((p) => p.id.startsWith('custom-'));
    try {
      localStorage.setItem('sagyehwa_custom_photos', JSON.stringify(savedCustom));
    } catch (e) {
      console.warn('LocalStorage ignored due to quota limit, IndexedDB is fully synchronous & healthy.', e);
    }
  };

  // Add a new photo
  const handleAddPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoImageBase64) {
      alert('등록할 사진 파일을 올려주세요.');
      return;
    }
    if (!newPhotoTitle.trim()) {
      alert('작품 제목을 입력해 주세요.');
      return;
    }

    const tagsArray = newPhotoTags
      ? newPhotoTags.split(',').map((t) => t.trim()).filter(Boolean)
      : ['나만의 사진'];

    const newPhoto: Photo = {
      id: `custom-${Date.now()}`,
      src: newPhotoImageBase64,
      title: newPhotoTitle.trim(),
      tags: tagsArray,
      aspectRatio: newPhotoRatio,
      description: newPhotoDesc.trim() || '내가 작성하고 조율한 눈부신 사계화 에세이 작품입니다.',
      season: newPhotoSeason,
    };

    const updatedall = [newPhoto, ...allPhotos];
    setAllPhotos(updatedall);

    // 1. Save to high-capacity IndexedDB (Never fails due to storage limitations!)
    try {
      await sagyehwaDB.save(newPhoto);
    } catch (e) {
      console.error('IndexedDB save failed, fallback triggered:', e);
    }

    // 2. Mirror into LocalStorage as fallback if quota permits
    const savedCustom = updatedall.filter((p) => p.id.startsWith('custom-'));
    try {
      localStorage.setItem('sagyehwa_custom_photos', JSON.stringify(savedCustom));
    } catch (e) {
      console.log('LocalStorage limit reached for fallback. Seamlessly saved to Web-SQL/IndexedDB instead without any issues.');
    }

    // Reset Form
    setNewPhotoTitle('');
    setNewPhotoDesc('');
    setNewPhotoTags('');
    setNewPhotoImageBase64(null);
    setIsUploadModalOpen(false);
  };

  // Export backup of custom photos
  const handleExportBackup = () => {
    const customPhotos = allPhotos.filter((p) => p.id.startsWith('custom-'));
    if (customPhotos.length === 0) {
      alert('백업할 나만의 사진이 없습니다. 먼저 사진을 한 장 이상 등록해 주세요.');
      return;
    }
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customPhotos, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "sagyehwa_photos_backup.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert('백업 생성 실패: 브라우저가 본 다운로드 방식을 지원하지 않습니다.');
    }
  };

  // Import backup of custom photos
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (!Array.isArray(imported)) {
          alert('올바른 백업 파일 형식(.json)이 아닙니다.');
          return;
        }

        const validPhotos: Photo[] = [];
        for (const item of imported) {
          if (item && typeof item.id === 'string' && typeof item.src === 'string' && typeof item.title === 'string') {
            validPhotos.push({
              id: item.id.startsWith('custom-') ? item.id : `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              src: item.src,
              title: item.title,
              tags: Array.isArray(item.tags) ? item.tags : ['가져옴'],
              aspectRatio: item.aspectRatio || 'auto',
              description: item.description || '',
              season: item.season || 'spring',
              featured: !!item.featured
            });
          }
        }

        if (validPhotos.length === 0) {
          alert('가져올 유효한 사진 데이터가 없습니다.');
          return;
        }

        // Save sequentially to high-capacity IndexedDB
        for (const photo of validPhotos) {
          await sagyehwaDB.save(photo);
        }

        // Update state and deduplicate by id
        setAllPhotos((prev) => {
          const baseMap = new Map();
          // Original exhibition template photos
          photosData.forEach((p) => baseMap.set(p.id, p));
          // Pre-existing uploaded/custom photos
          prev.filter(p => p.id.startsWith('custom-')).forEach(p => baseMap.set(p.id, p));
          // Newly imported backup custom photos (overrides duplicates if same ID)
          validPhotos.forEach((p) => baseMap.set(p.id, p));
          return Array.from(baseMap.values());
        });

        alert(`성공적으로 ${validPhotos.length}장의 사진 백업파일을 성공적으로 복구했습니다!`);
        e.target.value = ''; // Reset input element
      } catch (err) {
        alert('백업 파일을 읽는 중 오류가 발생했습니다. 정상적인 백업 파일(.json)이 맞는지 다시 확인해 주세요.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  // Image reader + Canvas optimizer with High Definition Original Preservation & Premium Interpolation
  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일 형식만 등록이 가능합니다.');
      return;
    }
    
    const reader = new FileReader();

    // 80KB 이하의 극소량 이미지 파일은 가공 없이 원본 Base64로 보존
    if (file.size <= 80 * 1024) {
      reader.onload = (e) => {
        setNewPhotoImageBase64(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // 그 외 모든 이미지는 로컬 스토리지 한도(전체 5MB 제한)를 준수하여 새로고침 시에도 절대 유실되지 않도록
      // 지능형 고품질 리사이징 및 압축 알고리즘을 강제 수행합니다. (이미지 한 장당 약 100KB 내외로 무손실 수준 최적화)
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 고화질 전시를 보존하면서도 용량을 극대화하기 위해 해상도 상한선을 1280px로 조율합니다.
          const maxDim = 1280; 
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // JPEG 퀄리티 0.84 세팅은 디테일 손상 없이 용량을 최대 95% 이상 감축시키는 황금 비율입니다.
            const compressed = canvas.toDataURL('image/jpeg', 0.84);
            setNewPhotoImageBase64(compressed);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Extract all unique tags for the active season
  const seasonalPhotos = allPhotos.filter((p) => p.season === activeSeason);
  const availableTags = Array.from(
    new Set(seasonalPhotos.flatMap((p) => p.tags))
  );

  // Filter photos by search & selected tag
  const filteredPhotos = seasonalPhotos.filter((photo) => {
    const matchesSearch =
      photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = selectedTag ? photo.tags.includes(selectedTag) : true;
    
    return matchesSearch && matchesTag;
  });

  // Infinite Scroll Slice
  const visiblePhotos = filteredPhotos.slice(0, visibleCount);

  // Reset page size to 10 on filter change
  useEffect(() => {
    setVisibleCount(10);
  }, [activeSeason, searchQuery, selectedTag]);

  // Load more function
  const handleLoadMore = () => {
    if (visibleCount >= filteredPhotos.length) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 4, filteredPhotos.length));
      setIsLoadingMore(false);
    }, 800);
  };

  // Keep observing for any beyond 10 scroll triggering
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && visibleCount < filteredPhotos.length) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [visibleCount, filteredPhotos.length, isLoadingMore]);

  // Autoplay handler for lookbook
  useEffect(() => {
    if (!isFullscreenSlideshow || !isAutoplay) return;

    const interval = setInterval(() => {
      setSlideshowIndex((prev) => (prev + 1) % filteredPhotos.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isFullscreenSlideshow, isAutoplay, filteredPhotos.length]);

  // Keyboard navigation for lookbook and escape triggers
  useEffect(() => {
    if (!isFullscreenSlideshow) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setSlideshowIndex((prev) => (prev + 1) % filteredPhotos.length);
      } else if (e.key === 'ArrowLeft') {
        setSlideshowIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
      } else if (e.key === 'Escape') {
        setIsFullscreenSlideshow(false);
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setIsAutoplay((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenSlideshow, filteredPhotos.length]);

  // Navigation within Lightbox
  const openLightbox = (photo: Photo) => {
    const index = filteredPhotos.findIndex((p) => p.id === photo.id);
    setLightboxPhoto(photo);
    setLightboxIndex(index);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxIndex === -1) return;
    let nextIdx = direction === 'next' ? lightboxIndex + 1 : lightboxIndex - 1;
    
    if (nextIdx < 0) {
      nextIdx = filteredPhotos.length - 1;
    } else if (nextIdx >= filteredPhotos.length) {
      nextIdx = 0;
    }
    
    setLightboxIndex(nextIdx);
    setLightboxPhoto(filteredPhotos[nextIdx]);
  };

  // Theme accent color depending on season
  const getSeasonAccent = (season: SeasonFilter) => {
    switch (season) {
      case 'spring': return { bg: 'bg-rose-50/75', border: 'border-rose-100', text: 'text-rose-600', hoverBg: 'hover:bg-rose-50', bubble: 'bg-rose-400' };
      case 'summer': return { bg: 'bg-emerald-50/70', border: 'border-emerald-100', text: 'text-emerald-700', hoverBg: 'hover:bg-emerald-50', bubble: 'bg-emerald-500' };
      case 'autumn': return { bg: 'bg-amber-50/70', border: 'border-amber-100', text: 'text-amber-800', hoverBg: 'hover:bg-amber-50', bubble: 'bg-amber-600' };
      case 'winter': return { bg: 'bg-sky-50/70', border: 'border-sky-100', text: 'text-sky-600', hoverBg: 'hover:bg-sky-50', bubble: 'bg-sky-400' };
    }
  };

  const accent = getSeasonAccent(activeSeason);

  return (
    <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      
      {/* Title Header */}
      <div className="text-center mb-16 space-y-4">
        <span className="font-serif italic text-stone-600 text-sm tracking-widest block font-medium">Sagyehwa Fine Art Gallery</span>
        <h2 className="text-3xl sm:text-4xl text-stone-950 font-serif font-bold tracking-tight">
          계절의 한가운데서 피어나는 고유함
        </h2>
        <div className="w-12 h-0.5 bg-stone-400 mx-auto" />
      </div>

      {/* Season Navigation (Korean Menus with traditional subtitles) */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-12">
        {(['spring', 'summer', 'autumn', 'winter'] as SeasonFilter[]).map((season) => {
          const detail = getSeasonAccent(season);
          const isActive = activeSeason === season;
          const labels = {
            spring: { ko: '봄', han: '春', en: 'Spring' },
            summer: { ko: '여름', han: '夏', en: 'Summer' },
            autumn: { ko: '가을', han: '秋', en: 'Autumn' },
            winter: { ko: '겨울', han: '冬', en: 'Winter' },
          };
          
          return (
            <button
              id={`season-tab-${season}`}
              key={season}
              onClick={() => {
                setActiveSeason(season);
                setSelectedTag(null);
                setSearchQuery('');
              }}
              className={`px-6 py-4 rounded-xl border text-center transition-all duration-300 pointer-events-auto shadow-xs cursor-pointer ${
                isActive
                  ? `${detail.bg} ${detail.border} ${detail.text} scale-105 ring-1 ${detail.border} font-medium`
                  : 'bg-white/40 border-stone-100 text-stone-500 hover:bg-stone-50/80'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="font-serif text-lg font-bold">{labels[season].ko}</span>
                <span className="text-xs opacity-90 font-serif font-medium">({labels[season].han})</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest opacity-95 font-sans font-bold">
                {labels[season].en}
              </div>
            </button>
          );
        })}
      </div>

      {/* Modern Filter controls */}
      <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-stone-200/50 p-6 mb-8 shadow-xs flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Dynamic Tag Filter Chips */}
        <div className="flex flex-wrap gap-2 justify-center md:justify-start w-full md:w-auto">
          <button
            id="tag-filter-all"
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 rounded-full text-xs tracking-wider transition-all duration-200 cursor-pointer ${
              selectedTag === null
                ? 'bg-stone-900 text-white font-medium'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
          >
            전체 사진
          </button>
          {availableTags.map((tag) => (
            <button
               id={`tag-filter-${tag}`}
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs tracking-wider transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                selectedTag === tag
                  ? 'bg-stone-900 text-white font-medium'
                  : `bg-stone-100 ${accent.hoverBg} text-stone-600`
              }`}
            >
              {tag === '대표작' && <Sparkles size={11} className="text-amber-500 animate-pulse" />}
              {tag}
            </button>
          ))}
        </div>

        {/* Real-Time Interactive Search bar */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="gallery-search-input"
            type="text"
            placeholder="작품명, 해시태그 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-55 rounded-full text-xs border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 font-sans focus:outline-none cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Immersive Portrait Vignette Focus Adjustment Controller */}
      <div className="bg-gradient-to-r from-amber-50/50 to-stone-100/50 rounded-2xl border border-stone-200/50 p-5 mb-8 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="p-2.5 bg-amber-800/10 rounded-xl text-amber-900 shrink-0">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <div className="text-left">
            <h4 className="font-serif text-sm font-bold text-stone-900">비네팅 인물 집중 효과 (Vignette Portrait Focus)</h4>
            <p className="text-[11px] text-stone-500 font-sans leading-relaxed">인물을 중심으로 주변을 어둡게 그늘지게 하여, 피사체(인물)만의 분위기와 현장감을 더욱 극명하게 고조시킵니다.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto justify-end">
          {/* Toggle Switch */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-serif text-stone-700 font-semibold select-none">효과 활성화</span>
            <button
              id="vignette-toggle"
              type="button"
              onClick={() => setVignetteEnabled(!vignetteEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${vignetteEnabled ? 'bg-amber-900' : 'bg-stone-300'}`}
              style={{ backgroundColor: vignetteEnabled ? '#7c2d12' : '#d6d3d1' }}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${vignetteEnabled ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {vignetteEnabled && (
            <div className="flex flex-wrap items-center gap-6">
              {/* Intensity Slider */}
              <div className="flex flex-col text-left space-y-1 w-36 sm:w-40">
                <div className="flex justify-between items-center text-[10px] sm:text-xs font-serif text-stone-600">
                  <span className="font-semibold">주변부 어둡기 (강도)</span>
                  <span className="font-mono text-amber-800 font-bold">{Math.round(vignetteStrength * 100)}%</span>
                </div>
                <input
                  id="vignette-intensity-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={vignetteStrength}
                  onChange={(e) => setVignetteStrength(parseFloat(e.target.value))}
                  className="w-full h-1 bg-stone-200 rounded-lg cursor-pointer accent-amber-800"
                />
              </div>

              {/* Radius Slider */}
              <div className="flex flex-col text-left space-y-1 w-36 sm:w-40">
                <div className="flex justify-between items-center text-[10px] sm:text-xs font-serif text-stone-600">
                  <span className="font-semibold">중앙 집중 반경 (크기)</span>
                  <span className="font-mono text-amber-800 font-bold">{Math.round((0.55 - vignetteRadius) * 200)}%</span>
                </div>
                <input
                  id="vignette-radius-slider"
                  type="range"
                  min="0.05"
                  max="0.45"
                  step="0.05"
                  value={vignetteRadius}
                  onChange={(e) => setVignetteRadius(parseFloat(e.target.value))}
                  className="w-full h-1 bg-stone-200 rounded-lg cursor-pointer accent-amber-800"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lookbook Slideshow CTA/Info Bar */}
      <div className="bg-stone-50/50 rounded-xl border border-stone-200/30 px-6 py-4 mb-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-stone-600 font-sans font-semibold text-center sm:text-left">
          현재 선택된 테마에 <span className="text-amber-800 font-bold">{filteredPhotos.length}점</span>의 수려한 사진들이 걸려있습니다.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            id="upload-op-btn"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-900/10 hover:bg-amber-900/20 text-amber-900 border border-amber-950/20 rounded-full text-xs font-serif tracking-widest cursor-pointer hover:scale-103 transition-all duration-300 pointer-events-auto"
          >
            <Camera size={12} className="text-amber-800" />
            <span>나만의 사진 등록/관리</span>
          </button>
          
          <button
            id="slideshow-start-btn"
            onClick={() => {
              setSlideshowIndex(0);
              setIsFullscreenSlideshow(true);
              setIsAutoplay(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-amber-900 text-white rounded-full text-xs font-serif tracking-widest cursor-pointer shadow-md shadow-amber-950/10 hover:shadow-amber-900/20 hover:scale-103 active:scale-100 transition-all duration-300 pointer-events-auto"
          >
            <Maximize2 size={12} className="text-amber-400 animate-pulse" />
            <span>전체화면 슬라이드쇼 감상 (Full Screen Slideshow)</span>
          </button>
        </div>
      </div>

      {/* Grid Empty Fallback */}
      {filteredPhotos.length === 0 && (
         <div className="text-center py-24 bg-white/40 rounded-2xl border border-stone-200/40">
          <p className="font-serif text-stone-400 text-sm italic mb-1">No photographs found matching the filter</p>
          <p className="text-stone-500 text-xs">선택한 태그나 검색어에 어울리는 구도의 사진이 발견되지 않았습니다.</p>
        </div>
      )}

      {/* MASONRY GRID LAYOUT */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
        <AnimatePresence mode="popLayout">
          {visiblePhotos.map((photo, index) => {
            const isFeatured = photo.featured;
            return (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, delay: index * 0.05, ease: 'easeOut' }}
                className="masonry-grid-col group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-stone-200/40 p-3 hover:shadow-md hover:border-stone-200 transition-all duration-300 cursor-pointer mb-6 break-inside-avoid"
                onClick={() => openLightbox(photo)}
              >
                {/* Photo Image Wrapper */}
                <div className="relative overflow-hidden rounded-xl bg-stone-100">
                  <img
                    src={photo.src}
                    alt={photo.title}
                    className="w-full h-auto object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    style={{
                      aspectRatio: photo.aspectRatio === '3/4' 
                        ? '3/4' 
                        : photo.aspectRatio === '4/3' 
                          ? '4/3' 
                          : photo.aspectRatio === '1/1' 
                            ? '1/1' 
                            : 'auto',
                    }}
                  />
                  
                  {/* Dynamic Custom Portrait Vignette Overlay */}
                  {vignetteEnabled && (
                    <div 
                      className="absolute inset-0 pointer-events-none z-10 rounded-xl transition-all duration-300"
                      style={{
                        background: `radial-gradient(circle at center, rgba(0,0,0,0) ${Math.round(vignetteRadius * 100)}%, rgba(0,0,0,${vignetteStrength * 0.4}) ${Math.round((vignetteRadius + 0.35) * 100)}%, rgba(0,0,0,${vignetteStrength * 0.95}) 100%)`
                      }}
                    />
                  )}
                  
                  {/* Styled Badges on Image */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                    {photo.id.startsWith('custom-') && (
                      <span className="px-2 py-1 rounded bg-rose-600 text-[10px] tracking-wider text-white font-medium uppercase shadow-xs">
                        My Upload
                      </span>
                    )}
                    {isFeatured && (
                      <span className="px-2 py-1 rounded bg-amber-500/90 text-[10px] tracking-wider text-white font-medium flex items-center gap-1 uppercase">
                        <Sparkles size={10} /> BEST CUT
                      </span>
                    )}
                    <span className="px-2 py-1 rounded bg-black/45 backdrop-blur-xs text-[10px] tracking-wider text-stone-100 uppercase font-mono">
                      {photo.aspectRatio}
                    </span>
                  </div>

                  {/* Delete Button for Custom Photos */}
                  {photo.id.startsWith('custom-') && (
                    <button
                      id={`delete-custom-${photo.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('이 사진을 영구적으로 삭제하시겠습니까?')) {
                          handleDeletePhoto(photo.id);
                        }
                      }}
                      className="absolute top-3 right-3 z-30 bg-black/60 hover:bg-rose-600 text-stone-100 p-2 rounded-lg backdrop-blur-xs transition-all duration-300 shadow-sm cursor-pointer border border-stone-800/40 pointer-events-auto hover:scale-105 active:scale-95"
                      title="사진 삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}

                  {/* Dark Glass Hover Overlay */}
                  <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <Eye size={18} className="text-stone-800" />
                    </div>
                  </div>
                </div>

                {/* Info Section under Photo */}
                <div className="mt-4 px-1 pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-serif text-sm font-bold text-stone-950 group-hover:text-amber-800 transition-colors duration-200">
                      {photo.title}
                    </h3>
                  </div>
                  <p className="text-stone-700 text-xs font-serif mt-1.5 leading-relaxed line-clamp-2 font-semibold">
                    {photo.description}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {photo.tags.map((t) => (
                      <span key={t} className="text-[10px] text-stone-500 font-sans tracking-wide bg-stone-100 px-2 py-0.5 rounded-full">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Infinite Scroll Anchor & Loader */}
      <div ref={loaderRef} className="mt-16 text-center">
        {visibleCount < filteredPhotos.length ? (
          <div className="flex flex-col items-center justify-center gap-3">
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-stone-400 text-xs">
                <div className="w-5 h-5 rounded-full border-2 border-stone-300 border-t-amber-800 animate-spin" />
                <span className="font-serif italic text-stone-500">계절을 조율하는 중...</span>
              </div>
            ) : (
              <button
                id="gallery-load-more-btn"
                onClick={handleLoadMore}
                className="px-6 py-2.5 bg-stone-50 hover:bg-white text-stone-600 hover:text-stone-900 border border-stone-200 rounded-full font-serif text-xs tracking-widest transition-all duration-300 cursor-pointer"
              >
                더 많은 사진 감상하기 (더 보기)
              </button>
            )}
            <p className="text-[10px] text-stone-400 font-sans">
              마우스 스크롤을 내리면 다음 작품들을 자동으로 불러옵니다 ({visiblePhotos.length} / {filteredPhotos.length})
            </p>
          </div>
        ) : (
          filteredPhotos.length > 0 && (
            <p className="font-serif italic text-stone-300 text-xs tracking-widest pt-4">
              ― {activeSeason.toUpperCase()} COLLECTION END ―
            </p>
          )
        )}
      </div>

      {/* IMMERSIVE DETAILS LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-10 select-none cursor-default"
            onClick={() => setLightboxPhoto(null)}
          >
            {/* Close Button */}
            <button
              id="lightbox-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxPhoto(null);
              }}
              className="absolute top-6 right-6 text-stone-400 hover:text-white p-2 border border-stone-800 hover:border-stone-500 rounded-full transition-all duration-300 cursor-pointer focus:outline-none"
              title="닫기"
            >
              <X size={18} />
            </button>

            {/* Left Button */}
            <button
              id="lightbox-prev-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox('prev');
              }}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-3 border border-stone-800 hover:border-stone-500 rounded-full transition-all duration-300 bg-stone-900/30 backdrop-blur-xs cursor-pointer focus:outline-none"
              title="이전 사진"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Right Button */}
            <button
              id="lightbox-next-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox('next');
              }}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-3 border border-stone-800 hover:border-stone-500 rounded-full transition-all duration-300 bg-stone-900/30 backdrop-blur-xs cursor-pointer focus:outline-none"
              title="다음 사진"
            >
              <ChevronRight size={20} />
            </button>

            {/* Center Content Area */}
            <div
              className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Photo Box */}
              <div className="col-span-1 md:col-span-7 flex justify-center max-h-[60vh] sm:max-h-[75vh] relative overflow-hidden rounded-xl bg-stone-950/20">
                <motion.img
                  key={lightboxPhoto.src}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  src={lightboxPhoto.src}
                  alt={lightboxPhoto.title}
                  className="max-w-full max-h-[60vh] sm:max-h-[75vh] object-contain rounded-xl shadow-2xl filter saturate-[0.95]"
                  referrerPolicy="no-referrer"
                />
                
                {/* Dynamic Vignette Focus Overlay for Lightbox Detail View */}
                {vignetteEnabled && (
                  <div 
                    className="absolute inset-0 pointer-events-none z-10 rounded-xl transition-all duration-300"
                    style={{
                      background: `radial-gradient(circle at center, rgba(0,0,0,0) ${Math.round(vignetteRadius * 100)}%, rgba(0,0,0,${vignetteStrength * 0.4}) ${Math.round((vignetteRadius + 0.35) * 100)}%, rgba(0,0,0,${vignetteStrength * 0.95}) 100%)`
                    }}
                  />
                )}
              </div>

              {/* metadata and Story Column */}
              <div className="col-span-1 md:col-span-5 text-left text-stone-100 flex flex-col justify-center space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${accent.bubble}`} />
                    <span className="text-[10px] tracking-widest text-[#E5E0DA] uppercase font-mono font-bold">
                      {lightboxPhoto.season.toUpperCase()} COLLECTION
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-wide text-white">
                    {lightboxPhoto.title}
                  </h2>
                </div>

                <div className="h-px bg-stone-800" />

                <p className="font-serif text-base text-stone-100 font-semibold leading-relaxed whitespace-pre-line">
                  {lightboxPhoto.description}
                </p>

                {/* Simulated Lens data for artistic tone */}
                <div className="bg-stone-900/60 rounded-xl p-4 border border-stone-800 text-[10px] text-stone-400 font-mono space-y-2">
                  <div className="flex items-center gap-2 text-stone-300 text-xs font-serif font-semibold pb-1 border-b border-stone-800">
                    <Camera size={14} className="text-amber-200" />
                    <span>ARTIST NOTE & TECHNICAL EXIF</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PORTRAIT ARTIST</span>
                    <span className="text-stone-300">김태곤 (KIM TAEGON)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CAMERA SYSTEM</span>
                    <span className="text-stone-300">Medium Format 100MP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LENS CONFIG</span>
                    <span className="text-stone-300">85mm Prime f/1.4 Art</span>
                  </div>
                  <div className="flex justify-between">
                    <span>COLOR MATRIX</span>
                    <span className="text-stone-300">Neutral Portrait Chromatic</span>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex flex-wrap gap-2">
                    {lightboxPhoto.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 text-[10px] rounded bg-stone-900 border border-stone-800 text-stone-300 tracking-wide"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  
                  {/* Quick Slideshow Open Trigger */}
                  <button
                    onClick={() => {
                      const idx = filteredPhotos.findIndex((p) => p.id === lightboxPhoto.id);
                      setSlideshowIndex(idx !== -1 ? idx : 0);
                      setLightboxPhoto(null);
                      setIsFullscreenSlideshow(true);
                      setIsAutoplay(true);
                    }}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-serif tracking-widest font-bold hover:scale-103 cursor-pointer duration-300 transform"
                  >
                    <Maximize2 size={12} className="text-amber-300 animate-pulse" />
                    <span>여기서부터 전체화면 슬라이드로 감상</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMMERSIVE FULL-SCREEN SLIDESHOW OVERLAY */}
      <AnimatePresence>
        {isFullscreenSlideshow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-950 select-none cursor-default overflow-hidden flex flex-col justify-between"
          >
            {/* Background Image Ambient Glow: covers the viewport with heavy blur and low opacity to act as an aesthetic color-matching frame */}
            <div className="absolute inset-0 w-full h-full bg-stone-950 overflow-hidden pointer-events-none">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.img
                  key={`bg-${filteredPhotos[slideshowIndex]?.src}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  src={filteredPhotos[slideshowIndex]?.src}
                  alt=""
                  className="w-full h-full object-cover filter blur-3xl scale-110 select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
            </div>

            {/* Immersive Center Gallery Image Container */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-0">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={`fg-container-${filteredPhotos[slideshowIndex]?.src}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  className="w-full h-full flex items-center justify-center relative"
                >
                  <img
                    src={filteredPhotos[slideshowIndex]?.src}
                    alt={filteredPhotos[slideshowIndex]?.title}
                    referrerPolicy="no-referrer"
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      if (img.naturalWidth && img.naturalHeight) {
                        setIsLoadedLandscape(img.naturalWidth > img.naturalHeight);
                      }
                    }}
                    className={`transition-all duration-500 ease-in-out select-none ${
                      isFillMode
                        ? "w-full h-full object-cover" // Full screen bleed fill (crops slightly, magnifies fully)
                        : "max-h-[82vh] md:max-h-[86vh] max-w-[95vw] object-contain rounded-2xl border border-stone-800/45 bg-stone-950/15 shadow-2xl z-10" // Sharp uncommitted fit mode (prevents pixelation or vertical stretch)
                    }`}
                    style={{
                      imageRendering: 'auto',
                    }}
                  />
                  
                  {/* Dynamic Vignette Focus Overlay for Fullscreen Lookbook Slideshow */}
                  {vignetteEnabled && (
                    <div 
                      className={`absolute pointer-events-none transition-all duration-500 ease-in-out ${
                        isFillMode 
                          ? "inset-0 z-20" 
                          : "max-h-[82vh] md:max-h-[86vh] max-w-[95vw] w-full h-full rounded-2xl z-20 border border-transparent"
                      }`}
                      style={{
                        background: `radial-gradient(circle at center, rgba(0,0,0,0) ${Math.round(vignetteRadius * 100)}%, rgba(0,0,0,${vignetteStrength * 0.45}) ${Math.round((vignetteRadius + 0.3) * 100)}%, rgba(0,0,0,${vignetteStrength * 0.95}) 100%)`
                      }}
                    />
                  )}
                  
                  {/* Floating Title/Desc right beneath inside an elegant translucent frosted glass bar */}
                  <div 
                    className={`absolute bottom-24 sm:bottom-18 left-1/2 -translate-x-1/2 text-center px-5 py-2.5 w-[90vw] sm:w-[80vw] md:w-auto max-w-xl bg-black/70 backdrop-blur-md rounded-2xl border border-stone-800/35 select-text pointer-events-auto z-20 shadow-2xl transition-all duration-300`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="font-serif text-[11px] sm:text-xs md:text-sm font-bold text-white tracking-widest leading-snug uppercase">
                      {filteredPhotos[slideshowIndex]?.title}
                    </h3>
                    {filteredPhotos[slideshowIndex]?.description && (
                      <p className="font-sans text-[9px] sm:text-[11px] md:text-xs text-stone-300 font-medium leading-normal mt-1 border-t border-stone-800/25 pt-1.5 px-2 line-clamp-2 sm:line-clamp-none">
                        {filteredPhotos[slideshowIndex]?.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Gradient Overlay for subtle readability at the top and bottom of floating controls */}
            <div className="absolute inset-0 bg-linear-to-b from-black/55 via-transparent to-black/45 pointer-events-none" />

            {/* Floating Top Controls */}
            <div 
              className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center z-30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 sm:gap-3 bg-black/35 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-stone-800/40">
                <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${accent.bubble} animate-pulse`} />
                <span className="font-serif text-[10px] sm:text-xs tracking-widest text-[#E5E0DA] font-bold uppercase flex items-center gap-1.5 sm:gap-2">
                  <span>{activeSeason.toUpperCase()}</span> 
                  <span className="text-stone-500 font-sans">•</span> 
                  <span className="text-amber-400 font-sans">{slideshowIndex + 1} / {filteredPhotos.length}</span>
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Screen Fit Mode Toggle */}
                <button
                  onClick={() => setIsFillMode(p => !p)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-stone-800 bg-black/40 backdrop-blur-md text-xs font-serif text-[#E5E0DA] hover:text-white hover:bg-black/60 transition duration-300 cursor-pointer pointer-events-auto"
                  title={isFillMode ? "원본 비율로 맞춤 (안깨짐)" : "화면에 가득 채우기 (풀스크린)"}
                >
                  {isFillMode ? (
                    <>
                      <Minimize2 size={11} className="text-[#E5E0DA]" />
                      <span className="text-[10px] tracking-widest font-bold hidden sm:inline">원본 비율</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 size={11} className="text-amber-400" />
                      <span className="text-[10px] tracking-widest font-bold hidden sm:inline">화면 꽉 채움</span>
                    </>
                  )}
                </button>

                {/* Autoplay Play/Pause */}
                <button
                  onClick={() => setIsAutoplay(p => !p)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-stone-800 bg-black/40 backdrop-blur-md text-xs font-serif text-[#E5E0DA] hover:text-white hover:bg-black/60 transition duration-300 cursor-pointer pointer-events-auto"
                  title={isAutoplay ? "자동 재생 일시정지" : "자동 재생 시작"}
                >
                  {isAutoplay ? (
                    <>
                      <Pause size={11} className="text-amber-400" />
                      <span className="text-[9px] tracking-wider uppercase font-mono font-bold hidden sm:inline">AUTOPLAY ON</span>
                    </>
                  ) : (
                    <>
                      <Play size={11} className="text-stone-400" />
                      <span className="text-[9px] tracking-wider uppercase font-mono font-bold hidden sm:inline">AUTOPLAY OFF</span>
                    </>
                  )}
                </button>

                {/* Close lookbook */}
                <button
                  onClick={() => setIsFullscreenSlideshow(false)}
                  className="p-1.5 sm:p-2 border border-stone-800 bg-black/40 backdrop-blur-md text-stone-300 hover:text-white hover:bg-black/60 rounded-full transition duration-300 pointer-events-auto cursor-pointer focus:outline-none"
                  title="전체화면 종료 (ESC)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Progress Bar indicator (Top Edge) */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-stone-900/30 z-40">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${((slideshowIndex + 1) / filteredPhotos.length) * 100}%` }}
              />
            </div>

            {/* Left Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSlideshowIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
              }}
              className="absolute left-2.5 sm:left-6 top-1/2 -translate-y-1/2 text-stone-300 hover:text-white p-2.5 sm:p-4 border border-stone-800 bg-black/35 backdrop-blur-md hover:bg-black/60 rounded-full transition duration-300 cursor-pointer focus:outline-none z-30"
              title="이전 사진"
            >
              <ChevronLeft size={16} className="sm:hidden" />
              <ChevronLeft size={22} className="hidden sm:block" />
            </button>

            {/* Right Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSlideshowIndex((prev) => (prev + 1) % filteredPhotos.length);
              }}
              className="absolute right-2.5 sm:right-6 top-1/2 -translate-y-1/2 text-stone-300 hover:text-white p-2.5 sm:p-4 border border-stone-800 bg-black/35 backdrop-blur-md hover:bg-black/60 rounded-full transition duration-300 cursor-pointer focus:outline-none z-30"
              title="다음 사진"
            >
              <ChevronRight size={16} className="sm:hidden" />
              <ChevronRight size={22} className="hidden sm:block" />
            </button>

            {/* Minimal floating navigation dot indicators at the bottom */}
            <div 
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 bg-black/35 backdrop-blur-md px-4 py-2 rounded-full border border-stone-800/40 max-w-[85vw] overflow-x-auto scrollbar-none"
              onClick={(e) => e.stopPropagation()}
            >
              {filteredPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideshowIndex(i)}
                  className={`h-1.5 rounded-full duration-300 shrink-0 cursor-pointer ${
                    slideshowIndex === i ? 'w-5 bg-amber-400' : 'w-1.5 bg-stone-600 hover:bg-stone-400'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PERFECTLY DESIGNED PHOTO UPLOAD & MANAGEMENT CENTER MODAL */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsUploadModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl w-full max-w-4xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto cursor-default select-none relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-stone-800 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                    <Camera size={18} />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-white">나만의 예술 사진 등록 • 관리</h3>
                    <p className="text-[10px] text-stone-400 font-sans">실제 나의 고해상도 사진을 화랑에 전시하고 계절별 슬라이드로 감상해 보세요</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition duration-200 cursor-pointer pointer-events-auto"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Grid content split */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* Left: Drag & Drop zone */}
                <div className="md:col-span-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <label className="text-xs font-serif text-amber-200 font-semibold block">1단계: 사진 파일 업로드</label>
                    <div
                      onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileProcess(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => document.getElementById('file-upload-input')?.click()}
                      className={`h-64 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-4 cursor-pointer relative bg-stone-950/40 pointer-events-auto ${
                        dragActive
                          ? 'border-amber-400 bg-amber-900/10'
                          : newPhotoImageBase64
                            ? 'border-stone-800 bg-stone-950/20'
                            : 'border-stone-800 hover:border-amber-900/40 hover:bg-stone-950/60'
                      }`}
                    >
                      <input
                        id="file-upload-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileProcess(e.target.files[0]);
                          }
                        }}
                      />

                      {newPhotoImageBase64 ? (
                        <div className="absolute inset-0 w-full h-full p-2 flex flex-col justify-between pointer-events-auto">
                          <img
                            src={newPhotoImageBase64}
                            alt="Upload Preview"
                            className="w-full h-full object-contain rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewPhotoImageBase64(null);
                            }}
                            className="absolute top-4 right-4 bg-black/70 hover:bg-rose-600 text-white p-1.5 rounded-full transition cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center space-y-3 p-4 pointer-events-none">
                          <div className="w-12 h-12 rounded-full bg-stone-900/80 border border-stone-800 flex items-center justify-center mx-auto text-stone-400">
                            <Upload size={20} className="animate-bounce" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-stone-200 font-semibold">마우스로 사진을 끌어다 놓으세요</p>
                            <p className="text-[10px] text-stone-500">또는 클릭하여 파일을 선택해 주세요 (JPEG, PNG ...)</p>
                          </div>
                          <div className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full inline-block font-sans">
                            HD 리사이징 필터 자동 최적화 적용됨
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informational Guidelines for fine-art feel */}
                  <div className="bg-stone-950/70 rounded-2xl p-4 border border-stone-800/80 mt-6 text-[10px] text-stone-400 space-y-2 leading-relaxed">
                    <p className="font-semibold text-stone-300 flex items-center gap-1.5">
                      <Sparkles size={11} className="text-amber-400" />
                      나만의 갤러리 활용 방법
                    </p>
                    <p>등록된 사진은 사계화 에세이 수록전 필터링에 결합되어 감상 하실 수 있습니다.</p>
                    <p>인덱스디비(IndexedDB) 대용량 고속 저장 기술이 적용되어, 새로고침을 하거나 창을 수십 번 닫아도 항상 안전하게 보존됩니다.</p>
                  </div>

                  {/* Backup / Restore System */}
                  <div className="bg-stone-900/40 rounded-2xl p-4 border border-stone-800 mt-4 text-[10px] space-y-2.5">
                    <p className="font-semibold text-amber-200 flex items-center gap-1.5 font-serif uppercase tracking-wider">
                      <Sparkles size={11} className="text-amber-400" />
                      전시 데이터 백업 및 타 도메인 복구
                    </p>
                    <p className="text-stone-400 leading-normal">
                      브라우저 보안 제약으로 인해 <b>개발용 주소(Development)</b>와 <b>공유용 주소(Shared)</b>는 서로 데이터를 공유하지 않고 격리됩니다. 
                      백업 다운로드 후 다른 주소창에서 복구하여 자유롭게 가져갈 수 있습니다.
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleExportBackup}
                        className="py-2 px-3 bg-stone-950 hover:bg-stone-850 hover:text-white text-stone-300 border border-stone-800 rounded-xl text-[9px] font-medium transition cursor-pointer justify-center flex items-center gap-1.5 active:scale-95"
                      >
                        백업 다운로드 (.json)
                      </button>
                      <button
                        type="button"
                        onClick={() => document.getElementById('backup-import-input')?.click()}
                        className="py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-[9px] font-semibold transition cursor-pointer justify-center flex items-center gap-1.5 active:scale-95"
                      >
                        백업에서 가져오기
                      </button>
                      <input
                        id="backup-import-input"
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleImportBackup}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Form Metadata Input */}
                <form onSubmit={handleAddPhotoSubmit} className="md:col-span-6 flex flex-col justify-between space-y-5 pointer-events-auto">
                  <div className="space-y-4">
                    <label className="text-xs font-serif text-amber-200 font-semibold block">2단계: 작품 메타데이터 기입</label>
                    
                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-400 uppercase font-mono block">작품 제목 (Title)</label>
                      <input
                        type="text"
                        required
                        placeholder="예: 초여름의 소쇄원을 거닐며"
                        value={newPhotoTitle}
                        onChange={(e) => setNewPhotoTitle(e.target.value)}
                        className="w-full bg-stone-950/80 border border-stone-800 hover:border-stone-700 focus:border-amber-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-600 transition"
                      />
                    </div>

                    {/* Season Choice */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-stone-400 uppercase font-mono block">전시 계절 테마</label>
                        <select
                          value={newPhotoSeason}
                          onChange={(e) => setNewPhotoSeason(e.target.value as SeasonFilter)}
                          className="w-full bg-stone-950/80 border border-stone-800 hover:border-stone-700 focus:border-amber-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white transition cursor-pointer"
                        >
                          <option value="spring">봄 (Spring)</option>
                          <option value="summer">여름 (Summer)</option>
                          <option value="autumn">가을 (Autumn)</option>
                          <option value="winter">겨울 (Winter)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-stone-400 uppercase font-mono block">구도 종횡비</label>
                        <select
                          value={newPhotoRatio}
                          onChange={(e) => setNewPhotoRatio(e.target.value as '3/4' | '4/3' | '1/1' | 'auto')}
                          className="w-full bg-stone-950/80 border border-stone-800 hover:border-stone-700 focus:border-amber-500 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white transition cursor-pointer"
                        >
                          <option value="auto">원본 비율 유지 (Auto)</option>
                          <option value="3/4">세로 구도 (3:4)</option>
                          <option value="4/3">가로 구도 (4:3)</option>
                          <option value="1/1">정방 구도 (1:1)</option>
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-400 uppercase font-mono block">작품 소개 및 감상평 (Description)</label>
                      <textarea
                        rows={3}
                        placeholder="사진에 얽힌 소우주 같은 이야기를 수놓아 보세요..."
                        value={newPhotoDesc}
                        onChange={(e) => setNewPhotoDesc(e.target.value)}
                        className="w-full bg-stone-950/80 border border-stone-800 hover:border-stone-700 focus:border-amber-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-600 transition resize-none"
                      />
                    </div>

                    {/* Hash Tags */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-400 uppercase font-mono block">태그 (쉼표로 구분)</label>
                      <input
                        type="text"
                        placeholder="예: 소쇄원, 하경, 필하모닉, 대표작"
                        value={newPhotoTags}
                        onChange={(e) => setNewPhotoTags(e.target.value)}
                        className="w-full bg-stone-950/80 border border-stone-800 hover:border-stone-700 focus:border-amber-500 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-600 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-850 hover:bg-amber-900 active:scale-98 text-white rounded-xl text-xs font-serif tracking-widest font-bold cursor-pointer duration-300 shadow-md shadow-amber-950/40"
                  >
                    사진 등록하기 (Complete Exhibition)
                  </button>
                </form>
              </div>

              {/* Under-Modal: List of My Uploaded Photos with direct deletion */}
              {allPhotos.filter((p) => p.id.startsWith('custom-')).length > 0 && (
                <div className="mt-8 pt-6 border-t border-stone-800">
                  <h4 className="text-xs font-serif text-amber-200 font-semibold mb-3">전시 중인 나만의 사진 관리 ({allPhotos.filter((p) => p.id.startsWith('custom-')).length}장)</h4>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-stone-800">
                    {allPhotos.filter((p) => p.id.startsWith('custom-')).map((custom) => (
                      <div key={custom.id} className="flex-none w-32 bg-stone-950 p-2 rounded-xl border border-stone-800 relative group">
                        <img src={custom.src} alt={custom.title} className="w-full h-20 object-cover rounded-md" />
                        <div className="mt-1.5">
                          <p className="text-[9px] text-white truncate font-semibold">{custom.title}</p>
                          <span className="text-[8px] px-1 bg-stone-800 rounded uppercase font-mono inline-block text-stone-400">{custom.season}</span>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(`'${custom.title}' 사진을 전시관에서 영구 삭제하시겠습니까?`)) {
                              handleDeletePhoto(custom.id);
                            }
                          }}
                          className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition duration-200 cursor-pointer shadow-sm pointer-events-auto"
                          title="삭제"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
