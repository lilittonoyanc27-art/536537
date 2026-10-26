import React, { useState, useMemo, useEffect } from 'react';
import {
  ALL_PHRASES,
  SECTIONS,
  DIALOGUES,
  WORK_EXPERIENCE_SPEECH,
  PhraseItem,
  SectionMeta
} from './dictionaryData.ts';
import {
  Search,
  Volume2,
  Bookmark,
  Eye,
  EyeOff,
  Sparkles,
  Briefcase,
  UserCheck,
  Clock,
  Coins,
  DoorOpen,
  HelpCircle,
  CheckSquare,
  Flame,
  ShieldAlert,
  Users,
  AlertTriangle,
  FileText,
  Smile,
  History,
  Star,
  Sun,
  Wrench,
  Megaphone,
  CheckCircle,
  ArrowRightLeft,
  Maximize2,
  AlertCircle,
  Activity,
  CheckCheck,
  ListOrdered,
  Ear,
  BookOpen,
  MessageSquare,
  MessageCircle,
  X,
  RotateCcw,
  Shuffle,
  Type
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Briefcase,
  UserCheck,
  Clock,
  Coins,
  DoorOpen,
  Volume2,
  HelpCircle,
  CheckSquare,
  Flame,
  ShieldAlert,
  Users,
  AlertTriangle,
  FileText,
  Smile,
  History,
  Star,
  Sun,
  Wrench,
  Megaphone,
  CheckCircle,
  ArrowRightLeft,
  Maximize2,
  AlertCircle,
  Activity,
  CheckCheck,
  ListOrdered,
  Ear,
  BookOpen,
  MessageSquare,
  MessageCircle
};

type TextScale = 'normal' | 'large' | 'huge';

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'all' | 'part1' | 'part2' | 'dialogues' | 'speech' | 'trainer' | 'favorites'>('all');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Font size scale state: default is 'large' for "шрифт побольше"
  const [textScale, setTextScale] = useState<TextScale>('large');

  // Translation reveal state: Set of revealed phrase IDs
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [globalRevealAll, setGlobalRevealAll] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('es_ru_job_favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Audio pronunciation state
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(0.9);

  // Flashcard Trainer state
  const [trainerIndex, setTrainerIndex] = useState(0);
  const [trainerRevealed, setTrainerRevealed] = useState(false);
  const [trainerKnownCount, setTrainerKnownCount] = useState(0);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('es_ru_job_favorites', JSON.stringify(Array.from(favorites)));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  // Handle Speech Synthesis
  const speakSpanish = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/^[—–-]\s*/, '').replace(/[¿?¡!]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = speechRate;

    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang === 'es-ES' || v.lang.startsWith('es'));
    if (esVoice) {
      utterance.voice = esVoice;
    }

    setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Toggle single card translation reveal
  const toggleReveal = (id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle all translations in current view
  const toggleAllReveals = () => {
    if (globalRevealAll) {
      setRevealedIds(new Set());
      setGlobalRevealAll(false);
    } else {
      const allIds = new Set(filteredPhrases.map(p => p.id));
      setRevealedIds(allIds);
      setGlobalRevealAll(true);
    }
  };

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtered phrases calculation
  const filteredPhrases = useMemo(() => {
    return ALL_PHRASES.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        item.es.toLowerCase().includes(q) ||
        item.ru.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (activeTab === 'part1' && item.part !== 1) return false;
      if (activeTab === 'part2' && item.part !== 2) return false;
      if (activeTab === 'favorites' && !favorites.has(item.id)) return false;

      if (selectedSectionId !== 'all' && item.sectionId !== selectedSectionId) return false;

      return true;
    });
  }, [searchQuery, activeTab, selectedSectionId, favorites]);

  // Trainer list
  const trainerList = useMemo(() => {
    if (activeTab !== 'trainer') return [];
    if (favorites.size > 0 && selectedSectionId === 'favorites') {
      return ALL_PHRASES.filter(p => favorites.has(p.id));
    }
    if (selectedSectionId !== 'all') {
      return ALL_PHRASES.filter(p => p.sectionId === selectedSectionId);
    }
    return ALL_PHRASES;
  }, [activeTab, selectedSectionId, favorites]);

  const currentTrainerCard = trainerList[trainerIndex] || trainerList[0];

  const handleNextTrainerCard = (known: boolean) => {
    if (known) setTrainerKnownCount(c => c + 1);
    setTrainerRevealed(false);
    if (trainerIndex < trainerList.length - 1) {
      setTrainerIndex(i => i + 1);
    } else {
      setTrainerIndex(0);
    }
  };

  const handleShuffleTrainer = () => {
    setTrainerIndex(Math.floor(Math.random() * trainerList.length));
    setTrainerRevealed(false);
  };

  // Available sections for current tab
  const availableSections = useMemo(() => {
    if (activeTab === 'part1') return SECTIONS.filter(s => s.part === 1);
    if (activeTab === 'part2') return SECTIONS.filter(s => s.part === 2);
    return SECTIONS;
  }, [activeTab]);

  // Font sizing CSS helpers based on textScale
  const fontSizes = {
    spanish: textScale === 'huge' ? 'text-2xl sm:text-3xl' : textScale === 'large' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl',
    russian: textScale === 'huge' ? 'text-xl sm:text-2xl' : textScale === 'large' ? 'text-lg sm:text-xl' : 'text-base sm:text-lg',
    subtitle: textScale === 'huge' ? 'text-sm' : textScale === 'large' ? 'text-xs' : 'text-[11px]',
    dialogueEs: textScale === 'huge' ? 'text-xl sm:text-2xl' : textScale === 'large' ? 'text-lg sm:text-xl' : 'text-base sm:text-lg',
    dialogueRu: textScale === 'huge' ? 'text-lg sm:text-xl' : textScale === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base',
  };

  return (
    <div className="min-h-screen bg-spain-theme text-slate-900 flex flex-col selection:bg-amber-400 selection:text-slate-950 font-sans">
      
      {/* Top Header */}
      <header className="border-b border-white/30 bg-white/85 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Main Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-sky-500 p-1 shadow-lg flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-white rounded-xl flex items-center justify-center text-2xl font-bold shadow-inner">
                🇪🇸
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                  EL TRABAJO
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-400 text-slate-950 shadow-sm">
                    A1–B1
                  </span>
                </h1>
                <span className="text-2xl">🇷🇺</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-sky-900">
                Словарь и фразы для работы · Кликните на фразу для перевода
              </p>
            </div>
          </div>

          {/* Quick Controls: Font Scale, Speed, Reveal, Favorites */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            
            {/* Font Scale Control (Шрифт побольше) */}
            <div className="flex items-center bg-sky-100/90 border border-sky-300 rounded-xl p-1 text-xs shadow-sm">
              <span className="px-2 text-sky-900 font-bold flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-sky-700" />
                Шрифт:
              </span>
              <button
                onClick={() => setTextScale('normal')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  textScale === 'normal'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white/50'
                }`}
                title="Обычный шрифт"
              >
                A
              </button>
              <button
                onClick={() => setTextScale('large')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  textScale === 'large'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white/50'
                }`}
                title="Крупный шрифт (по умолчанию)"
              >
                A+
              </button>
              <button
                onClick={() => setTextScale('huge')}
                className={`px-2.5 py-1 rounded-lg font-black transition ${
                  textScale === 'huge'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white/50'
                }`}
                title="Очень крупный шрифт"
              >
                A++
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center bg-sky-100/90 border border-sky-300 rounded-xl p-1 text-xs shadow-sm">
              <span className="px-2 text-sky-900 font-bold">Озвучка:</span>
              <button
                onClick={() => setSpeechRate(0.8)}
                className={`px-2 py-1 rounded-lg font-bold transition ${speechRate === 0.8 ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-700 hover:text-slate-950'}`}
                title="Замедленный темп для начинающих"
              >
                0.8x
              </button>
              <button
                onClick={() => setSpeechRate(1.0)}
                className={`px-2 py-1 rounded-lg font-bold transition ${speechRate === 1.0 ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-700 hover:text-slate-950'}`}
                title="Обычный темп речи"
              >
                1.0x
              </button>
            </div>

            {/* Toggle All Translations */}
            <button
              onClick={toggleAllReveals}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md active:scale-95 transition"
              title="Открыть или скрыть все переводы"
            >
              {globalRevealAll ? (
                <>
                  <EyeOff className="w-4 h-4 text-amber-300" />
                  <span>Скрыть перевод</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-amber-300" />
                  <span>Показать все</span>
                </>
              )}
            </button>

            {/* Favorites Counter */}
            <button
              onClick={() => {
                setActiveTab(activeTab === 'favorites' ? 'all' : 'favorites');
                setSelectedSectionId('all');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border shadow-sm transition ${
                activeTab === 'favorites'
                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md'
                  : 'bg-white hover:bg-amber-50 text-slate-800 border-sky-300'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-slate-950 text-slate-950' : 'fill-amber-400 text-amber-500'}`} />
              <span>Закладки ({favorites.size})</span>
            </button>

          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-sky-200 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs sm:text-sm">
          <button
            onClick={() => { setActiveTab('all'); setSelectedSectionId('all'); }}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition shadow-sm ${
              activeTab === 'all'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'bg-white/70 text-slate-700 hover:text-slate-950 hover:bg-white'
            }`}
          >
            Все фразы ({ALL_PHRASES.length})
          </button>

          <button
            onClick={() => { setActiveTab('part1'); setSelectedSectionId('all'); }}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition shadow-sm ${
              activeTab === 'part1'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'bg-white/70 text-slate-700 hover:text-slate-950 hover:bg-white'
            }`}
          >
            Часть 1: Основы и старт
          </button>

          <button
            onClick={() => { setActiveTab('part2'); setSelectedSectionId('all'); }}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition shadow-sm ${
              activeTab === 'part2'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'bg-white/70 text-slate-700 hover:text-slate-950 hover:bg-white'
            }`}
          >
            Часть 2: Практика на объекте
          </button>

          <button
            onClick={() => { setActiveTab('dialogues'); }}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition shadow-sm flex items-center gap-1.5 ${
              activeTab === 'dialogues'
                ? 'bg-orange-500 text-white shadow'
                : 'bg-white/70 text-orange-700 hover:text-orange-950 hover:bg-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Диалоги из жизни ({DIALOGUES.length})
          </button>

          <button
            onClick={() => { setActiveTab('speech'); }}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition shadow-sm flex items-center gap-1.5 ${
              activeTab === 'speech'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white/70 text-blue-800 hover:text-blue-950 hover:bg-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Рассказ о себе (Собеседование)
          </button>

          <button
            onClick={() => { setActiveTab('trainer'); }}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition shadow-sm flex items-center gap-1.5 ${
              activeTab === 'trainer'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow'
                : 'bg-white/70 text-amber-800 hover:text-amber-950 hover:bg-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Тренажёр карточек
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 flex-1 flex flex-col">
        
        {/* Banner with Clear Work Info */}
        <div className="relative overflow-hidden rounded-3xl bg-white/95 border-2 border-white shadow-xl p-6 sm:p-7 mb-6 backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-gradient-to-br from-amber-300/30 to-orange-400/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-60 h-60 bg-gradient-to-tr from-sky-400/30 to-blue-500/30 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs uppercase tracking-wider font-extrabold text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200">
                  Разговорный испанский (A1–B1)
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs sm:text-sm font-bold text-sky-800">
                  Кликните на испанскую фразу, чтобы открыть русский перевод
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                🇪🇸 EL TRABAJO — РАБОТА 🇷🇺
              </h2>
              <p className="text-sm sm:text-base text-slate-700 mt-1.5 max-w-3xl leading-relaxed font-medium">
                Полный разговорный словарь для поиска работы, собеседования, понимания начальника и инструкций на стройке, складе и фабрике. Нажмите на любую фразу или карточку — откроется русский перевод.
              </p>
            </div>

            {/* Instruction badge */}
            <div className="shrink-0 flex items-center gap-3.5 bg-sky-50 border-2 border-sky-200 rounded-2xl p-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xl shadow-md">
                💡
              </div>
              <div className="leading-tight">
                <div className="font-extrabold text-slate-900 text-sm sm:text-base">Кликните на фразу</div>
                <div className="text-sky-800 text-xs font-semibold">Показывает и скрывает перевод</div>
              </div>
            </div>
          </div>
        </div>

        {/* DIALOGUES VIEW */}
        {activeTab === 'dialogues' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-amber-300" />
                Живые диалоги на работе (Diálogos reales)
              </h3>
              <span className="text-xs sm:text-sm font-bold text-sky-100 bg-blue-900/40 px-3 py-1 rounded-full">
                Нажимайте на реплики, чтобы открыть русский перевод
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {DIALOGUES.map(dialogue => (
                <div
                  key={dialogue.id}
                  className="bg-white/95 backdrop-blur-md rounded-3xl border-2 border-white/60 p-6 shadow-xl flex flex-col"
                >
                  <div className="border-b border-slate-200 pb-3 mb-4">
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded">
                      {dialogue.part === 1 ? 'Часть 1' : 'Часть 2'}
                    </span>
                    <h4 className="text-lg sm:text-xl font-black text-slate-900 mt-1">{dialogue.title}</h4>
                    <p className="text-sm font-semibold text-slate-600">{dialogue.titleRu}</p>
                  </div>

                  <div className="space-y-3 flex-1">
                    {dialogue.messages.map((msg, i) => {
                      const msgId = `${dialogue.id}_${i}`;
                      const isRevealed = revealedIds.has(msgId) || globalRevealAll;
                      const isJefe = msg.speaker.toLowerCase().includes('jefe');
                      const isWorker = msg.speaker.toLowerCase().includes('trabajador');

                      return (
                        <div
                          key={i}
                          onClick={() => toggleReveal(msgId)}
                          className={`cursor-pointer rounded-2xl p-4 border-2 transition-all card-hover-effect ${
                            isJefe
                              ? 'bg-sky-50 border-sky-300 hover:border-blue-500'
                              : isWorker
                              ? 'bg-amber-50/70 border-amber-300 hover:border-amber-500'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className={`text-xs font-extrabold uppercase tracking-wider ${isJefe ? 'text-blue-800' : isWorker ? 'text-amber-800' : 'text-slate-700'}`}>
                              {msg.speaker} ({msg.speakerRu})
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                speakSpanish(msg.es, msgId);
                              }}
                              className="text-slate-500 hover:text-blue-600 p-1 rounded-lg transition"
                              title="Озвучить на испанском"
                            >
                              <Volume2 className={`w-4 h-4 ${speakingId === msgId ? 'text-blue-600 animate-pulse' : ''}`} />
                            </button>
                          </div>

                          {/* Spanish phrase with large readable font */}
                          <div className={`font-black text-slate-950 leading-snug ${fontSizes.dialogueEs}`}>
                            {msg.es}
                          </div>

                          {/* Russian Translation on Click */}
                          {isRevealed ? (
                            <div className="mt-3 pt-2.5 border-t border-slate-200/80 animate-fadeIn">
                              <div className={`font-bold text-amber-900 bg-amber-100/90 rounded-xl px-3 py-2 border border-amber-300 leading-snug ${fontSizes.dialogueRu}`}>
                                🇷🇺 {msg.ru}
                              </div>
                              <span className="text-[11px] text-slate-500 block text-right mt-1">нажмите, чтобы скрыть</span>
                            </div>
                          ) : (
                            <div className="mt-2 text-xs font-semibold text-sky-800 flex items-center gap-1.5 hover:text-blue-900 transition">
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Нажмите для перевода</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WORK EXPERIENCE SPEECH VIEW */}
        {activeTab === 'speech' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white/95 backdrop-blur-xl border-2 border-white rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
                <div>
                  <span className="text-xs font-black text-orange-600 uppercase tracking-wider bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
                    Презентация на собеседовании (A1–B1)
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-950 mt-2">
                    {WORK_EXPERIENCE_SPEECH.titleEs}
                  </h3>
                  <p className="text-base font-semibold text-slate-600 mt-1">
                    {WORK_EXPERIENCE_SPEECH.titleRu}
                  </p>
                </div>

                <button
                  onClick={() => {
                    const fullText = WORK_EXPERIENCE_SPEECH.paragraphs.map(p => p.es).join(' ');
                    speakSpanish(fullText, 'full_speech');
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black rounded-2xl shadow-lg active:scale-95 transition text-sm whitespace-nowrap self-start"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Прослушать весь текст</span>
                </button>
              </div>

              <div className="space-y-4">
                {WORK_EXPERIENCE_SPEECH.paragraphs.map((p, index) => {
                  const speechId = `speech_para_${index}`;
                  const isRevealed = revealedIds.has(speechId) || globalRevealAll;

                  return (
                    <div
                      key={index}
                      onClick={() => toggleReveal(speechId)}
                      className="cursor-pointer bg-sky-50/70 border-2 border-sky-200 hover:border-amber-400 rounded-2xl p-5 transition-all card-hover-effect"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className={`font-black text-slate-950 leading-relaxed ${fontSizes.spanish}`}>
                            {p.es}
                          </p>

                          {isRevealed ? (
                            <div className="mt-4 pt-3 border-t border-sky-200 text-amber-950 bg-amber-100/90 p-4 rounded-xl border border-amber-300">
                              <span className="font-black text-orange-700 block text-xs uppercase mb-1">
                                🇷🇺 Перевод:
                              </span>
                              <div className={`font-bold leading-relaxed ${fontSizes.russian}`}>
                                {p.ru}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm font-bold text-sky-800 mt-3 flex items-center gap-2 hover:text-blue-900 transition">
                              <Eye className="w-4 h-4 text-blue-600" />
                              <span>Нажмите на абзац, чтобы открыть русский перевод</span>
                            </p>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakSpanish(p.es, speechId);
                          }}
                          className="p-3 rounded-xl bg-white hover:bg-amber-400 hover:text-slate-950 text-slate-700 border border-sky-300 transition shrink-0 shadow-sm"
                          title="Прослушать этот абзац"
                        >
                          <Volume2 className={`w-5 h-5 ${speakingId === speechId ? 'text-orange-600 animate-pulse' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-sm text-slate-800 leading-relaxed font-medium">
                <span className="font-black text-amber-900">💡 Совет для собеседования:</span> Выучите этот текст наизусть. Вы можете заменить имя «Carlos» на своё, профессию «soldador» на свою («electricista», «albañil», «camarero», «mozo de almacén»), а количество лет опыта — на ваш реальный стаж.
              </div>
            </div>
          </div>
        )}

        {/* TRAINER / FLASHCARD VIEW */}
        {activeTab === 'trainer' && (
          <div className="max-w-2xl mx-auto w-full space-y-6">
            <div className="flex items-center justify-between text-sm font-bold text-white drop-shadow">
              <div className="flex items-center gap-2">
                <span className="text-amber-300 font-extrabold">Карточка {trainerIndex + 1}</span>
                <span>из {trainerList.length}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold">Изучено: {trainerKnownCount}</span>
                <button
                  onClick={handleShuffleTrainer}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/80 hover:bg-white text-slate-900 rounded-lg text-xs font-bold transition shadow"
                  title="Перемешать карточки"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Случайная</span>
                </button>
              </div>
            </div>

            {currentTrainerCard ? (
              <div className="bg-white/95 backdrop-blur-xl border-2 border-white rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center text-center relative overflow-hidden min-h-[420px] justify-between">
                
                {/* Category & Section tag */}
                <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap justify-center">
                  <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-900 border border-sky-300 font-bold">
                    {currentTrainerCard.sectionTitle}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-orange-700 font-extrabold uppercase tracking-wider text-xs">
                    {currentTrainerCard.category}
                  </span>
                </div>

                {/* Spanish Front (Core Card) */}
                <div className="my-8 space-y-4 w-full">
                  <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                    Испанский (Español)
                  </div>
                  <h3 className={`font-black text-slate-950 tracking-tight leading-snug px-4 ${textScale === 'huge' ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}>
                    {currentTrainerCard.es}
                  </h3>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => speakSpanish(currentTrainerCard.es, `trainer_${currentTrainerCard.id}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-100 hover:bg-amber-400 hover:text-slate-950 text-slate-800 text-xs sm:text-sm font-extrabold transition shadow-sm"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Слушать</span>
                    </button>
                    <button
                      onClick={() => toggleFavorite(currentTrainerCard.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-amber-100 text-xs sm:text-sm font-bold text-slate-800 transition shadow-sm"
                    >
                      <Bookmark className={`w-4 h-4 ${favorites.has(currentTrainerCard.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                      <span>{favorites.has(currentTrainerCard.id) ? 'В закладках' : 'В закладки'}</span>
                    </button>
                  </div>
                </div>

                {/* Click to Reveal Translation */}
                <div className="w-full">
                  {trainerRevealed ? (
                    <div className="bg-amber-100 border-2 border-amber-300 rounded-2xl p-5 text-center animate-fadeIn space-y-1.5 shadow-inner">
                      <div className="text-xs uppercase tracking-wider text-amber-900 font-black">
                        Русский перевод:
                      </div>
                      <div className={`font-black text-amber-950 ${textScale === 'huge' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>
                        {currentTrainerCard.ru}
                      </div>
                      {currentTrainerCard.note && (
                        <div className="text-xs text-slate-700 font-semibold pt-2 border-t border-amber-200 mt-2">
                          💡 {currentTrainerCard.note}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setTrainerRevealed(true)}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-amber-500 hover:from-blue-700 hover:to-amber-600 text-white font-black text-base shadow-xl active:scale-98 transition flex items-center justify-center gap-2"
                    >
                      <Eye className="w-5 h-5 text-amber-300" />
                      <span>Нажмите, чтобы увидеть перевод</span>
                    </button>
                  )}
                </div>

                {/* Bottom Controls: Знаю / Повторить */}
                <div className="w-full flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleNextTrainerCard(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-900 text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Повторить ещё</span>
                  </button>

                  <button
                    onClick={() => handleNextTrainerCard(true)}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Знаю! Следующая</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-white font-bold">
                Нет карточек для тренировки в выбранном разделе.
              </div>
            )}
          </div>
        )}

        {/* DICTIONARY PHRASES VIEW (ALL / PART 1 / PART 2 / FAVORITES) */}
        {(activeTab === 'all' || activeTab === 'part1' || activeTab === 'part2' || activeTab === 'favorites') && (
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Sidebar: Categories & Sections Filter */}
            <aside className="lg:w-80 shrink-0 space-y-4">
              
              {/* Search Box */}
              <div className="relative">
                <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по слову / фразе..."
                  className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border-2 border-sky-300 text-slate-950 placeholder-slate-400 text-sm font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400 shadow-md transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Section Selector List */}
              <div className="bg-white/95 backdrop-blur-md rounded-3xl border-2 border-white/80 p-3.5 shadow-xl max-h-[640px] overflow-y-auto">
                <div className="px-3 py-2 text-xs font-black uppercase tracking-wider text-sky-950 flex items-center justify-between border-b border-slate-200 mb-2">
                  <span>Разделы словаря</span>
                  <span className="text-slate-500 font-bold">
                    {filteredPhrases.length} найдено
                  </span>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedSectionId('all')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition ${
                      selectedSectionId === 'all'
                        ? 'bg-amber-400 text-slate-950 shadow-md'
                        : 'text-slate-700 hover:bg-sky-50 hover:text-slate-950'
                    }`}
                  >
                    <span className="truncate">Все разделы</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900/10 font-bold">
                      {ALL_PHRASES.length}
                    </span>
                  </button>

                  {availableSections.map(sec => {
                    const IconComponent = ICON_MAP[sec.iconName] || Briefcase;
                    const isSelected = selectedSectionId === sec.id;
                    const count = ALL_PHRASES.filter(p => p.sectionId === sec.id).length;

                    return (
                      <button
                        key={sec.id}
                        onClick={() => setSelectedSectionId(sec.id)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-2 transition ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black shadow-md'
                            : 'text-slate-700 hover:bg-sky-50 hover:text-slate-950 font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-slate-950' : 'text-blue-600'}`} />
                          <span className="truncate">{sec.title}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${isSelected ? 'bg-black/20 text-slate-950 font-bold' : 'bg-slate-100 text-slate-600 font-bold'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Useful Tip Box */}
              <div className="rounded-3xl bg-white/90 border-2 border-sky-300 p-5 text-xs sm:text-sm text-slate-800 space-y-2 shadow-lg">
                <div className="font-black text-orange-600 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Горячая подсказка
                </div>
                <p className="leading-relaxed font-medium">
                  В Испании на стройках и производствах принято обращение на <span className="text-orange-700 font-extrabold">«tú»</span> (ты). Повелительные глаголы типа <em>«Tráeme»</em>, <em>«Ven»</em>, <em>«Ponte el casco»</em> звучат дружелюбно и привычно.
                </p>
              </div>

            </aside>

            {/* Main Content: Phrase Cards Grid */}
            <div className="flex-1 space-y-4">
              
              {/* Header Info for Selected Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/40">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white drop-shadow flex items-center gap-2">
                    {selectedSectionId === 'all'
                      ? 'Все фразы и глаголы'
                      : SECTIONS.find(s => s.id === selectedSectionId)?.title || selectedSectionId}
                    <span className="text-sm font-bold text-amber-300">
                      ({filteredPhrases.length})
                    </span>
                  </h3>
                  {selectedSectionId !== 'all' && (
                    <p className="text-xs sm:text-sm text-sky-100 font-medium">
                      {SECTIONS.find(s => s.id === selectedSectionId)?.description}
                    </p>
                  )}
                </div>

                <div className="text-xs sm:text-sm font-bold text-sky-950 bg-white/80 px-3 py-1 rounded-full shadow-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse" />
                  <span>Кликните на карточку для перевода</span>
                </div>
              </div>

              {/* Empty State */}
              {filteredPhrases.length === 0 && (
                <div className="text-center py-16 bg-white/90 rounded-3xl border-2 border-sky-300 p-8 space-y-3 shadow-xl">
                  <HelpCircle className="w-12 h-12 text-amber-500 mx-auto" />
                  <p className="text-lg font-black text-slate-950">Ничего не найдено</p>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto font-medium">
                    Попробуйте изменить запрос в строке поиска или сбросить фильтр разделов.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedSectionId('all'); }}
                    className="px-5 py-2.5 bg-amber-400 text-slate-950 font-black rounded-xl text-sm shadow transition hover:bg-amber-300"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              )}

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPhrases.map(item => {
                  const isRevealed = revealedIds.has(item.id) || globalRevealAll;
                  const isFav = favorites.has(item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleReveal(item.id)}
                      className={`group relative rounded-3xl border-2 transition-all cursor-pointer p-5 select-none flex flex-col justify-between card-hover-effect ${
                        isRevealed
                          ? 'bg-white border-amber-400 shadow-xl ring-2 ring-amber-400/30'
                          : 'bg-white/95 border-sky-200/90 hover:border-amber-400 hover:bg-white shadow-lg'
                      }`}
                    >
                      {/* Card Top: Category and Actions */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-sky-900 truncate">
                          <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 border border-sky-300 font-extrabold">
                            {item.category}
                          </span>
                          {item.speaker && (
                            <span className="text-amber-800 font-black truncate">
                              · {item.speaker}
                            </span>
                          )}
                        </div>

                        {/* Top-Right Quick Actions (Listen & Favorite) */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => speakSpanish(item.es, item.id)}
                            className="p-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-sky-100 transition shadow-sm"
                            title="Прослушать на испанском"
                          >
                            <Volume2 className={`w-4 h-4 ${speakingId === item.id ? 'text-blue-600 animate-pulse' : ''}`} />
                          </button>

                          <button
                            onClick={() => toggleFavorite(item.id)}
                            className="p-2 rounded-xl text-slate-500 hover:text-amber-500 hover:bg-amber-50 transition shadow-sm"
                            title={isFav ? 'Удалить из закладок' : 'Добавить в закладки'}
                          >
                            <Bookmark className={`w-4 h-4 ${isFav ? 'text-amber-500 fill-amber-500' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Main Spanish Text with Large Readable Font */}
                      <div className="my-2">
                        <div className={`font-black text-slate-950 group-hover:text-blue-900 transition-colors leading-snug tracking-tight ${fontSizes.spanish}`}>
                          {item.es}
                        </div>
                      </div>

                      {/* Reveal Section for Russian Translation */}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        {isRevealed ? (
                          <div className="space-y-2 animate-fadeIn">
                            <div className={`font-black text-amber-950 bg-amber-50 border border-amber-300 rounded-2xl p-3 leading-snug flex items-start gap-2 ${fontSizes.russian}`}>
                              <span className="shrink-0 text-xl">🇷🇺</span>
                              <span>{item.ru}</span>
                            </div>
                            {item.note && (
                              <div className="text-xs text-slate-700 bg-sky-50 rounded-xl p-2.5 border border-sky-200 font-semibold leading-relaxed">
                                💡 {item.note}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-400 font-medium text-right">
                              нажмите, чтобы скрыть
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 group-hover:text-blue-700 font-bold transition">
                            <span className="flex items-center gap-1.5 text-blue-700">
                              <Eye className="w-4 h-4 text-blue-600" />
                              Нажмите для перевода
                            </span>
                            <span className="text-xs text-slate-400 font-semibold">
                              Español ➔ Русский
                            </span>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/40 bg-white/90 backdrop-blur-md py-6 px-4 text-center text-xs sm:text-sm text-slate-700 mt-auto shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <span className="text-lg">🇪🇸</span>
            <span className="font-black">EL TRABAJO EN ESPAÑA</span>
            <span>·</span>
            <span>Разговорный словарь для работы A1–B1</span>
          </div>
          <div className="text-slate-600 font-medium text-xs">
            Нажимайте на любую фразу для моментального перевода и прослушивания.
          </div>
        </div>
      </footer>

    </div>
  );
}
