"use client"

import { useState, useMemo, useEffect } from "react"
import { useSession, signOut, signIn } from "next-auth/react"
import { MonthCalendar } from "@/components/month-calendar"
import { MonthReview } from "@/components/month-review"
import { LoginScreen } from "@/components/login-screen"
import { UserProfileEdit } from "@/components/user-profile-edit"
import { 
  ChevronLeft, ChevronRight, LogOut, BarChart3, 
  Quote, Target, Sun, Moon, Sparkles,
  Edit3, RefreshCw, Bookmark, Flower2, Heart, Coffee
} from "lucide-react"
import { getReadingData, updateUserGoal } from "@/lib/api-client" 
import Link from "next/link"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { toast } from "sonner"

const THEMES = {
  light: { 
    primary: '#8C7B6E', 
    bg: '#FAFAF5',      
    text: '#4A443F', 
    card: '#ffffff',
    name: 'Algodão',
    icon: Sun
  },
  dark: { 
    primary: '#D1C7BD',
    bg: '#1A1918',
    text: '#F5F5F5',
    card: '#262422',
    name: 'Noite',
    icon: Moon
  },
  purple: { 
    primary: '#9B89B3', 
    bg: '#F8F7FA', 
    text: '#3D3547', 
    card: '#ffffff',
    name: 'Brisa',
    icon: Sparkles
  }
}

const LITERARY_QUOTES = [
  "Um café, um livro e um suspiro.",
  "Florescer entre páginas e sonhos.",
  "A quietude de uma tarde de leitura.",
  "Ler é como cultivar um jardim na alma.",
  "Pequenas alegrias: o cheiro de livro novo.",
  "Deixe o tempo parar enquanto você lê."
];

export default function Home() {
  const { data: session, status } = useSession()
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth())
  const [showBack, setShowBack] = useState(false)
  const [quote, setQuote] = useState("")
  const [activeTheme, setActiveTheme] = useState<keyof typeof THEMES>('light')
  const [isThemeLoading, setIsThemeLoading] = useState(true)
  const [goalsByYear, setGoalsByYear] = useState<Record<number, number>>({})
  const [totalReadThisYear, setTotalReadThisYear] = useState(0)
  const [readingData, setReadingData] = useState<any[]>([])
  const [direction, setDirection] = useState(0)
  const [profileEditOpen, setProfileEditOpen] = useState(false)
  const [hasCheckedPreviousYears, setHasCheckedPreviousYears] = useState(false)

  const capitalize = (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : ''
  const getFirstName = () => session?.user?.name ? capitalize(session.user.name.split(' ')[0]) : 'Usuário'

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  useEffect(() => {
    const savedGoals = localStorage.getItem("metas_por_ano")
    if (savedGoals) setGoalsByYear(JSON.parse(savedGoals))
    const savedTheme = localStorage.getItem("app-theme") as keyof typeof THEMES
    if (savedTheme && THEMES[savedTheme]) {
      setActiveTheme(savedTheme)
    }
    setIsThemeLoading(false)
    setQuote(LITERARY_QUOTES[Math.floor(Math.random() * LITERARY_QUOTES.length)])
  }, [])

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.email) return;

      const email = session.user.email.toLowerCase();
      const cacheKey = `readingData_${email}_${currentYear}`;
      const goalCacheKey = `readingGoal_${email}_${currentYear}`;
      let cacheLoaded = false;

      if (typeof window !== 'undefined') {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const books = JSON.parse(cachedData);
            setReadingData(books);
            setTotalReadThisYear(books.filter((b: any) => b && (b.status === 'lido' || b.end_date)).length);
            cacheLoaded = true;
          } catch {
            localStorage.removeItem(cacheKey);
          }
        }

        const cachedGoal = localStorage.getItem(goalCacheKey);
        if (cachedGoal) {
          const goalNumber = Number(cachedGoal);
          if (!Number.isNaN(goalNumber)) {
            setGoalsByYear(prev => ({ ...prev, [currentYear]: goalNumber }));
          }
        }
      }

      try {
        const response: any = await getReadingData(email, currentYear);
        const books = response?.data || [];

        if (books.length === 0 && !hasCheckedPreviousYears) {
          const allYearsResponse: any = await getReadingData(email, currentYear, false, undefined, undefined, true);
          const allRows = Array.isArray(allYearsResponse) ? allYearsResponse : allYearsResponse?.data || [];
          const latestYear = allRows.length > 0 ? Math.max(...allRows.map((b: any) => Number(b.year) || 0)) : currentYear;

          if (latestYear && latestYear !== currentYear) {
            setHasCheckedPreviousYears(true);
            setCurrentYear(latestYear);
            return;
          }

          setHasCheckedPreviousYears(true);
        }

        if (response?.userGoal) {
          setGoalsByYear(prev => ({ ...prev, [currentYear]: response.userGoal }));
          if (typeof window !== 'undefined') {
            localStorage.setItem(goalCacheKey, String(response.userGoal));
          }
        }
        setTotalReadThisYear(books.filter((b: any) => b && (b.status === 'lido' || b.end_date)).length);
        setReadingData(books);
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, JSON.stringify(books));
        }
      } catch (e) {
        if (!cacheLoaded) {
          setReadingData([]);
        }
      }
    }
    fetchData();
  }, [session, currentYear]);

  const myBooksGoal = goalsByYear[currentYear] || 12
  const progressPercent = Math.min(Math.round((totalReadThisYear / myBooksGoal) * 100), 100) || 0

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false, callbackUrl: '/' })
    } finally {
      window.location.href = '/'
    }
  }

  const handlePrevMonth = () => { 
    setDirection(-1); 
    if (currentMonth === 0) { setCurrentYear(p => p - 1); setCurrentMonth(11); } 
    else { setCurrentMonth(p => p - 1); }
  }

  const handleNextMonth = () => { 
    setDirection(1); 
    if (currentMonth === 11) { setCurrentYear(p => p + 1); setCurrentMonth(0); } 
    else { setCurrentMonth(p => p + 1); }
  }

  const onDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) handlePrevMonth();
    else if (info.offset.x < -swipeThreshold) handleNextMonth();
  }

  const theme = THEMES[activeTheme] || THEMES.light
  const isDark = activeTheme === 'dark'

  const months = useMemo(() => {
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0
    return [
      { name: "Janeiro", days: 31 }, { name: "Fevereiro", days: isLeapYear ? 29 : 28 },
      { name: "Março", days: 31 }, { name: "Abril", days: 30 },
      { name: "Maio", days: 31 }, { name: "Junho", days: 30 },
      { name: "Julho", days: 31 }, { name: "Agosto", days: 31 },
      { name: "Setembro", days: 30 }, { name: "Outubro", days: 31 },
      { name: "Novembro", days: 30 }, { name: "Dezembro", days: 31 },
    ]
  }, [currentYear])

  if (status === "loading" || isThemeLoading) {
    const loadingTheme = THEMES[activeTheme] || THEMES.light
    return (
      <div 
        className="h-screen flex flex-col items-center justify-center transition-colors duration-500" 
        style={{ backgroundColor: loadingTheme.bg, color: loadingTheme.primary }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-4"
        >
          <Coffee className="h-12 w-12" />
        </motion.div>
        <p className="italic font-serif opacity-70 animate-pulse">Preparando o café...</p>
      </div>
    )
  }

  if (!session) return <LoginScreen onLogin={async () => signIn("google")} />

  return (
    <div className="flex flex-col min-h-screen transition-all duration-700 font-serif overflow-x-hidden" style={{ backgroundColor: theme.bg, color: theme.text }}>
      
      <main className="grow p-3 sm:p-4 md:p-10">
        <div className="mx-auto max-w-5xl">

          {/* HEADER */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 sm:mb-10 flex flex-col lg:flex-row items-start sm:items-center justify-between p-4 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-black/5 relative overflow-hidden shadow-sm gap-4"
            style={{ backgroundColor: theme.card }}
          >
            <Flower2 className="absolute -top-6 -right-6 opacity-[0.03]" size={120} style={{ color: theme.primary }} />
            
            <div className="flex items-center gap-3 sm:gap-5 relative z-10 w-full lg:w-auto min-w-0">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white/10 shrink-0">
                {session.user?.image ? <img src={session.user.image} alt="Perfil" /> : <span className="flex h-full items-center justify-center italic text-xl">{getFirstName().charAt(0)}</span>}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black italic leading-tight truncate">
                   <span className="font-light opacity-50">{greeting},</span> {getFirstName()}
                </h1>
                <p className="text-[11px] sm:text-xs font-bold opacity-40 flex items-center gap-2 truncate">
                  <img src="/logo.png" alt="Logo Calendário Literário" className="h-4 w-4 rounded-full object-cover" />
                  Meu Calendário Literário
                </p>
              </div>
              <button onClick={() => setProfileEditOpen(true)} className="p-2 opacity-30 hover:opacity-100 transition-opacity"><Edit3 size={14}/></button>
            </div>

            <div className="flex gap-1.5 sm:gap-2 mt-1 sm:mt-2 lg:mt-0 p-1.5 bg-black/10 rounded-full w-full lg:w-auto justify-center">
              {Object.entries(THEMES).map(([key, val]) => (
                <button 
                  key={key} 
                  type="button"
                  onClick={() => { setActiveTheme(key as keyof typeof THEMES); localStorage.setItem("app-theme", key); }}
                  className={`p-2 rounded-full transition-all ${activeTheme === key ? 'bg-white shadow-sm' : 'opacity-40'}`}
                  style={{ color: activeTheme === key ? (key === 'dark' ? '#1A1918' : val.primary) : 'inherit' }}
                >
                  <val.icon size={16} />
                </button>
              ))}
              <button type="button" onClick={handleLogout} className="p-2 text-rose-300 opacity-40 hover:opacity-100 hover:text-rose-500"><LogOut size={16}/></button>
            </div>
          </motion.div>

          {/* PROGRESSO */}
          {!showBack && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className="mb-8 sm:mb-10 p-4 sm:p-6 md:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-black/[0.03]"
              style={{ backgroundColor: theme.card }}
            >
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-end justify-between gap-3 sm:gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-40">Meta de {currentYear}</p>
                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-black italic tracking-tighter" style={{ color: theme.primary }}>
                      {totalReadThisYear} / {myBooksGoal}
                    </h2>
                    <p className="text-sm italic opacity-40">Livros concluídos</p>
                  </div>
                  <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-dashed text-xs sm:text-sm font-bold italic" style={{ borderColor: `${theme.primary}40`, color: theme.primary, backgroundColor: `${theme.primary}12` }}>
                    {progressPercent}% da meta
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: `${theme.primary}1F` }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: theme.primary }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider opacity-45">
                    <span>0</span>
                    <span>{myBooksGoal} livros</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <div className="rounded-2xl border border-dashed p-3" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                    <p className="text-[10px] uppercase tracking-wider opacity-40 font-bold">Concluídos</p>
                    <p className="text-2xl font-black italic" style={{ color: theme.primary }}>{totalReadThisYear}</p>
                  </div>
                  <div className="rounded-2xl border border-dashed p-3" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                    <p className="text-[10px] uppercase tracking-wider opacity-40 font-bold">Meta</p>
                    <p className="text-2xl font-black italic" style={{ color: theme.primary }}>{myBooksGoal}</p>
                  </div>
                  <div className="rounded-2xl border border-dashed p-3" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                    <p className="text-[10px] uppercase tracking-wider opacity-40 font-bold">Faltam</p>
                    <p className="text-2xl font-black italic" style={{ color: theme.primary }}>{Math.max(myBooksGoal - totalReadThisYear, 0)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* NAVEGAÇÃO APP-LIKE */}
          <motion.div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4 mb-10 sm:mb-14">
            <motion.button
              onClick={() => setShowBack(!showBack)} 
              className="flex-[1.5] py-3.5 sm:py-4 rounded-2xl font-bold text-xs border border-black/5 flex items-center justify-center gap-3 shadow-sm transition-colors"
              style={{ backgroundColor: theme.card, color: theme.primary }}
            >
              {showBack ? <><ChevronLeft size={14} /> Calendário</> : <>Estante <ChevronRight size={14} /></>}
            </motion.button>

            <div className="grid grid-cols-2 flex-1 gap-3 sm:gap-4">
              <Link href="/retrospectiva" className="flex-1">
                <button className="w-full h-full py-3.5 sm:py-4 rounded-2xl font-bold text-xs border border-black/5 flex items-center justify-center gap-2 opacity-80 hover:opacity-100 bg-white/5 shadow-sm" style={{ backgroundColor: theme.card }}>
                  <BarChart3 size={14} /> Memórias
                </button>
              </Link>
              <Link href="/planejados" className="flex-1">
                <button className="w-full h-full py-3.5 sm:py-4 rounded-2xl font-bold text-xs border border-black/5 flex items-center justify-center gap-2 opacity-80 hover:opacity-100 bg-white/5 shadow-sm" style={{ backgroundColor: theme.card }}>
                  <Bookmark size={14} /> Desejos
                </button>
              </Link>
            </div>
          </motion.div>

          {/* ÁREA DE CALENDÁRIO COM GESTO */}
          <div className="mb-6 sm:mb-8 px-1 sm:px-2 flex justify-between items-end">
             <div className="flex flex-col">
              <h3 className="text-3xl sm:text-5xl font-black italic tracking-tighter" style={{ color: theme.primary }}>
                {months[currentMonth].name}
              </h3>
              <span className="text-[9px] sm:text-[10px] font-bold opacity-30 tracking-widest">Deslize para mudar o mês</span>
            </div>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${currentYear}-${currentMonth}-${showBack}`}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={onDragEnd}
              initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="cursor-grab active:cursor-grabbing"
            >
              {!showBack ? (
                <MonthCalendar month={months[currentMonth].name} days={months[currentMonth].days} year={currentYear} userEmail={session.user?.email?.toLowerCase() || ""} monthIndex={currentMonth} themePrimary={theme.primary} initialReadings={readingData} />
              ) : (
                <MonthReview month={months[currentMonth].name} userEmail={session.user?.email?.toLowerCase() || ""} monthIndex={currentMonth} year={currentYear} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>


      <UserProfileEdit open={profileEditOpen} onCloseAction={() => setProfileEditOpen(false)} user={session.user || {}} onUpdateAction={() => setProfileEditOpen(false)} />
    </div>
  )
}