"use client"

import { useState, useMemo, useEffect } from "react"
import { useSession, signOut, signIn } from "next-auth/react"
import { MonthCalendar } from "@/components/month-calendar"
import { MonthReview } from "@/components/month-review"
import { LoginScreen } from "@/components/login-screen"
import { UserProfileEdit } from "@/components/user-profile-edit"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, LogOut, Loader2, BarChart3, Quote, Target, BookOpen, CheckCircle2, XCircle, Sun, Moon, Sparkles, Edit3, RefreshCw, TrendingUp, TrendingDown, Flame, Bookmark } from "lucide-react"
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

  const capitalize = (value: string) => {
    if (!value) return ''
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
  }

  const getFirstName = () => {
    if (!session?.user?.name) return 'Usuário'
    const first = session.user.name.split(' ')[0]
    return capitalize(first)
  }

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

  if (status === "loading") return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-20 h-20">
          {/* Animated background circles */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-75 blur-lg animate-pulse"></div>
          <div className="absolute inset-2 rounded-full bg-white dark:bg-slate-900"></div>
          
          {/* Rotating icon container */}
          <div className="absolute inset-0 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
            <BookOpen size={32} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          
          {/* Pulsing dots */}
          <div className="absolute inset-4 rounded-full border-2 border-transparent border-t-indigo-500 border-r-indigo-500 animate-spin" style={{ animationDuration: '2s' }}></div>
        </div>
        <div className="text-center">
          <p className="text-slate-900 dark:text-slate-100 font-semibold">Carregando sua biblioteca...</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Preparando seus livros e metas</p>
        </div>
      </div>
    </div>
  )
  if (!session) return <LoginScreen onLogin={async () => signIn("google")} />

  return (
    <div className="flex flex-col min-h-screen transition-all duration-700 bg-gradient-to-br" style={{ 
      backgroundImage: `linear-gradient(135deg, ${theme.bg} 0%, ${theme.bg}99 50%, ${theme.bg}cc 100%)`
    }}>
      {/* Decorative background elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-200/10 to-purple-200/10 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-pink-200/10 to-blue-200/10 dark:from-pink-900/10 dark:to-blue-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      <main className="grow p-3 md:p-6 lg:p-10">
        <div className="mx-auto max-w-7xl">

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 flex flex-col lg:flex-row items-center justify-between backdrop-blur-md p-6 rounded-2xl shadow-lg gap-6 border transition-all duration-300"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(26, 31, 53, 0.6) 0%, rgba(26, 31, 53, 0.4) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.3) 100%)',
              borderColor: isDark ? 'rgba(45, 58, 82, 0.6)' : 'rgba(255, 255, 255, 0.7)',
              boxShadow: isDark 
                ? '0 8px 32px -8px rgba(99, 102, 241, 0.1)'
                : '0 8px 32px -8px rgba(99, 102, 241, 0.2)'
            }}
          >
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <div className="h-14 w-14 rounded-xl border-2 border-white/30 dark:border-slate-600/50 overflow-hidden shadow-md flex items-center justify-center flex-shrink-0" style={{ 
                  backgroundColor: session.user?.image ? 'transparent' : theme.primary,
                  backgroundImage: session.user?.image ? `url('${session.user.image}')` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}>
                  {!session.user?.image && (
                    <span className="text-white text-lg font-bold">{session.user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
              </motion.div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold tracking-tight truncate" style={{ color: theme.text }}>
                    {greeting}, {getFirstName()}
                  </h1>
                  <motion.button 
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setProfileEditOpen(true)}
                    className="p-2 hover:bg-white/30 dark:hover:bg-slate-700/70 rounded-lg transition-all"
                    title="Editar perfil"
                  >
                    <Edit3 size={16} style={{ color: theme.primary }} strokeWidth={2} />
                  </motion.button>
                </div>
                <p className="text-sm font-light" style={{ color: theme.text, opacity: 0.6 }}>
                  Calendário — {currentYear}
                </p>
              </div>
            </div>

            <div className="flex backdrop-blur-sm p-2 rounded-xl border gap-2 shadow-md transition-all duration-300 flex-wrap justify-center" style={{
              backgroundColor: isDark ? 'rgba(26, 31, 53, 0.4)' : 'rgba(255, 255, 255, 0.3)',
              borderColor: isDark ? 'rgba(45, 58, 82, 0.5)' : 'rgba(255, 255, 255, 0.5)'
            }}>
              {Object.entries(THEMES).map(([key, value]) => {
                const ThemeIcon = value.icon
                return (
                  <motion.button 
                    key={key} 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => { 
                      setActiveTheme(key as keyof typeof THEMES); 
                      localStorage.setItem("app-theme", key);
                      toast.success(`Tema ${value.name} ativado`, {
                        icon: <ThemeIcon size={14} />
                      })
                    }} 
                    className={`
                      p-3 rounded-lg transition-all duration-200 flex flex-col items-center gap-1.5
                      ${activeTheme === key 
                        ? isDark 
                          ? 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg border border-slate-500' 
                          : 'bg-white shadow-md border border-primary/30'
                        : 'opacity-50 hover:opacity-80'
                      }
                    `}
                    style={{ 
                      boxShadow: activeTheme === key && isDark ? `0 0 20px ${value.primary}50` : 'none'
                    }}
                  > 
                    <ThemeIcon 
                      size={16} 
                      style={{ color: activeTheme === key ? value.primary : '#94a3b8' }}
                      strokeWidth={1.5}
                    />
                    <span 
                      className="text-[9px] font-bold tracking-tight leading-none"
                      style={{ color: activeTheme === key ? value.primary : '#94a3b8' }}
                    >
                      {value.name}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
                <motion.button 
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => signOut({ callbackUrl: "/" })} 
                  className="h-11 w-11 rounded-xl shadow-md hover:shadow-lg border-2 transition-all flex items-center justify-center"
                  style={{
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    color: '#ef4444'
                  }}
                  title="Sair"
                >
                  <LogOut size={18} strokeWidth={2} />
                </motion.button>
                
                <div className="flex gap-1.5">
                  <motion.button 
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrevMonth} 
                    className="h-11 w-11 rounded-xl shadow-md hover:shadow-lg border-2 transition-all flex items-center justify-center"
                    style={{
                      borderColor: theme.primary + '30',
                      backgroundColor: theme.primary + '08',
                      color: theme.primary
                    }}
                  >
                    <ChevronLeft size={18} strokeWidth={2} />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNextMonth} 
                    className="h-11 w-11 rounded-xl shadow-md hover:shadow-lg border-2 transition-all flex items-center justify-center"
                    style={{
                      borderColor: theme.primary + '30',
                      backgroundColor: theme.primary + '08',
                      color: theme.primary
                    }}
                  >
                    <ChevronRight size={18} strokeWidth={2} />
                  </motion.button>
                </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 backdrop-blur-md rounded-3xl p-10 border shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-3xl"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(26, 31, 53, 0.7) 0%, rgba(26, 31, 53, 0.5) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.4) 100%)',
              borderColor: isDark ? 'rgba(45, 58, 82, 0.6)' : 'rgba(255, 255, 255, 0.7)'
            }}
          >
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: theme.primary }}></div>
            <div className="absolute top-20 left-0 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ backgroundColor: theme.primary }}></div>
            
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Circular Progress */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="flex justify-center"
              >
                <div className="relative w-48 h-48 md:col-span-1">
                  <svg className="w-full h-full -rotate-90 drop-shadow-lg">
                    <defs>
                      <linearGradient id={`progressGradient-${currentYear}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: theme.primary, stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: theme.primary, stopOpacity: 0.1 }} />
                      </linearGradient>
                    </defs>
                    <circle 
                      cx="96" cy="96" r="85" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="14" 
                      className="text-white/30 dark:text-slate-700"
                    />
                    <motion.circle 
                      cx="96" cy="96" r="85" 
                      fill="none" 
                      stroke={theme.primary}
                      strokeWidth="14" 
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 85}`}
                      initial={{ strokeDashoffset: `${2 * Math.PI * 85}` }}
                      animate={{ strokeDashoffset: `${2 * Math.PI * 85 * (1 - progressPercent / 100)}` }}
                      transition={{ duration: 2, ease: 'easeInOut' }}
                      filter={`drop-shadow(0 0 12px ${theme.primary}80)`}
                    />
                  </svg>
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="absolute inset-0 flex flex-col items-center justify-center"
                  >
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-5xl font-bold text-center"
                      style={{ color: theme.primary }}
                    >
                      {progressPercent}%
                    </motion.span>
                    <span className="text-xs font-light mt-2 text-slate-500 dark:text-slate-400">completo</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Stats Section */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="md:col-span-2 space-y-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-5xl font-bold" style={{ color: theme.primary }}>
                        {totalReadThisYear}
                      </h3>
                      <span className="text-2xl font-light" style={{ color: theme.text, opacity: 0.6 }}>
                        de {myBooksGoal}
                      </span>
                    </div>
                    <p className="text-sm font-light mt-2" style={{ color: theme.text, opacity: 0.7 }}>
                      livros lidos em {currentYear} 📚
                    </p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSetGoal} 
                    disabled={isSaving}
                    className="p-3 hover:bg-white/30 dark:hover:bg-slate-700/70 rounded-xl transition-all shadow-md border border-white/30 dark:border-slate-600/50"
                  >
                    {isSaving ? (
                      <Loader2 size={20} className="animate-spin text-slate-400" />
                    ) : (
                      <Target size={20} style={{ color: theme.primary }} />
                    )}
                  </motion.button>
                </div>

                {/* Status badges */}
                <div className="flex items-center gap-3 flex-wrap">
                  {isAhead && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-bold border border-green-500/40"
                    >
                      <TrendingUp size={16} />
                      <span>🎉 Acima da meta!</span>
                    </motion.div>
                  )}
                  {isOnTrack && !isAhead && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-bold border border-blue-500/40"
                    >
                      <Flame size={16} />
                      <span>🔥 No ritmo!</span>
                    </motion.div>
                  )}
                  {isBehind && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full text-sm font-bold border border-amber-500/40"
                    >
                      <TrendingDown size={16} />
                      <span>Faltam {booksRemaining} livro{booksRemaining !== 1 ? 's' : ''}</span>
                    </motion.div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium" style={{ color: theme.text, opacity: 0.6 }}>
                    <span>Progresso anual</span>
                    <span className="font-bold">{totalReadThisYear}/{myBooksGoal}</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden shadow-inner backdrop-blur-sm" style={{ backgroundColor: isDark ? 'rgba(45, 58, 82, 0.4)' : 'rgba(255, 255, 255, 0.5)' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="h-full rounded-full shadow-lg"
                      style={{ 
                        background: `linear-gradient(90deg, ${theme.primary}, ${theme.primary}dd)`,
                        boxShadow: `0 0 20px ${theme.primary}80`
                      }}
                    ></motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8 relative group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
            
            <div 
              className="relative backdrop-blur-md rounded-2xl p-8 border shadow-lg transition-all duration-300 hover:shadow-xl group-hover:scale-105"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, rgba(26, 31, 53, 0.6) 0%, rgba(26, 31, 53, 0.4) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.3) 100%)',
                borderColor: isDark ? 'rgba(45, 58, 82, 0.5)' : 'rgba(255, 255, 255, 0.6)'
              }}
            >
              <div className="flex items-start gap-4">
                <Quote size={28} style={{ color: theme.primary, opacity: 0.3, flexShrink: 0, marginTop: 4 }} strokeWidth={1.5} />
                <div className="flex-1">
                  <p className="text-lg font-light leading-relaxed italic" style={{ color: theme.text, opacity: 0.85 }}>
                    "{quote}"
                  </p>
                  <div className="mt-4 flex justify-end">
                    <motion.button
                      whileHover={{ rotate: 180, scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      onClick={refreshQuote}
                      className="p-3 rounded-xl hover:bg-white/20 dark:hover:bg-slate-700/50 transition-all backdrop-blur-sm border border-white/20 dark:border-slate-600/40"
                      title="Nova citação"
                    >
                      <RefreshCw size={18} style={{ color: theme.primary }} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-stretch gap-4 mb-10"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowBack(!showBack)} 
              className="flex-1 gap-3 px-8 py-4 rounded-2xl shadow-lg font-semibold text-base text-white hover:shadow-xl transition-all relative group overflow-hidden"
              style={{ 
                backgroundColor: theme.primary,
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary}dd 100%)`
              }}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-center gap-2">
                {showBack ? "← Voltar ao Calendário" : "Meus Livros Lidos →"}
              </div>
            </motion.button>

            <Link href="/retrospectiva" className="flex-1">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full gap-3 px-8 py-4 rounded-2xl shadow-lg font-semibold text-base transition-all border-2 flex items-center justify-center"
                style={{ 
                  borderColor: theme.primary, 
                  color: theme.primary,
                  backgroundColor: `${theme.primary}10`,
                  background: `linear-gradient(135deg, ${theme.primary}15 0%, ${theme.primary}08 100%)`
                }}
              >
                <BarChart3 size={20} /> Retrospectiva do Ano
              </motion.button>
            </Link>

            <Link href="/planejados" className="flex-1">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full gap-3 px-8 py-4 rounded-2xl shadow-lg font-semibold text-base transition-all border-2 flex items-center justify-center"
                style={{ 
                  borderColor: theme.primary, 
                  color: theme.primary,
                  backgroundColor: `${theme.primary}10`,
                  background: `linear-gradient(135deg, ${theme.primary}15 0%, ${theme.primary}08 100%)`
                }}
              >
                <Bookmark size={20} /> Planejados e Desejos
              </motion.button>
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
          // Fechar o modal e a sessão já foi atualizada via updateSession()
          setProfileEditOpen(false)
        }}
      />
    </div>
  )
}