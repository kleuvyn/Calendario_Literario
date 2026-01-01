"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Trash2, Edit2 } from "lucide-react"
import { getReadingData, saveReadingDay } from "@/lib/api-client"

export function MonthCalendar({ month, days, year, userEmail, monthIndex }: any) {
  const [readings, setReadings] = useState<any[]>([])
  const [tempBookNames, setTempBookNames] = useState<Record<number, string>>({})
  const [isUpdating, setIsUpdating] = useState(false)

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  async function loadData() {
    if (!userEmail) return
    try {
      const response: any = await getReadingData(userEmail, year)
      const finalData = response?.data ? response.data : response
      setReadings(Array.isArray(finalData) ? finalData : [])
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
    }
  }

  useEffect(() => {
    loadData()
  }, [userEmail, monthIndex, year])

  async function handleEditName(oldName: string) {
    const newName = prompt("Editar nome do livro:", oldName)
    if (!newName || newName === oldName) return
    setIsUpdating(true)
    try {
      await fetch("/api/reading-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "EDIT_READING", email: userEmail, bookName: newName, oldBookName: oldName })
      })
      await loadData()
    } catch (err) { alert("Erro ao atualizar.") } finally { setIsUpdating(false) }
  }

  async function handleDelete(bookName: string) {
    if (!confirm(`Excluir totalmente "${bookName}"?`)) return
    setIsUpdating(true)
    try {
      await fetch("/api/reading-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_READING", email: userEmail, bookName: bookName })
      })
      await loadData()
    } finally { setIsUpdating(false) }
  }

  async function handleAction(day: number, action: "START_READING" | "FINISH_READING", bookName?: string) {
    if (isUpdating || !userEmail) return
    const name = bookName || tempBookNames[day]
    if (!name) return
    
    setIsUpdating(true)
    const dateFormatted = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00Z`
    
    try {
      await saveReadingDay(
        userEmail, year, monthIndex + 1, day, 
        dateFormatted, dateFormatted, name, action
      )
      setTempBookNames(p => ({ ...p, [day]: "" }))
      await loadData() 
    } catch (err) { alert("Erro ao salvar.") } finally { setIsUpdating(false) }
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-4xl font-serif font-bold text-primary capitalize">{month}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-7 md:gap-4">
        {Array.from({ length: days || 31 }, (_, i) => i + 1).map((day) => {
          const currentDayStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isFuture = currentDayStr > todayStr
          const isToday = currentDayStr === todayStr
          
          const dayReadings = readings.filter((r) => {
            if (!r.start_date) return false
            const startStr = r.start_date.split('T')[0]
            const endStr = r.end_date ? r.end_date.split('T')[0] : null
            const started = currentDayStr >= startStr
            const notFinishedYet = !endStr || currentDayStr <= endStr
            return started && notFinishedYet
          })

          return (
            <div key={`${monthIndex}-${day}`} className={`min-h-40 rounded-lg border p-2 flex flex-col bg-card shadow-sm transition-all ${isToday ? 'ring-2 ring-primary bg-primary/5' : isFuture ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-muted-foreground">{day}</span>
                {isUpdating && <Loader2 size={10} className="animate-spin opacity-20" />}
              </div>
              
              <div className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
                {dayReadings.map((r, idx) => (
                  <div key={idx} className={`p-1.5 rounded text-[10px] border shadow-sm relative flex gap-2 transition-colors ${r.status === 'lendo' ? 'bg-primary/10 border-primary/30' : 'bg-muted/50 border-border'}`}>
                    
                    {r.cover_url && (
                      <img src={r.cover_url} alt="capa" className="w-6 h-9 object-cover rounded shadow-sm shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <p className="truncate font-black text-foreground flex-1 leading-tight uppercase">
                          {r.book_name}
                        </p>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => handleEditName(r.book_name)} className="hover:text-primary"><Edit2 size={8} /></button>
                          <button onClick={() => handleDelete(r.book_name)} className="hover:text-destructive"><Trash2 size={8} /></button>
                        </div>
                      </div>

                      {r.status === "lendo" && (
                        <Button 
                          size="sm" 
                          className="h-5 w-full text-[8px] mt-1 font-bold bg-destructive/5 hover:bg-destructive/10 border-destructive/20 text-destructive/80" 
                          variant="outline" 
                          onClick={() => handleAction(day, "FINISH_READING", r.book_name)}
                        >
                          ENCERRAR AQUI
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!isFuture && (
                <div className="mt-2 pt-2 border-t border-border/50 relative">
                  <Input 
                    className="h-7 text-[16px] md:text-[10px] mb-1"
                    placeholder="Nome do livro..." 
                    value={tempBookNames[day] || ""} 
                    onChange={e => setTempBookNames(p => ({ ...p, [day]: e.target.value }))} 
                    onKeyDown={(e) => e.key === 'Enter' && handleAction(day, "START_READING")}
                    autoComplete="off"
                  />

                  <Button 
                    className="h-7 w-full text-[10px] font-bold" 
                    onClick={() => handleAction(day, "START_READING")} 
                    disabled={isUpdating || !tempBookNames[day]}
                  >
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