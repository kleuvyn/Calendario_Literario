"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, Edit2, BookMarked, Calendar, CheckCircle2, XCircle, Star, Plus, Info } from "lucide-react"
import { getReadingData, saveReadingDay } from "@/lib/api-client"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { BookSearchDialog } from "@/components/book-search-dialog"
import { EditBookDialog } from "@/components/edit-book-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import type { BookSearchResult } from "@/lib/google-books"

export function MonthCalendar({ month, days, year, userEmail, monthIndex }: any) {
  const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop"
  const safeCoverUrl = (url?: string) => {
    if (!url || !url.trim()) return PLACEHOLDER_IMAGE
    const trimmed = url.trim()
    // permite URL padrão de imagem ou data URI para imagens base64
    if (/^(data:image\/(?:png|jpe?g|webp|avif|gif);base64,[A-Za-z0-9+/=]+)$/i.test(trimmed)) return trimmed
    if (/^(https?:\/\/.*\.(?:png|jpe?g|webp|avif|gif))(\?.*)?$/i.test(trimmed)) return trimmed
    return PLACEHOLDER_IMAGE
  }

  const [readings, setReadings] = useState<any[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())
  
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bookToEdit, setBookToEdit] = useState<any>(null)
  const [bookToDelete, setBookToDelete] = useState<string>("")

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Carregar dados
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

  useEffect(() => { loadData() }, [userEmail, monthIndex, year])

  // Função para calcular dias (sua função de negócio)
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return null
    const s = new Date(start); const e = new Date(end)
    s.setHours(0,0,0,0); e.setHours(0,0,0,0)
    const diff = Math.abs(e.getTime() - s.getTime())
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  }

  // Handlers
  async function handleSelectBook(book: BookSearchResult) {
    if (!selectedDay || !userEmail) return
    setIsUpdating(true)
    const dateFormatted = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}T12:00:00Z`
    try {
      await saveReadingDay(userEmail, year, monthIndex + 1, selectedDay, dateFormatted, dateFormatted, book.title, "START_READING", book.cover, book.authors, book.pages)
      await loadData()
      setSearchDialogOpen(false)
      toast.success("Leitura iniciada!")
    } catch (err) { toast.error("Erro ao salvar") } finally { setIsUpdating(false) }
  }

  async function handleFinishReading(day: number, bookName: string, e: React.MouseEvent) {
    e.stopPropagation()
    setIsUpdating(true)
    const dateFormatted = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00Z`
    try {
      await saveReadingDay(userEmail, year, monthIndex + 1, day, dateFormatted, dateFormatted, bookName, "FINISH_READING")
      await loadData()
      toast.success("Parabéns pela conclusão! 🎉")
    } catch (err) { toast.error("Erro ao finalizar") } finally { setIsUpdating(false) }
  }

  function handleEdit(book: any) {
    setBookToEdit(book)
    setEditDialogOpen(true)
  }

  async function handleUpdateBook(book: any, data: { newName: string; author: string; pages: number; rating: number; notes: string; cover_url?: string }) {
    setIsUpdating(true)
    try {
      await fetch("/api/reading-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_REVIEW",
          email: userEmail,
          oldBookName: book.book_name,
          bookName: data.newName,
          rating: data.rating,
          coverUrl: data.cover_url || book.cover_url || "",
          totalPages: data.pages || book.total_pages || 0,
          review: data.notes || "",
          genre: book.genre || "",
          year: book.year || year,
          month: book.month || (monthIndex + 1)
        })
      })
      await loadData()
      toast.success("Informações salvas com sucesso!")
    } catch (err) {
      toast.error("Erro ao salvar edição")
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleConfirmDelete() {
    if (!bookToDelete || !userEmail) return
    setIsUpdating(true)
    try {
      await fetch("/api/reading-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_READING", email: userEmail, bookName: bookToDelete })
      })
      await loadData()
      setDeleteDialogOpen(false)
      toast.success("Livro removido")
    } catch (err) {
      toast.error("Erro ao excluir")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-2">
      {/* Header Centralizado */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">
          {month} <span className="text-primary/40 font-light">{year}</span>
        </h2>
      </div>

      {/* Dias da Semana (Desktop) */}
      <div className="hidden lg:grid grid-cols-7 gap-4 mb-2 px-4">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <span key={d} className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">{d}</span>
        ))}
      </div>

      {/* Grade do Calendário - 7 Colunas em PC e Mobile */}
      <div className="grid grid-cols-7 gap-1 sm:gap-3 md:gap-4">
        {Array.from({ length: days || 31 }, (_, i) => i + 1).map((day) => {
          const currentDayStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isFuture = currentDayStr > todayStr
          const isToday = currentDayStr === todayStr
          const isExpanded = expandedDays.has(day)
          
          const dayReadings = readings.filter((r) => {
            const startStr = r.start_date?.split('T')[0]
            const endStr = r.end_date?.split('T')[0]
            return currentDayStr >= startStr && (!endStr || currentDayStr <= endStr)
          })

          return (
            <motion.div 
              key={day}
              layout
              onClick={() => !isFuture && dayReadings.length > 0 && setExpandedDays(prev => {
                const next = new Set(prev); isExpanded ? next.delete(day) : next.add(day); return next;
              })}
              className={`relative flex flex-col p-1 sm:p-3 rounded-xl sm:rounded-[2rem] border-2 transition-all 
                ${isToday ? 'border-primary bg-primary/[0.02] shadow-lg' : 'border-slate-100 bg-white'}
                ${isFuture ? 'opacity-30 grayscale' : 'hover:border-primary/40'}
                ${isExpanded ? 'col-span-2 row-span-2 min-h-[280px] z-10 shadow-2xl' : 'h-24 sm:h-40'}
              `}
            >
              {/* Número do Dia */}
              <div className="flex justify-between items-start mb-1 sm:mb-2">
                <span className={`text-xs sm:text-lg font-black px-1.5 sm:px-3 sm:py-1 rounded-lg ${isToday ? 'bg-primary text-white' : 'text-slate-400'}`}>
                  {day}
                </span>
                {dayReadings.length > 0 && !isExpanded && (
                  <div className="hidden sm:flex -space-x-2">
                    {dayReadings.slice(0, 2).map((r, i) => (
                      <img
                        key={i}
                        src={safeCoverUrl(r.cover_url)}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
                        className="w-6 h-6 rounded-full border border-white object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Conteúdo do Dia */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                {dayReadings.map((r, idx) => {
                  const daysTotal = calculateDays(r.start_date, r.end_date)
                  return (
                    <div key={idx} className={`rounded-lg p-1 sm:p-2 ${isExpanded ? 'bg-slate-50 border border-slate-200 mb-2' : ''}`}>
                      <div className="flex gap-2 items-center">
                        <div className={`w-1 h-4 sm:h-6 rounded-full ${r.status === 'lendo' ? 'bg-orange-500' : 'bg-green-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] sm:text-[10px] font-bold truncate uppercase">{r.book_name}</p>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-2">
                                <img
                                  src={safeCoverUrl(r.cover_url)}
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
                                  className="w-10 h-14 rounded shadow-md object-cover"
                                />
                                <div className="flex-1 text-[9px] font-bold text-slate-500">
                                  {r.status === 'lendo' ? '📖 Lendo agora' : `✅ Concluído em ${daysTotal} dias`}
                                </div>
                              </div>

                              <div className="border-t pt-2 flex items-center justify-between">
                                <div className="text-[9px] text-slate-400 uppercase tracking-wider">Ações</div>
                                <div className="flex gap-1">
                                  {r.status === 'lendo' && (
                                    <Button size="icon" className="h-6 w-6 bg-green-500" onClick={(e) => handleFinishReading(day, r.book_name, e)}><CheckCircle2 size={12}/></Button>
                                  )}
                                  <Button size="icon" variant="outline" className="h-6 w-6" onClick={(e) => {e.stopPropagation(); setBookToEdit(r); setEditDialogOpen(true)}}><Edit2 size={12}/></Button>
                                  <Button size="icon" variant="destructive" className="h-6 w-6 bg-red-600 text-white hover:bg-red-700" onClick={(e) => {e.stopPropagation(); setBookToDelete(r.book_name); setDeleteDialogOpen(true)}}><Trash2 size={12}/></Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
              </div>
              {!isFuture && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedDay(day); setSearchDialogOpen(true); }}
                  className="mt-auto w-full py-1 text-[8px] sm:text-[10px] font-black uppercase text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-1 border-t border-dashed border-slate-200 pt-1"
                >
                  <Plus size={10} /> <span className="hidden sm:inline">Adicionar</span>
                </button>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Dialogs mantidos com todas as suas props */}
      <BookSearchDialog 
        open={searchDialogOpen} 
        onClose={() => setSearchDialogOpen(false)} 
        onSelectBook={handleSelectBook} 
      />
      <EditBookDialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        onSave={async (data) => {
          if (bookToEdit) {
            await handleUpdateBook(bookToEdit, data)
          }
          setEditDialogOpen(false)
        }} 
        bookName={bookToEdit?.book_name || ""} 
        bookData={bookToEdit} 
      />
      <DeleteConfirmDialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        onConfirm={handleConfirmDelete} 
        bookName={bookToDelete} 
        isLoading={isUpdating} 
      />
    </div>
  )
}