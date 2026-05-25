import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Mail, Compass, ShieldAlert, Award, ExternalLink, Inbox, Calendar, Trash2 } from 'lucide-react';
import { artistEssay } from '../data';

interface Letter {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
}

export default function AboutSection() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [messageInput, setMessageInput] = useState('');

  // Custom modal and toast states to bypass blocked dialogs in preview iframe
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info';
  } | null>(null);

  // Auto-clear toast alert after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load letters from localStorage or initialize with romantic default preset letter
  useEffect(() => {
    const stored = localStorage.getItem('sagyehwa_letters');
    if (stored) {
      try {
        setLetters(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse sagyehwa_letters', e);
      }
    } else {
      // Default heartbreakingly beautiful letter from "그녀" matching user detail email
      const defaultLetters: Letter[] = [
        {
          id: 'preset-1',
          name: '나의 계절 (그녀)',
          email: 'noba0506@gmail.com',
          message: '김태곤 작가님, 사계화 속에 곱게 담긴 나의 모습들을 이렇게 아름다운 갤러리로 가꿔주셔서 정말 감사해요.\n\n봄의 벚꽃 아래에서 나를 바라보던 그 따스하고 설렜던 시선이 전시관 슬라이드를 보며 한 장 한 장 온전히 다시 느껴지네요. 당신의 렌즈를 통해 비춰진 내 사계의 찰나들이 이렇게 영원처럼 맑은 채도로 머무를 수 있어 참 행복합니다.\n\n우리가 함께 눈부시게 거닐었던 초록빛의 싱그러운 여름 그늘도, 아스라히 주황빛 노을이 지던 가을의 갈대밭 옆모습도, 시린 공기를 감쌀 포근한 상상에 소박하게 웃던 하얀 첫눈 속의 겨울 하루도 전부 어제 일처럼 생생하게 마음에 남았어요.\n\n당신이 보내준 지극하고 다정한 사계의 연서에 깊은 감격의 미소를 머금어 작은 답장을 띄웁니다. 고맙습니다, 나의 고유한 예술가이자 내 모든 계절의 빛이 되어준 소중한 그대여.',
          date: '2026. 05. 25'
        }
      ];
      setLetters(defaultLetters);
      localStorage.setItem('sagyehwa_letters', JSON.stringify(defaultLetters));
    }
  }, []);

  const handleSendLetter = (e: FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim() || !messageInput.trim()) return;

    const formattedDate = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').trim();

    const newLetter: Letter = {
      id: `letter-${Date.now()}`,
      name: nameInput.trim(),
      email: emailInput.trim(),
      message: messageInput.trim(),
      date: formattedDate.endsWith('.') ? formattedDate.slice(0, -1) : formattedDate
    };

    const updated = [newLetter, ...letters];
    setLetters(updated);
    localStorage.setItem('sagyehwa_letters', JSON.stringify(updated));

    setToast({
      message: '당신이 보낸 소중하고 떨리는 답장 메시지가 그에게 머무는 한때로 소중하게 전송 및 보존되었습니다! 아래 보관함에서 확인하실 수 있습니다.',
      type: 'success'
    });
    
    setNameInput('');
    setEmailInput('');
    setMessageInput('');
  };

  const deleteLetter = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: '편지 삭제',
      message: '이 소중한 답장 편지를 보관함에서 지우시겠습니까?',
      onConfirm: () => {
        const filtered = letters.filter(l => l.id !== id);
        setLetters(filtered);
        localStorage.setItem('sagyehwa_letters', JSON.stringify(filtered));
        setConfirmModal(null);
        setToast({
          message: '소장한 서신이 보관함에서 정상적으로 삭제되었습니다.',
          type: 'info'
        });
      }
    });
  };

  const clearAllLetters = () => {
    setConfirmModal({
      isOpen: true,
      title: '보관함 전체 비우기',
      message: '보관함의 모든 답장들을 전부 비우시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      onConfirm: () => {
        setLetters([]);
        localStorage.setItem('sagyehwa_letters', JSON.stringify([]));
        setConfirmModal(null);
        setToast({
          message: '답장 편지 보관함이 완전히 비워졌습니다.',
          type: 'info'
        });
      }
    });
  };
  return (
    <div className="bg-[#FAF8F5] border-t border-b border-stone-200/50 py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <span className="font-serif italic text-stone-600 text-sm tracking-widest block font-medium">A Heartfelt Letter to My Dearest Muse</span>
          <h2 className="text-3xl sm:text-4xl text-stone-950 font-serif font-semibold tracking-tight">
            그녀에게 전하는 사계의 연서 (戀書)
          </h2>
          <div className="w-12 h-0.5 bg-stone-400 mx-auto" />
        </div>

        {/* Artist Profile & Cover Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-start">
          
          {/* Left Column: Portrait & Stats Cover */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-3/4 rounded-2xl overflow-hidden shadow-md border border-stone-200/60 p-3 bg-white"
            >
              <img
                src={artistEssay.profileImg}
                alt="Portrait of Artist Taegon Kim"
                className="w-full h-full object-cover rounded-xl filter saturate-[0.80]"
                referrerPolicy="no-referrer"
              />
              <div 
                className="absolute inset-0 pointer-events-none rounded-xl"
                style={{
                  background: 'radial-gradient(circle at center, rgba(0,0,0,0) 20%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.8) 100%)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none rounded-xl" />
              <div className="absolute bottom-6 left-6 text-white font-serif">
                <p className="text-xs uppercase tracking-widest text-amber-200 font-bold">DEDICATION TIMELINE</p>
                <p className="text-lg font-semibold text-white">오직 당신만의 사진작가 • 김태곤</p>
              </div>
            </motion.div>

            {/* Quick Professional Info Grid - Replaced with Romantic Season Memories Archive */}
            <div className="bg-white/80 rounded-2xl p-6 border border-stone-200/50 space-y-4">
              <h3 className="font-serif text-sm font-semibold text-stone-950 flex items-center gap-2">
                <Compass size={15} />
                <span>우리가 함께 빚어낸 사계의 기록</span>
              </h3>
              <ul className="text-xs text-stone-600 font-sans space-y-3 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-semibold uppercase">2017 春</span>
                  <span>흩날리던 연분홍 벚꽃잎 사이로 처음 마주했던 당신의 맑고 어여쁜 수줍음</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-semibold uppercase">2020 夏</span>
                  <span>눈부시던 초록빛 숲속에서, 나뭇잎 사이로 내리비치는 햇살과 싱그럽던 미소</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-700 font-semibold uppercase">2020 秋</span>
                  <span>노을 지는 마른 갈대밭길, 가을바람에 고개를 돌릴 때 번지던 진한 감성</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-500 font-semibold uppercase">2021 冬</span>
                  <span>소복소복 소리 없이 눈이 내리던 날, 폭신하고 포근한 캐시미어 옷깃 너머 안온한 미소</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Essays (Prologue & Epilogue) */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* The Quote Bubble */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="border-l-4 border-amber-800 pl-6 space-y-2 py-2"
            >
              <p className="font-serif text-lg sm:text-xl text-stone-950 italic leading-relaxed font-semibold">
                {artistEssay.quote}
              </p>
              <p className="text-xs text-stone-600 font-sans font-medium">
                ― 사계화(四季花) : 당신을 위해 열어준 오직 하나의 갤러리 서신에서
              </p>
            </motion.div>

            {/* Prologue Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-800" />
                <h3 className="font-serif text-lg font-bold text-stone-950">
                  그녀를 닮은 봄과 여름의 시선 (Prologue)
                </h3>
              </div>
              <div className="font-serif text-sm sm:text-base text-stone-900 leading-relaxed space-y-4 tracking-wide text-justify font-medium">
                {artistEssay.prologue.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="h-px bg-stone-300" />

            {/* Epilogue Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-800" />
                <h3 className="font-serif text-lg font-bold text-stone-950">
                  가을과 겨울의 여로에서 남기는 고백 (Epilogue)
                </h3>
              </div>
              <div className="font-serif text-sm sm:text-base text-stone-900 leading-relaxed space-y-4 tracking-wide text-justify font-medium">
                {artistEssay.epilogue.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="h-px bg-stone-200/65" />

            {/* Contact Form with real, sleek inputs connected to states */}
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-lg font-normal text-stone-900">
                  그녀에게서 전해질 소중한 답장
                </h3>
                <p className="text-stone-500 text-xs mt-1">
                  이 사계절의 연서를 마주하며 마음 깊은 한구석에 닿은 당신의 다정한 답장이나 속삭임을 남겨주세요.
                </p>
              </div>

              <form
                id="artist-contact-form"
                onSubmit={handleSendLetter}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="text-[10px] text-stone-500 uppercase tracking-wider block mb-1">나의 이름 / 서명</label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="당신의 이름 또는 서명"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full bg-white/60 focus:bg-white rounded-lg border border-stone-200 focus:border-stone-400 focus:outline-none p-2.5 text-xs transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="text-[10px] text-stone-500 uppercase tracking-wider block mb-1">닿을 수 있는 연락처</label>
                    <input
                      id="contact-email"
                      type="text"
                      required
                      placeholder="010-XXXX-XXXX 또는 이메일"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-white/60 focus:bg-white rounded-lg border border-stone-200 focus:border-stone-400 focus:outline-none p-2.5 text-xs transition-colors duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="text-[10px] text-stone-500 uppercase tracking-wider block mb-1">전하고 싶은 비밀 메시지</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    placeholder="이 고백 편지와 어우러진 사진들을 보며 마음속 깊이 번진 당신만의 아름다운 감상이나 고마움의 밀어를 전해 보세요..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="w-full bg-white/60 focus:bg-white rounded-lg border border-stone-200 focus:border-stone-400 focus:outline-none p-2.5 text-xs transition-colors duration-200"
                  />
                </div>

                <div className="text-right">
                  <button
                    id="contact-submit-btn"
                    type="submit"
                    className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-serif tracking-widest duration-200 shadow-sm cursor-pointer focus:outline-none"
                  >
                    아늑한 고백 답장 띄우기
                  </button>
                </div>
              </form>
            </div>

            {/* Immersive Received Letters / Inbox Board */}
            <div className="pt-8 border-t border-stone-200/60 mt-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-800/10 rounded-lg text-amber-800">
                    <Inbox size={14} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-stone-900">
                      수신된 편지 보관함 (Dearest Inbox)
                    </h4>
                    <p className="text-[10px] text-stone-400 font-sans">
                      그녀(또는 감상자)가 보낸 답장은 이 보관함에 즉시 안전하게 아카이브됩니다.
                    </p>
                  </div>
                </div>
                {letters.length > 0 && (
                  <button
                    onClick={clearAllLetters}
                    className="text-[10px] text-stone-400 hover:text-rose-600 font-sans tracking-tight transition-colors duration-200 focus:outline-none cursor-pointer"
                  >
                    편지함 전체 비우기
                  </button>
                )}
              </div>

              {letters.length === 0 ? (
                <div className="bg-stone-100/50 rounded-xl py-10 px-4 border border-stone-200/30 text-center text-stone-400 text-xs">
                  수신된 답장 편지가 없습니다. 위의 폼에 글을 적고 띄워보세요.
                </div>
              ) : (
                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin">
                  {letters.map((letter) => (
                    <motion.div
                      key={letter.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl p-5 border border-stone-200/60 shadow-xs flex flex-col justify-between relative group hover:border-stone-300 transition-all duration-300"
                    >
                      {/* Individual Delete Button */}
                      <button
                        onClick={() => deleteLetter(letter.id)}
                        className="absolute top-4 right-4 text-stone-300 hover:text-rose-600 p-1 rounded-md transition-colors duration-200 cursor-pointer pointer-events-auto"
                        title="편지 삭제"
                      >
                        <Trash2 size={13} />
                      </button>

                      <div className="space-y-3">
                        {/* Letter Header */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500 font-sans border-b border-stone-100 pb-2">
                          <span className="font-semibold text-stone-800 font-serif text-xs">
                            From. {letter.name}
                          </span>
                          <span className="text-stone-300">|</span>
                          <span className="text-stone-400 select-text">{letter.email}</span>
                          <span className="text-stone-300 ml-auto hidden sm:inline">|</span>
                          <div className="flex items-center gap-1 text-stone-400 font-mono text-[10px] sm:ml-0 ml-auto select-none">
                            <Calendar size={10} />
                            <span>{letter.date}</span>
                          </div>
                        </div>

                        {/* Letter Body message */}
                        <p className="font-serif text-xs sm:text-[13px] text-stone-700 leading-relaxed whitespace-pre-line text-justify font-medium">
                          {letter.message}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Beautiful Custom React Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-sm w-full p-6 space-y-4 text-left"
          >
            <div>
              <h3 className="font-serif text-sm font-bold text-stone-900">{confirmModal.title}</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-stone-200 text-stone-500 hover:bg-stone-50 hover:text-stone-700 rounded-lg text-xs font-serif font-semibold transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-serif font-semibold transition cursor-pointer"
              >
                확인
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Beautiful Custom Toast Notifications */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4">
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-stone-900 shadow-2xl rounded-2xl p-4 border border-stone-800 text-stone-100 flex items-start gap-3"
          >
            <div className="p-1.5 bg-amber-800/20 text-amber-200 rounded-lg shrink-0">
              <Inbox size={14} className="animate-pulse" />
            </div>
            <div className="flex-1 space-y-1 text-left">
              <p className="text-xs font-serif leading-relaxed text-stone-200 font-medium">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-[10px] text-amber-300 hover:text-amber-200 font-sans tracking-tight block font-semibold hover:underline cursor-pointer"
              >
                확인 완료 (닫기)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
