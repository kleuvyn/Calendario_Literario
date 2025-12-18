"use client"

import { useSession, signOut } from "next-auth/react"
import { useState, useMemo } from "react"
import { MonthCalendar } from "@/components/month-calendar"
import { MonthReview } from "@/components/month-review"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, BookOpen, LogOut } from "lucide-react"

const getMonthsForYear = (year: number) => {
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
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
}

export function CalendarContent() {
  const { data: session } = useSession()
  const [currentYear, setCurrentYear] = useState(2025)
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth())
  const [showBack, setShowBack] = useState(false)

  const months = useMemo(() => getMonthsForYear(currentYear), [currentYear])

  if (!session?.user) return null

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

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-foreground md:text-4xl">
                Literário {currentYear}
              </h1>
              <p className="text-sm text-muted-foreground">Olá, {session.user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => signOut({ callbackUrl: '/' })} 
              className="bg-transparent"
            >
              <LogOut className="h-4 w-4 text-foreground" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePrevMonth} 
              className="bg-transparent"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleNextMonth} 
              className="bg-transparent"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </Button>
          </div>
        </div>

        <div className="relative min-h-150">
          {!showBack ? (
            <MonthCalendar
              month={months[currentMonth].name}
              days={months[currentMonth].days}
              year={currentYear}
              userEmail={session.user.email ?? ""}
              monthIndex={currentMonth}
            />
          ) : (
            <MonthReview 
              month={months[currentMonth].name} 
              userEmail={session.user.email ?? ""}
              monthIndex={currentMonth} 
            />
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <Button 
            onClick={() => setShowBack(!showBack)} 
            variant="secondary" 
            className="gap-2 px-6"
          >
            {showBack ? "← Ver Calendário" : "Ver Livros Lidos →"}
          </Button>
        </div>
      </div>
    </main>
  )
}