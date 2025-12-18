"use client"

import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import { MonthCalendar } from "@/components/month-calendar"
import { MonthReview } from "@/components/month-review"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, BookOpen, LogOut } from "lucide-react"

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


export function CalendarContent() {
  const { data: session } = useSession() 
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(0)
  const [showBack, setShowBack] = useState(false)

  const months = getMonthsForYear(currentYear)
  
  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }
  if (!session || !session.user) {
    return null;
  }
  
  const user = session.user
  
  const handlePrevMonth = () => {
    setShowBack(false)
    if (currentMonth > 0) {
      setCurrentMonth(currentMonth - 1)
    } else {
      setCurrentYear(currentYear - 1)
      setCurrentMonth(11)
    }
  }

  const handleNextMonth = () => {
    setShowBack(false)
    if (currentMonth < 11) {
      setCurrentMonth(currentMonth + 1)
    } else {
      setCurrentYear(currentYear + 1)
      setCurrentMonth(0)
    }
  }

  const handleFlip = () => {
    setShowBack(!showBack)
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
            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout} 
              className="h-9 w-9 bg-transparent"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-9 w-9 bg-transparent">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9 bg-transparent">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="perspective-1000">
          <div
            className={`transition-transform duration-700 ${showBack ? "transform-[rotateY(180deg)]" : ""}`}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className={`${showBack ? "pointer-events-none opacity-0" : ""}`}
              style={{ backfaceVisibility: "hidden" }}
            >
              <MonthCalendar
                month={months[currentMonth].name}
                days={months[currentMonth].days}
                year={currentYear}
                userEmail={user.email || 'default@email.com'} 
                monthIndex={currentMonth}
              />
            </div>
            <div
              className={`absolute inset-0 ${!showBack ? "pointer-events-none opacity-0" : ""}`}
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <MonthReview month={months[currentMonth].name} userEmail={user.email || 'default@email.com'} monthIndex={currentMonth} />
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <Button onClick={handleFlip} variant="secondary" className="gap-2 px-6">
            {showBack ? "← Ver Calendário" : "Ver Livros Lidos →"}
          </Button>
        </div>
      </div>
    </main>
  )
}