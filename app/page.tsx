"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useSession, signOut, signIn } from "next-auth/react"
import { MonthCalendar } from "@/components/month-calendar"
import { MonthReview } from "@/components/month-review"
import { LoginScreen } from "@/components/login-screen"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, LogOut, Loader2, BarChart3, Quote, Target, Settings2, BookOpen, Trash2 } from "lucide-react"
import { getReadingData, updateUserGoal, deleteFullAccount } from "@/lib/api-client" 
import Link from "next/link"

const THEMES = {
  rose: { primary: '#f4a6f0', bg: '#fff5f6', text: '#a64d9c' },
  dark: { primary: '#38bdf8', bg: '#f0f7ff', text: '#1e293b' },
  soft: { primary: '#a855f7', bg: '#faf5ff', text: '#5b1c87' },
  coffee: { primary: '#7c3f17', bg: '#fafaf9', text: '#4b3832' }
}

const LITERARY_QUOTES = [
  "Um livro é um sonho que você segura na mão.",
  "Ler é sonhar pela mão de outrem.",
  "Livros são espelhos: você só vê neles o que já tem dentro de si.",
  "A leitura é, para o espírito, o que o exercício é para o corpo.",
  "Não existem livros demais, apenas estantes pequenas demais.",
  "Cada livro lido é uma vida que se soma a sua.",
  "Ler é atravessar mundos sem sair do lugar.",
  "Os livros nos ensinam a escutar o silêncio.",
  "Quem lê nunca está sozinho.",
  "Há livros que nos encontram quando mais precisamos.",
  "A leitura transforma o tempo em abrigo.",
  "Ler é um ato íntimo e profundamente livre.",
  "Alguns livros não se leem: acontecem.",
  "A literatura é a prova de que a alma fala.",
  "Entre um capítulo e outro, a gente se descobre.",
  "Os livros guardam aquilo que a memória insiste em esquecer.",
  "Ler é aprender a ver o mundo com outros olhos.",
  "Há histórias que moram em nós para sempre.",
  "Um bom livro muda o leitor, não o mundo.",
  "Ler é um gesto de cuidado consigo."
];

const formatName = (name: string | null | undefined) => {
  if (!name) return "Leitor";
  const first = name.split(' ')[0].toLowerCase();
  return first.charAt(0).toUpperCase() + first.slice(1);
};

export default function Home() {
  const { data: session, status } = useSession()
  const [currentYear, setCurrentYear] = useState(2025)
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth())
  const [showBack, setShowBack] = useState(false)
  const [quote, setQuote] = useState("")
  const [activeTheme, setActiveTheme] = useState<keyof typeof THEMES>('rose')
  const [myBooksGoal, setMyBooksGoal] = useState(12)
  const [totalReadThisYear, setTotalReadThisYear] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("app-theme") as keyof typeof THEMES
    if (saved && THEMES[saved]) setActiveTheme(saved)
    setQuote(LITERARY_QUOTES[Math.floor(Math.random() * LITERARY_QUOTES.length)])
    
    async function fetchData() {
      if (session?.user?.email) {
        try {
          const response: any = await getReadingData(session.user.email.toLowerCase(), currentYear)
          const books = response?.data || (Array.isArray(response) ? response : [])
          if (response?.userGoal) setMyBooksGoal(response.userGoal)
          const finished = books.filter((b: any) => b && (b.status === 'lido' || b.end_date)).length
          setTotalReadThisYear(finished)
        } catch (e) { console.error(e) }
      }
    }
    fetchData()
  }, [session, currentYear])

  const handleSetGoal = async () => {
    const newGoal = prompt("Qual sua meta de livros para este ano?", myBooksGoal.toString())
    if (newGoal && !isNaN(Number(newGoal)) && session?.user?.email) {
      const goalNum = Number(newGoal)
      setIsSaving(true)
      try {
        await updateUserGoal(session.user.email.toLowerCase(), goalNum)
        setMyBooksGoal(goalNum)
      } catch (error) { alert("Erro ao salvar meta") } finally { setIsSaving(false) }
    }
  }

  const handleDeleteData = async () => {
    const confirmFirst = confirm("Tem certeza que deseja apagar todos os seus registros? Esta ação é irreversível.");
    if (confirmFirst) {
      const confirmSecond = confirm("ÚLTIMO AVISO: Sua conta e todos os seus livros serão deletados permanentemente. Confirmar?");
      if (confirmSecond) {
        setIsSaving(true);
        try {
          await deleteFullAccount();
          alert("Sua conta foi removida com sucesso.");
          await signOut({ callbackUrl: "/" });
        } catch (error: any) {
          alert(`Erro técnico: ${error.message || "Não foi possível apagar os dados."}`);
        } finally { setIsSaving(false); }
      }
    }
  }

  const changeTheme = (t: keyof typeof THEMES) => {
    setActiveTheme(t)
    localStorage.setItem("app-theme", t)
  }

  const theme = THEMES[activeTheme]

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentYear(prev => prev - 1); setCurrentMonth(11) }
    else { setCurrentMonth(prev => prev - 1) }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentYear(prev => prev + 1); setCurrentMonth(0) }
    else { setCurrentMonth(prev => prev + 1) }
  }

  const progressPercent = Math.min(Math.round((totalReadThisYear / myBooksGoal) * 100), 100)

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

  if (status === "loading") return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
  if (!session) return <LoginScreen onLogin={async () => signIn("google")} />

  return (
    <div className="flex flex-col min-h-screen transition-colors duration-500" style={{ backgroundColor: theme.bg }}>
      <main className="grow p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center gap-3 px-2 italic text-slate-500">
            <Quote size={14} style={{ color: theme.primary, opacity: 0.4 }} />
            <p className="text-xs font-medium tracking-tight" style={{ color: theme.text, opacity: 0.7 }}>{quote}</p>
          </div>

          <div className="mb-8 flex flex-col lg:flex-row items-center justify-between bg-white p-4 rounded-2xl border shadow-sm gap-4">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="h-12 w-12 rounded-full border-2 overflow-hidden shadow-sm shrink-0" style={{ borderColor: theme.primary }}>
                {session.user?.image && <img src={session.user.image} alt="Perfil" className="h-full w-full object-cover" />}
              </div>
              <div className="flex flex-col">
                <h1 className="font-serif text-xl font-bold leading-none" style={{ color: theme.text }}>Calendário {currentYear}</h1>
                <p className="text-xs mt-1 font-medium" style={{ color: theme.text, opacity: 0.6 }}>
                  Boas leituras, <span style={{ color: theme.primary }}>{formatName(session.user?.name)}</span>!
                </p>
                <button onClick={handleDeleteData} disabled={isSaving} className="text-[10px] text-red-400 font-bold uppercase mt-1 md:hidden text-left">
                   {isSaving ? "Apagando..." : "Excluir Conta"}
                </button>
              </div>
            </div>

            <div className="flex bg-slate-50 p-1.5 rounded-full border border-slate-100 gap-1">
              {Object.keys(THEMES).map((t) => (
                <button key={t} onClick={() => changeTheme(t as any)} className={`p-2 transition-all rounded-full ${activeTheme === t ? 'bg-white shadow-sm scale-110' : 'opacity-20 hover:opacity-100'}`}>
                  <BookOpen size={18} color={THEMES[t as keyof typeof THEMES].primary} fill={activeTheme === t ? THEMES[t as keyof typeof THEMES].primary : "transparent"} />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between w-full lg:w-auto gap-2">
              <div className="hidden md:flex flex-col items-end mr-2 text-right">
                 <span className="text-[10px] uppercase font-bold tracking-tighter opacity-40" style={{ color: theme.text }}>Conta Ativa</span>
                 <button onClick={handleDeleteData} disabled={isSaving} className="text-[9px] uppercase font-bold text-red-400 hover:underline">
                    {isSaving ? "Apagando..." : "Apagar meus dados"}
                 </button>
              </div>
              
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="icon" onClick={() => signOut({ callbackUrl: "/" })} className="h-9 w-9 text-destructive"><LogOut size={16} /></Button>
                <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-9 w-9"><ChevronLeft size={16} /></Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9"><ChevronRight size={16} /></Button>
              </div>
            </div>
          </div>

          <div className="mb-8 bg-white rounded-2xl p-5 border shadow-sm group">
            <div className="flex justify-between items-end mb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Target size={16} style={{ color: theme.primary }} />
                  <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: theme.text }}>Sua Meta Literária</span>
                  <button onClick={handleSetGoal} disabled={isSaving} className="md:opacity-0 group-hover:opacity-100 transition-opacity">
                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Settings2 size={12} className="text-slate-400" />}
                  </button>
                </div>
                <p className="text-[10px] font-bold uppercase" style={{ color: theme.text, opacity: 0.4 }}>
                  Você leu <span style={{ color: theme.primary }}>{totalReadThisYear}</span> de {myBooksGoal} livros
                </p>
              </div>
              <span className="text-2xl font-black" style={{ color: theme.primary }}>{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border">
               <div className="h-full transition-all duration-1000 ease-in-out" style={{ width: `${progressPercent}%`, backgroundColor: theme.primary }}></div>
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
             {!showBack ? (
                <MonthCalendar month={months[currentMonth].name} days={months[currentMonth].days} year={currentYear} userEmail={session.user?.email?.toLowerCase() || ""} monthIndex={currentMonth} />
             ) : (
                <MonthReview month={months[currentMonth].name} userEmail={session.user?.email?.toLowerCase() || ""} monthIndex={currentMonth} year={currentYear} />
             )}
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-slate-100 bg-white p-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">@-Kleuvyn</span>
          <span className="text-[9px] text-slate-400 font-medium">Minha Estante Literária • {currentYear}</span>
        </div>
      </footer>
    </div>
  )
}