"use client"

import { useState, useCallback, useMemo } from "react"
import { useSession, signOut, signIn } from "next-auth/react"
import { MonthCalendar } from "@/components/month-calendar"
import { MonthReview } from "@/components/month-review"
import { LoginScreen } from "@/components/login-screen"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, LogOut, Loader2, User, ShieldAlert, Trash2 } from "lucide-react" 
import { UserData } from "@/lib/storage"

export default function Home() {
  const { data: session, status } = useSession()
  const [currentYear, setCurrentYear] = useState(2025)
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth())
  const [showBack, setShowBack] = useState(false)

 
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "LGPD - DIREITO AO ESQUECIMENTO:\n\nEsta ação apagará permanentemente todos os seus livros, reviews e dados de conta. Deseja continuar?"
    )

    if (confirmed) {
      try {
        const res = await fetch("/api/user/delete-account", { method: "DELETE" })
        if (res.ok) {
          alert("Todos os seus dados foram removidos dos nossos servidores.")
          signOut({ callbackUrl: "/" })
        } else {
          alert("Erro ao processar a exclusão.")
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const months = useMemo(() => {
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0
    return [
      { name: "Janeiro", days: 31 },
      { name: "Fevereiro", days: isLeapYear ? 29 : 28 },
      { name: "Março", days: 31 },
      { name: "Abril", days: 30 },
      { name: "Maio", days: 31 },
      { name: "Junho", days: 30 },
      { name: "Julho", days: 31 },
      { name: "Agosto", days: 31 },
      { name: "Setembro", days: 30 },
      { name: "Outubro", days: 31 },
      { name: "Novembro", days: 30 },
      { name: "Dezembro", days: 31 },
    ]
  }, [currentYear])

  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: "/" })
  }, [])

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(prev => prev - 1)
      setCurrentMonth(11)
    } else {
      setCurrentMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(prev => prev + 1)
      setCurrentMonth(0)
    } else {
      setCurrentMonth(prev => prev + 1)
    }
  }

  const handleLogin = async (userData: UserData) => {
    if (userData.password) {
      const result = await signIn("credentials", {
        email: userData.email,
        password: userData.password,
        redirect: false, 
      })
      if (result?.error) {
        alert("E-mail ou senha incorretos!")
      }
    } else {
      await signIn("google")
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-grow p-4 md:p-8">
        <div className="mx-auto max-w-6xl">

          <div className="mb-8 flex items-center justify-between bg-card p-4 rounded-2xl border shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full border-2 border-primary overflow-hidden shadow-sm bg-muted shrink-0">
                {session.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt="Perfil" 
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10">
                    <User className="text-primary h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <h1 className="font-serif text-xl font-bold text-foreground md:text-2xl leading-none">
                  Calendário Literário {currentYear}
                </h1>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Boas leituras, <span className="text-primary">{session.user?.name?.split(' ')[0]}</span>!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex flex-col items-end mr-2">
                 <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Conta Ativa</span>
                 <span className="text-[9px] text-primary truncate max-w-30">{session.user?.email}</span>
              </div>
              <Button variant="outline" size="icon" onClick={handleLogout} className="h-9 w-9 border-destructive/20 text-destructive hover:bg-destructive/5">
                <LogOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-9 w-9">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-6 flex justify-center mb-8">
            <Button 
              onClick={() => setShowBack(!showBack)} 
              variant={showBack ? "outline" : "default"} 
              className="gap-2 px-8 rounded-full shadow-md transition-all active:scale-95"
            >
              {showBack ? "← Voltar ao Calendário" : "Ver Livros Lidos →"}
            </Button>
          </div>

          <div className="relative">
             {!showBack ? (
                <MonthCalendar
                  month={months[currentMonth].name}
                  days={months[currentMonth].days}
                  year={currentYear}
                  userEmail={session.user?.email || ""}
                  monthIndex={currentMonth}
                />
             ) : (
                <MonthReview 
                  month={months[currentMonth].name} 
                  userEmail={session.user?.email || ""} 
                  monthIndex={currentMonth}
                  year={currentYear}
                />
             )}
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-slate-200 bg-slate-50 p-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldAlert size={18} className="text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                Conformidade LGPD
              </span>
              <span className="text-[9px] text-slate-400">
                Direito ao esquecimento: apague todos os seus dados a qualquer momento.
              </span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={handleDeleteAccount}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest h-10 px-6"
          >
            <Trash2 className="mr-2 h-4 w-4" /> 
            Excluir minha conta e dados
          </Button>
        </div>
      </footer>
    </div>
  )
}