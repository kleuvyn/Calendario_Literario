"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sparkles, Moon } from "lucide-react"
import { getMonthData, saveMonthData, type DayData } from "@/lib/storage"

interface MonthCalendarProps {
  month: string
  days: number
  year: number
  userEmail: string
  monthIndex: number
}

export function MonthCalendar({ month, days, year, userEmail, monthIndex }: MonthCalendarProps) {
  const [dayData, setDayData] = useState<Record<number, DayData>>({})

  useEffect(() => {
    const savedData = getMonthData(userEmail, monthIndex)
    setDayData(savedData.days || {})
  }, [userEmail, monthIndex])

  useEffect(() => {
    if (Object.keys(dayData).length > 0) {
      const monthData = getMonthData(userEmail, monthIndex)
      saveMonthData(userEmail, monthIndex, dayData, monthData.books || {})
    }
  }, [dayData, userEmail, monthIndex])

  const updateDay = (day: number, field: keyof DayData, value: string) => {
    setDayData((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  return (
    <Card className="border-accent/20 bg-card p-6 shadow-lg md:p-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">{month}</h2>
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <p className="text-lg text-muted-foreground">{year}</p>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-4 gap-3 md:grid-cols-7 md:gap-4">
        {Array.from({ length: days }, (_, i) => i + 1).map((day) => (
          <div
            key={day}
            className="group relative rounded-lg border border-border bg-background/50 p-3 transition-all hover:border-primary/40 hover:shadow-md"
          >
            {/* Day Number */}
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-primary">{day}</span>
              {day % 7 === 0 && <Moon className="h-3 w-3 text-muted-foreground" />}
            </div>

            {/* Input Fields */}
            <div className="space-y-2">
              <Input
                placeholder="Início"
                value={dayData[day]?.startDate || ""}
                onChange={(e) => updateDay(day, "startDate", e.target.value)}
                className="h-7 border-border/50 bg-background/80 text-xs placeholder:text-xs placeholder:text-muted-foreground"
              />
              <Input
                placeholder="Fim"
                value={dayData[day]?.endDate || ""}
                onChange={(e) => updateDay(day, "endDate", e.target.value)}
                className="h-7 border-border/50 bg-background/80 text-xs placeholder:text-xs placeholder:text-muted-foreground"
              />
              <Input
                placeholder="Livro"
                value={dayData[day]?.bookName || ""}
                onChange={(e) => updateDay(day, "bookName", e.target.value)}
                className="h-7 border-border/50 bg-background/80 text-xs placeholder:text-xs placeholder:text-muted-foreground"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Decoration */}
      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <div className="h-px w-12 bg-border" />
        <span>✦</span>
        <div className="h-px w-12 bg-border" />
      </div>
    </Card>
  )
}
