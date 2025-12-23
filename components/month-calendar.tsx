"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Trash2, Edit2 } from "lucide-react"
import { getReadingData } from "@/lib/api-client"

export function MonthCalendar({ month, days, year, userEmail, monthIndex }: any) {
  const [readings, setReadings] = useState<any[]>([])
  const [tempBookNames, setTempBookNames] = useState<Record<number, string>>({})
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Ajuste para pegar a data de hoje local corretamente sem erro de fuso
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  async function loadData() {
    if (!userEmail) return
    try {
      const response: any = await getReadingData(userEmail, year)
      // AJUSTE: Verifica se os dados vêm dentro de um objeto .data ou se é o array puro
      const finalData = response?.data ? response.data : response
      setReadings(Array.isArray(finalData) ? finalData : [])
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
    }
  }

  useEffect(() => {
    loadData()
  }, [userEmail, monthIndex, year])

  async function handleEditName(bookId: string, oldName: string) {
    const newName = prompt("Editar nome do livro:", oldName)
    if (!newName || newName === oldName) return

    setIsUpdating(true)
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newName }),
      })
      if (res.ok) await loadData()
    } catch (err) {
      alert("Erro ao atualizar nome.")
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDelete(bookId: string, bookName: string) {
    if (!confirm(`Excluir totalmente "${bookName}"?`)) return
    setIsDeleting(bookId)
    try {
      const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" })
      if (res.ok) await loadData()
    } catch (err) {
      alert("Erro ao excluir.")
    } finally {
      setIsDeleting(null)
    }
  }

  async function handleAction(day: number, action: "START_READING" | "FINISH_READING", bookName?: string) {
    if (isUpdating || !userEmail) return
    const name = bookName || tempBookNames[day]
    if (!name) return

    setIsUpdating(true)
    // Formata a data manualmente para YYYY-MM-DD para evitar problemas de fuso horário
    const dateFormatted = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00Z`

    try {
      await fetch("/api/reading-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          email: userEmail,
          bookName: name,
          startDate: action === "START_READING" ? dateFormatted : undefined,
          endDate: action === "FINISH_READING" ? dateFormatted : undefined,
          year: year,
          month: monthIndex + 1
        })
      })
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
          const isFuture = currentDayStr > todayStr
          const isToday = currentDayStr === todayStr

          // FILTRO CORRIGIDO:
          const dayReadings = readings.filter((r) => {
            if (!r.start_date) return false
            const startStr = r.start_date.split('T')[0]
            const endStr = r.end_date ? r.end_date.split('T')[0] : null
            
            // Verifica se o dia atual do calendário está entre o início e o fim da leitura
            return currentDayStr >= startStr && (!endStr || currentDayStr <= endStr)
          })

          return (
            <div key={`${monthIndex}-${day}`} className={`min-h-40 rounded-lg border p-2 flex flex-col bg-card shadow-sm ${isToday ? 'ring-2 ring-primary bg-primary/5' : isFuture ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-muted-foreground">{day}</span>
              </div>
              
              <div className="flex-1 space-y-1 overflow-y-auto">
                {dayReadings.map((r, idx) => (
                  <div key={idx} className={`p-1.5 rounded text-[10px] border shadow-sm relative ${r.status === 'lendo' ? 'bg-primary/10 border-primary/30' : 'bg-muted/50 border-border'}`}>
                    <div className="flex justify-between items-start gap-1">
                      <p className="truncate font-black text-foreground flex-1 cursor-pointer hover:underline" onClick={() => handleEditName(r.id, r.book_name)}>
                        {r.book_name.toUpperCase()}
                      </p>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditName(r.id, r.book_name)} className="text-muted-foreground hover:text-primary">
                          <Edit2 size={8} />
                        </button>
                        <button onClick={() => handleDelete(r.id, r.book_name)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 size={8} />
                        </button>
                      </div>
                    </div>

                    {r.status === "lendo" && (
                      <Button size="sm" className="h-5 w-full text-[8px] mt-1 font-bold" variant="destructive" onClick={() => handleAction(day, "FINISH_READING", r.book_name)}>
                        ENCERRAR AQUI
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {!isFuture && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <Input 
                    className="h-7 text-[10px] mb-1" 
                    placeholder="Novo livro..." 
                    value={tempBookNames[day] || ""} 
                    onChange={e => setTempBookNames(p => ({ ...p, [day]: e.target.value }))} 
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