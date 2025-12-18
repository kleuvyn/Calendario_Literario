"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { MonthCalendar } from "@/components/month-calendar"
import { MonthReview } from "@/components/month-review"
import { LoginScreen } from "@/components/login-screen"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, BookOpen, LogOut } from "lucide-react"
import { saveCurrentUser, getCurrentUser, clearCurrentUser, type UserData } from "@/lib/storage"

const getMonthsForYear = (year: number) => {
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  return [
    { name: "Janeiro", days: 31, number: 1 },
    { name: "Fevereiro", days: isLeapYear ? 29 : 28, number: 2 },
    { name: "Março", days: 31, number: 3 },
    { name: "Abril", days: 30, number: 4 },
    { name: "Maio", days: 31, number: 5 },
    { name: "Junho", days: 30, number: 6 },
    { name: "Julho", days: 31, number: 7 },
    { name: "Agosto", days: 31, number: 8 },
    { name: "Setembro", days: 30, number: 9 },
    { name: "Outubro", days: 31, number: 10 },
    { name: "Novembro", days: 30, number: 11 },
    { name: "Dezembro", days: 31, number: 12 },
  ]
}

export default function Home() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [showBack, setShowBack] = useState(false)

  const months = getMonthsForYear(currentYear)

  useEffect(() => {
    const localUser = getCurrentUser()
    
    if (session?.user) {
      const userData: UserData = {
        name: session.user.name || "Usuário",
        email: session.user.email || "",
        provider: "google"
      }
      setUser(userData)
      saveCurrentUser(userData)
    } else if (localUser) {
      setUser(localUser)
    }

    if (status !== "loading") {
      setIsLoading(false)
    }
  }, [session, status])

  const handleLogin = useCallback((userData: UserData) => {
    saveCurrentUser(userData)
    setUser(userData)
  }, [])

  const handleLogout = useCallback(() => {
    clearCurrentUser()
    setUser(null)
    if (session) {
      signOut({ callbackUrl: "/" })
    }
  }, [session])

  const handlePrevMonth = useCallback(() => {
    setShowBack(false)
    setCurrentMonth((prevMonth) => {
      if (prevMonth > 0) return prevMonth - 1
      setCurrentYear((prevYear) => prevYear - 1)
      return 11
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setShowBack(false)
    setCurrentMonth((prevMonth) => {
      if (prevMonth < 11) return prevMonth + 1
      setCurrentYear((prevYear) => prevYear + 1)
      return 0
    })
  }, [])

  const handleFlip = useCallback(() => {
    setShowBack((prevShowBack) => !prevShowBack)
  }, [])

  if (isLoading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <BookOpen className="h-8 w-8 animate-pulse text-primary" />
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Literário {currentYear}</h1>
              <p className="text-sm text-muted-foreground">Olá, {user.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleLogout} className="h-9 w-9 bg-transparent" title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-9 w-9 bg-transparent" title="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9 bg-transparent" title="Próximo mês">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex justify-center mb-8">
          <Button onClick={handleFlip} variant="secondary" className="gap-2 px-6">
            {showBack ? "← Ver Calendário" : "Ver Livros Lidos →"}
          </Button>
        </div>

        <div className="perspective-1000 relative">
          <div
            className={`transition-transform duration-700 ${showBack ? "rotate-y-180" : ""}`}
            style={{ 
              transformStyle: "preserve-3d",
              transform: showBack ? "rotateY(180deg)" : "rotateY(0deg)" 
            }}
          >
            <div
              className={`${showBack ? "pointer-events-none opacity-0" : "opacity-100"}`}
              style={{ backfaceVisibility: "hidden" }}
            >
              <MonthCalendar
                month={months[currentMonth].name}
                days={months[currentMonth].days}
                year={currentYear}
                userEmail={user.email}
                monthIndex={currentMonth}
              />
            </div>
            <div
              className={`absolute inset-0 ${!showBack ? "pointer-events-none opacity-0" : "opacity-100"}`}
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <MonthReview month={months[currentMonth].name} userEmail={user.email} monthIndex={currentMonth} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}