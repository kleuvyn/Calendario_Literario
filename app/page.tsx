"use client"

import { useState, useMemo, useEffect } from "react"
import { useSession, signOut, signIn } from "next-auth/react"
import { MonthCalendar } from "@/components/month-calendar"
import { MonthReview } from "@/components/month-review"
import { LoginScreen } from "@/components/login-screen"
import { UserProfileEdit } from "@/components/user-profile-edit"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, LogOut, Loader2, BarChart3, Quote, Target, BookOpen, CheckCircle2, XCircle, Sun, Moon, Sparkles, Edit3, RefreshCw, TrendingUp, TrendingDown, Flame } from "lucide-react"
import { getReadingData, updateUserGoal, deleteFullAccount } from "@/lib/api-client" 
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

const THEMES = {
  light: { 
    primary: '#6366f1', 
    bg: '#f8fafc', 
    text: '#1e293b', 
    card: '#ffffff',
    name: 'Claro',
    icon: Sun
  },
  dark: { 
    primary: '#60a5fa',
    bg: '#0a0f1f', 
    text: '#e2e8f0',
    card: '#1a1f35',
    name: 'Escuro',
    icon: Moon,
    cardBorder: '#2d3a52',
    accentBg: '#111827',
    accentText: '#a0aec0'
  },
  purple: { 
    primary: '#a855f7', 
    bg: '#faf5ff', 
    text: '#581c87', 
    card: '#ffffff',
    name: 'Roxo',
    icon: Sparkles
  }
}

const LITERARY_QUOTES = [
  "Um livro é um sonho que você segura na mão.",
  "Ler é sonhar pela mão de outrem.",
  "Livros são espelhos: você só vê neles o que já tem dentro de si.",
  "A leitura é, para o espírito, o que o exercício é para o corpo.",
  "Os livros são os amigos mais silenciosos e constantes.",
  "Ler é viajar sem sair do lugar."
];

export default function Home() {
  const { data: session, status } = useSession()
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth())
  const [showBack, setShowBack] = useState(false)
  const [quote, setQuote] = useState("")
  const [activeTheme, setActiveTheme] = useState<keyof typeof THEMES>('light')
  const [goalsByYear, setGoalsByYear] = useState<Record<number, number>>({})
  const [totalReadThisYear, setTotalReadThisYear] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [direction, setDirection] = useState(0)
  const [profileEditOpen, setProfileEditOpen] = useState(false)

  useEffect(() => {
    const savedGoals = localStorage.getItem("metas_por_ano")
    if (savedGoals) setGoalsByYear(JSON.parse(savedGoals))
    const savedTheme = localStorage.getItem("app-theme") as keyof typeof THEMES
    if (savedTheme) setActiveTheme(savedTheme)
    setQuote(LITERARY_QUOTES[Math.floor(Math.random() * LITERARY_QUOTES.length)])
  }, [])

  useEffect(() => {
    async function fetchData() {
      if (session?.user?.email) {
        try {
          const response: any = await getReadingData(session.user.email.toLowerCase(), currentYear)
          const books = response?.data || []
          
          if (response?.userGoal) {
             setGoalsByYear(prev => ({ ...prev, [currentYear]: response.userGoal }))
          }
          const finished = books.filter((b: any) => b && (b.status === 'lido' || b.end_date)).length
          setTotalReadThisYear(finished)
        } catch (e) { 
        }
      }
    }
    fetchData()
  }, [session, currentYear])

  const myBooksGoal = goalsByYear[currentYear] || 12

  const handleSetGoal = async () => {
    const newGoal = prompt(`Nova meta para ${currentYear}:`, myBooksGoal.toString())
    if (newGoal && !isNaN(Number(newGoal)) && session?.user?.email) {
      const goalNum = Number(newGoal)
      setIsSaving(true)
      try {
        await updateUserGoal(session.user.email.toLowerCase(), goalNum, currentYear)
        const updated = { ...goalsByYear, [currentYear]: goalNum }
        setGoalsByYear(updated)
        localStorage.setItem("metas_por_ano", JSON.stringify(updated))
        toast.success("Meta atualizada! 🎯", { 
          description: `Sua nova meta para ${currentYear} é ${goalNum} livros`,
          icon: <Target size={16} />
        })
      } catch (error) { 
        toast.error("Erro ao salvar meta", { 
          description: "Não foi possível atualizar sua meta.",
          icon: <XCircle size={16} />
        })
      } finally { setIsSaving(false) }
    }
  }

  const refreshQuote = () => {
    setQuote(LITERARY_QUOTES[Math.floor(Math.random() * LITERARY_QUOTES.length)])
  }

  const theme = THEMES[activeTheme] || THEMES.light
  
  const isDark = activeTheme === 'dark'
  
  const getCardStyle = () => isDark 
    ? { backgroundColor: 'rgba(26, 31, 53, 0.5)', borderColor: 'rgba(45, 58, 82, 0.5)' }
    : { backgroundColor: 'rgba(255, 255, 255, 0.4)', borderColor: 'rgba(255, 255, 255, 0.5)' }
  
  const getHoverStyle = () => isDark
    ? 'hover:bg-opacity-70'
    : 'hover:bg-white/50'
  const handlePrevMonth = () => {
    setDirection(-1);
    if (currentMonth === 0) {
      setCurrentYear(p => p - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(p => p - 1);
    }
  }
  
  const handleNextMonth = () => {
    setDirection(1);
    if (currentMonth === 11) {
      setCurrentYear(p => p + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(p => p + 1);
    }
  }

  const progressPercent = Math.min(Math.round((totalReadThisYear / myBooksGoal) * 100), 100) || 0
  const booksRemaining = Math.max(myBooksGoal - totalReadThisYear, 0)
  const isAhead = totalReadThisYear > myBooksGoal
  const isOnTrack = progressPercent >= 75 && progressPercent < 100
  const isBehind = progressPercent < 75

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

  if (status === "loading") return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>
  if (!session) return <LoginScreen onLogin={async () => signIn("google")} />

  return (
    <div className="flex flex-col min-h-screen transition-all duration-700" style={{ 
      background: `linear-gradient(135deg, ${theme.bg} 0%, ${theme.bg}99 50%, ${theme.bg}cc 100%)`
    }}>
      <main className="grow p-3 md:p-6 lg:p-10">
        <div className="mx-auto max-w-7xl">

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-7 flex flex-col lg:flex-row items-center justify-between backdrop-blur-sm p-5 rounded-xl shadow-sm gap-5 border"
            style={{
              backgroundColor: isDark ? 'rgba(26, 31, 53, 0.5)' : 'rgba(255, 255, 255, 0.4)',
              borderColor: isDark ? 'rgba(45, 58, 82, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}
          >
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative">
                <div className="h-12 w-12 rounded-lg border border-primary/20 overflow-hidden shadow-sm flex items-center justify-center" style={{ backgroundColor: session.user?.image ? 'transparent' : theme.primary }}>
                  {session.user?.image ? (
                    <img src={session.user.image} alt="Perfil" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-white text-base font-medium">{session.user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold tracking-tight" style={{ color: theme.text }}>
                    {session.user?.name ? session.user.name.split(' ')[0].charAt(0).toUpperCase() + session.user.name.split(' ')[0].slice(1) : 'Usuário'}
                  </h1>
                  <button 
                    onClick={() => setProfileEditOpen(true)}
                    className="p-1 hover:bg-white/50 rounded transition-all"
                    title="Editar perfil"
                  >
                    <Edit3 size={12} style={{ color: theme.primary, opacity: 0.6 }} strokeWidth={2} />
                  </button>
                </div>
                <p className="text-xs font-light" style={{ color: theme.text, opacity: 0.6 }}>
                  Calendário {currentYear}
                </p>
              </div>
            </div>

            <div className="flex backdrop-blur-sm p-1.5 rounded-lg border gap-1 shadow-sm transition-all duration-300" style={getCardStyle()}>
              {Object.entries(THEMES).map(([key, value]) => {
                const ThemeIcon = value.icon
                return (
                  <motion.button 
                    key={key} 
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { 
                      setActiveTheme(key as keyof typeof THEMES); 
                      localStorage.setItem("app-theme", key);
                      toast.success(`Tema ${value.name} ativado`, {
                        icon: <ThemeIcon size={14} />
                      })
                    }} 
                    className={`
                      p-2.5 rounded-md transition-all duration-200 flex flex-col items-center gap-1
                      ${activeTheme === key 
                        ? isDark ? 'bg-slate-700 shadow-md border border-slate-600' : 'bg-white shadow-sm border border-primary/25'
                        : 'opacity-55 hover:opacity-85'
                      }
                    `}
                    style={{ 
                      borderColor: activeTheme === key ? value.primary : 'transparent',
                      boxShadow: activeTheme === key && isDark ? `0 0 12px ${value.primary}40` : 'none'
                    }}
                  > 
                    <ThemeIcon 
                      size={14} 
                      style={{ color: activeTheme === key ? value.primary : '#94a3b8' }}
                      strokeWidth={1.5}
                    />
                    <span 
                      className="text-[8px] font-medium tracking-tight leading-none"
                      style={{ color: activeTheme === key ? value.primary : '#94a3b8' }}
                    >
                      {value.name}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            <div className="flex items-center gap-1.5">
                <Button variant="outline" size="icon" onClick={() => signOut({ callbackUrl: "/" })} className="h-9 w-9 text-slate-500 hover:bg-slate-50/50 border-white/40 rounded-lg shadow-xs transition-all">
                  <LogOut size={14} />
                </Button>
                
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-9 w-9 rounded-lg shadow-xs hover:shadow-xs transition-all border border-white/40" style={{ color: theme.primary }}>
                    <ChevronLeft size={16} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9 rounded-lg shadow-xs hover:shadow-xs transition-all border border-white/40" style={{ color: theme.primary }}>
                    <ChevronRight size={16} />
                  </Button>
                </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 backdrop-blur-md rounded-2xl p-8 border shadow-lg relative overflow-hidden transition-all duration-300"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(26, 31, 53, 0.6) 0%, rgba(26, 31, 53, 0.4) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.3) 100%)',
              borderColor: isDark ? 'rgba(45, 58, 82, 0.5)' : 'rgba(255, 255, 255, 0.6)'
            }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ backgroundColor: theme.primary }}></div>
            
            <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="flex justify-center lg:col-span-1">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full -rotate-90">
                    <circle 
                      cx="80" cy="80" r="70" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="12" 
                      className="text-white/40"
                    />
                    <circle 
                      cx="80" cy="80" r="70" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="12" 
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 70}`}
                      strokeDashoffset={`${2 * Math.PI * 70 * (1 - progressPercent / 100)}`}
                      className="transition-all duration-1000 ease-out"
                      style={{ color: theme.primary }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold" style={{ color: theme.primary }}>{progressPercent}%</span>
                    <span className="text-xs font-light text-slate-600">completo</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-1" style={{ color: theme.text }}>
                      {totalReadThisYear} <span className="text-lg font-light">de {myBooksGoal}</span>
                    </h3>
                    <p className="text-sm font-light" style={{ color: theme.text, opacity: 0.6 }}>
                      livros lidos em {currentYear}
                    </p>
                  </div>
                  <button 
                    onClick={handleSetGoal} 
                    disabled={isSaving}
                    className="p-2.5 hover:bg-white/50 rounded-lg transition-all group"
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin text-slate-400" />
                    ) : (
                      <Target size={16} className="text-slate-400 group-hover:text-slate-600" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {isAhead && (
                    <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium">
                      <TrendingUp size={14} />
                      <span>🎉 Acima da meta!</span>
                    </div>
                  )}
                  {isOnTrack && !isAhead && (
                    <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium">
                      <Flame size={14} />
                      <span>🔥 No ritmo!</span>
                    </div>
                  )}
                  {isBehind && (
                    <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-medium">
                      <TrendingDown size={14} />
                      <span>Faltam {booksRemaining} livros</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-light" style={{ color: theme.text, opacity: 0.5 }}>
                    <span>Progresso</span>
                    <span>{totalReadThisYear}/{myBooksGoal}</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden shadow-inner" style={{ backgroundColor: isDark ? 'rgba(45, 58, 82, 0.4)' : 'rgba(255, 255, 255, 0.5)' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full rounded-full shadow-lg"
                      style={{ backgroundColor: theme.primary }}
                    ></motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 flex items-center gap-3 px-5 py-4 backdrop-blur-sm rounded-lg border shadow-xs group transition-all duration-300"
            style={{
              ...getCardStyle(),
              ...(isDark ? { backgroundColor: 'rgba(26, 31, 53, 0.6)' } : {})
            }}
          >
            <Quote size={20} style={{ color: theme.primary, opacity: 0.4, flexShrink: 0 }} strokeWidth={1.5} />
            <p className="text-sm font-light leading-relaxed italic flex-1" style={{ color: theme.text, opacity: 0.75 }}>
              {quote}
            </p>
            <motion.button
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              onClick={refreshQuote}
              className="p-2 rounded-lg hover:bg-white/60 transition-all opacity-0 group-hover:opacity-100"
              title="Nova citação"
            >
              <RefreshCw size={14} style={{ color: theme.primary }} />
            </motion.button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-stretch gap-3 mb-8"
          >
            <Button 
              onClick={() => setShowBack(!showBack)} 
              className="gap-2 px-8 py-3 rounded-lg shadow-sm font-medium text-sm text-white hover:shadow-md transition-all flex-1" 
              style={{ 
                backgroundColor: theme.primary,
                opacity: 0.92
              }}
            >
              {showBack ? "← Voltar ao Calendário" : "Meus Livros Lidos →"}
            </Button>
            <Link href="/retrospectiva" className="flex-1">
              <Button 
                variant="outline" 
                className="gap-2 px-8 py-3 rounded-lg shadow-sm font-medium text-sm w-full border transition-all" 
                style={{ 
                  borderColor: theme.primary, 
                  color: theme.primary,
                  backgroundColor: `${theme.primary}08`
                }}
              >
                <BarChart3 size={16} /> Retrospectiva do Ano
              </Button>
            </Link>
          </motion.div>

          <div className="relative touch-pan-y overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${currentYear}-${currentMonth}-${showBack}`}
                custom={direction}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(e, info) => {
                  const swipeThreshold = 40;
                  if (info.offset.x > swipeThreshold) {
                    handlePrevMonth();
                  } else if (info.offset.x < -swipeThreshold) {
                    handleNextMonth();
                  }
                }}
                
                initial={{ opacity: 0, x: direction > 0 ? 60 : -60, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: direction > 0 ? -60 : 60, scale: 0.95 }}
                transition={{ 
                  duration: 0.35, 
                  ease: [0.4, 0, 0.2, 1]
                }}
                className="cursor-grab active:cursor-grabbing"
              >
                {!showBack ? (
                    <MonthCalendar month={months[currentMonth].name} days={months[currentMonth].days} year={currentYear} userEmail={session.user?.email?.toLowerCase() || ""} monthIndex={currentMonth} />
                ) : (
                    <MonthReview month={months[currentMonth].name} userEmail={session.user?.email?.toLowerCase() || ""} monthIndex={currentMonth} year={currentYear} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <UserProfileEdit
        open={profileEditOpen}
        onCloseAction={() => setProfileEditOpen(false)}
        user={session.user || {}}
        onUpdateAction={() => {
          // Recarregar dados se necessário
          window.location.reload()
        }}
      />
    </div>
  )
}