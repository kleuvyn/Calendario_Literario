"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { getReadingData, saveReadingDay } from "@/lib/api-client"

export function MonthCalendar({ month, days, year, userEmail, monthIndex }: any) {
  const [readings, setReadings] = useState<any[]>([])
  const [tempBookNames, setTempBookNames] = useState<Record<number, string>>({})
  const [isUpdating, setIsUpdating] = useState(false)

  const now = new Date()
  const todayStr = now.toLocaleDateString('en-CA') // YYYY-MM-DD

  async function loadData() {
    if (!userEmail) return
    try {
      const data = await getReadingData(userEmail, year, monthIndex + 1)
      setReadings(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [userEmail, monthIndex, year])

  async function handleAction(day: number, action: "START_READING" | "FINISH_READING", bookName?: string) {
    if (isUpdating || !userEmail) return
    const name = bookName || tempBookNames[day]
    if (!name) return

    setIsUpdating(true)
    const formattedDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00.000Z`

    try {
      await saveReadingDay(
        userEmail, year, monthIndex + 1, day,
        action === "START_READING" ? formattedDate : "",
        action === "FINISH_READING" ? formattedDate : "",
        name, action
      )
      setTempBookNames(p => ({ ...p, [day]: "" }))
      await loadData() 
    } catch (err) {
      alert("Erro ao salvar.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-4xl font-serif font-bold text-primary capitalize">{month}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-7 md:gap-4">
        {Array.from({ length: days || 31 }, (_, i) => i + 1).map((day) => {
          const currentDayStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = currentDayStr === todayStr
          const isFuture = currentDayStr > todayStr

          const dayReadings = readings.filter((r) => {
            if (!r.start_date || isFuture) return false
            const startStr = r.start_date.split('T')[0]
            const endStr = r.end_date ? r.end_date.split('T')[0] : null
            return currentDayStr >= startStr && (!endStr || currentDayStr <= endStr)
          })

          return (
            <div key={`${monthIndex}-${day}`} className={`min-h-40 rounded-lg border p-2 flex flex-col bg-card shadow-sm ${isToday ? 'ring-2 ring-primary bg-primary/5' : isFuture ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-muted-foreground">{day}</span>
                {isToday && <span className="text-[8px] bg-primary text-primary-foreground px-1 rounded">HOJE</span>}
              </div>
              
              <div className="flex-1 space-y-1 overflow-y-auto">
                {dayReadings.map((r, idx) => (
                  <div key={idx} className={`p-1.5 rounded text-[10px] border shadow-sm ${r.status === 'lendo' ? 'bg-primary/10 border-primary/30' : 'bg-muted/50 border-border'}`}>
                    <p className="truncate font-bold text-foreground">{r.book_name.toUpperCase()}</p>
                    {r.status === "lendo" && (
                      <Button size="sm" className="h-5 w-full text-[8px] mt-1 font-bold" variant="destructive" onClick={() => handleAction(day, "FINISH_READING", r.book_name)}>
                        ENCERRAR AQUI
                      </Button>
                    )}
                    {r.status === "finalizado" && (
                      <div className="text-[7px] text-center text-primary font-bold mt-1 uppercase">✓ Concluído</div>
                    )}
                  </div>
                ))}
              </div>

              {!isFuture && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <Input className="h-7 text-[10px] mb-1" placeholder="Novo livro..." value={tempBookNames[day] || ""} onChange={e => setTempBookNames(p => ({ ...p, [day]: e.target.value }))} />
                  <Button className="h-7 w-full text-[10px] font-bold" onClick={() => handleAction(day, "START_READING")} disabled={isUpdating || !tempBookNames[day]}>
                    INICIAR
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}