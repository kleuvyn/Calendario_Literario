"use client"

import { useState, useMemo, useEffect } from "react"
import { useSession, signOut, signIn } from "next-auth/react"
import { MonthCalendar } from "@/components/month-calendar"
import { MonthReview } from "@/components/month-review"
import { LoginScreen } from "@/components/login-screen"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, LogOut, Loader2, BarChart3, Quote, Target, Settings2, BookOpen, Trash2 } from "lucide-react"
import { getReadingData, updateUserGoal, deleteFullAccount } from "@/lib/api-client" 
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

const THEMES = {
  rose: { primary: '#f4a6f0', bg: '#fff5f6', text: '#a64d9c', card: '#ffffff' },
  dark: { primary: '#38bdf8', bg: '#f0f7ff', text: '#1e293b', card: '#ffffff' },
  soft: { primary: '#a855f7', bg: '#faf5ff', text: '#5b1c87', card: '#ffffff' },
  coffee: { primary: '#7c3f17', bg: '#fafaf9', text: '#4b3832', card: '#ffffff' },
  ocean: { primary: '#0ea5e9', bg: '#f0f9ff', text: '#0369a1', card: '#ffffff' },
  forest: { primary: '#10b981', bg: '#f0fdf4', text: '#065f46', card: '#ffffff' },
  sunset: { primary: '#f59e0b', bg: '#fffbeb', text: '#92400e', card: '#ffffff' },
  midnight: { primary: '#818cf8', bg: '#0f172a', text: '#f8fafc', card: '#1e293b' }
}

const LITERARY_QUOTES = [
  "Um livro é um sonho que você segura na mão.",
  "Ler é sonhar pela mão de outrem.",
  "Livros são espelhos: você só vê neles o que já tem dentro de si.",
  "A leitura é, para o espírito, o que o exercício é para o corpo."
];

export default function Home() {
  const { data: session, status } = useSession()
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth())
  const [showBack, setShowBack] = useState(false)
  const [quote, setQuote] = useState("")
  const [activeTheme, setActiveTheme] = useState<keyof typeof THEMES>('rose')
  const [goalsByYear, setGoalsByYear] = useState<Record<number, number>>({})
  const [totalReadThisYear, setTotalReadThisYear] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [direction, setDirection] = useState(0)

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
        } catch (e) { console.error(e) }
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
      } catch (error) { alert("Erro ao salvar meta") } finally { setIsSaving(false) }
    }
  }

  const handleDeleteData = async () => {
    const confirmFirst = confirm("Tem certeza que deseja apagar todos os seus registros? Esta ação é irreversível.");
    if (confirmFirst) {
      const confirmSecond = confirm("ÚLTIMO AVISO: Sua conta e livros serão deletados permanentemente. Confirmar?");
      if (confirmSecond) {
        setIsSaving(true);
        try {
          await deleteFullAccount();
          alert("Conta removida.");
          await signOut({ callbackUrl: "/" });
        } catch (error: any) {
          alert(`Erro: ${error.message}`);
        } finally { setIsSaving(false); }
      }
    }
  }

  const theme = THEMES[activeTheme]
  const handlePrevMonth = () => { setDirection(-1); if (currentMonth === 0) { setCurrentYear(p => p - 1); setCurrentMonth(11); } else { setCurrentMonth(p => p - 1); } }
  const handleNextMonth = () => { setDirection(1); if (currentMonth === 11) { setCurrentYear(p => p + 1); setCurrentMonth(0); } else { setCurrentMonth(p => p + 1); } }
  const progressPercent = Math.min(Math.round((totalReadThisYear / myBooksGoal) * 100), 100) || 0

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
    <div className="flex flex-col min-h-screen transition-colors duration-500" style={{ backgroundColor: theme.bg }}>
      <main className="grow p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          
          <div className="mb-6 flex items-center gap-3 px-2 italic text-slate-500">
            <Quote size={14} style={{ color: theme.primary, opacity: 0.4 }} />
            <p className="text-xs font-medium" style={{ color: theme.text, opacity: 0.7 }}>{quote}</p>
          </div>

          <div className="mb-8 flex flex-col lg:flex-row items-center justify-between bg-white p-4 rounded-2xl border shadow-sm gap-4">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="h-12 w-12 rounded-full border-2 overflow-hidden" style={{ borderColor: theme.primary }}>
                {session.user?.image && <img src={session.user.image} alt="Perfil" className="h-full w-full object-cover" />}
              </div>
              <div className="flex flex-col">
                <h1 className="font-serif text-xl font-bold leading-none" style={{ color: theme.text }}>Calendário {currentYear}</h1>
                <p className="text-xs mt-1" style={{ color: theme.text, opacity: 0.6 }}>Olá, {session.user?.name}</p>
              </div>
            </div>

            <div className="flex bg-slate-50 p-1.5 rounded-full border border-slate-100 gap-1">
              {Object.keys(THEMES).map((t) => (
                <button key={t} onClick={() => { setActiveTheme(t as any); localStorage.setItem("app-theme", t); }} className={`p-2 rounded-full ${activeTheme === t ? 'bg-white shadow-sm' : 'opacity-20'}`}>
                  <BookOpen size={18} color={THEMES[t as keyof typeof THEMES].primary} />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleDeleteData} disabled={isSaving} className="h-9 w-9 text-red-500 hover:bg-red-50">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </Button>
                
                <Button variant="outline" size="icon" onClick={() => signOut({ callbackUrl: "/" })} className="h-9 w-9 text-slate-500"><LogOut size={16} /></Button>
                <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-9 w-9"><ChevronLeft size={16} /></Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9"><ChevronRight size={16} /></Button>
            </div>
          </div>

          <div className="mb-8 bg-white rounded-2xl p-5 border shadow-sm group">
            <div className="flex justify-between items-end mb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Target size={16} style={{ color: theme.primary }} />
                  <span className="text-[11px] font-black uppercase" style={{ color: theme.text }}>Meta de {currentYear}</span>
                  <button onClick={handleSetGoal} disabled={isSaving}>
                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Settings2 size={12} className="text-slate-400" />}
                  </button>
                </div>
                <p className="text-[10px] font-bold uppercase" style={{ color: theme.text, opacity: 0.4 }}>
                   Lidos <span style={{ color: theme.primary }}>{totalReadThisYear}</span> de {myBooksGoal}
                </p>
              </div>
              <span className="text-2xl font-black" style={{ color: theme.primary }}>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
               <div className="h-full transition-all duration-1000" style={{ width: `${progressPercent}%`, backgroundColor: theme.primary }}></div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center mb-8 gap-3">
            <Button onClick={() => setShowBack(!showBack)} className="gap-2 px-8 rounded-full shadow-md font-bold h-11 w-full sm:w-auto text-white" style={{ backgroundColor: theme.primary }}>
              {showBack ? "← Calendário" : "Livros Lidos →"}
            </Button>
            <Link href="/retrospectiva" className="w-full sm:w-auto">
              <Button variant="outline" className="gap-2 px-8 rounded-full shadow-sm h-11 font-bold w-full sm:w-auto border-2" style={{ borderColor: `${theme.primary}20`, color: theme.primary }}>
                <BarChart3 size={18} /> Retrospectiva
              </Button>
            </Link>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${currentYear}-${currentMonth}-${showBack}`}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                transition={{ duration: 0.2 }}
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
    </div>
  )
}