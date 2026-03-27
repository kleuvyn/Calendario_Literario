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
  const [activeSummary, setActiveSummary] = useState<'lendo' | 'lido' | 'planejados' | ''>('')
  const [isPlanning, setIsPlanning] = useState(false)

  const normalizeStatus = (status: string | undefined) => (status || '').toLowerCase()

  const monthStart = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0))
  const monthEnd = new Date(Date.UTC(year, monthIndex, days || 31, 23, 59, 59))

  const bookInMonth = (r: any) => {
    const status = normalizeStatus(r.status)
    const start = r.start_date ? new Date(r.start_date) : null
    const end = r.end_date ? new Date(r.end_date) : null

    const isOngoing = ['lendo', 'reading'].includes(status)
    const isFinished = ['lido', 'finished'].includes(status)
    const isPlanned = ['planejado', 'planned'].includes(status)

    const intersects = (s: Date | null, e: Date | null) => {
      if (!s && !e) return true
      const sTime = s ? s.getTime() : Number.MIN_SAFE_INTEGER
      const eTime = e ? e.getTime() : Number.MAX_SAFE_INTEGER
      return sTime <= monthEnd.getTime() && eTime >= monthStart.getTime()
    }

    if (isOngoing) {
      return intersects(start, end)
    }

    if (isFinished) {
      if (!end && !start) return false
      const hasEndInMonth = end && end >= monthStart && end <= monthEnd
      const hasStartInMonth = start && start >= monthStart && start <= monthEnd
      return !!hasEndInMonth || !!hasStartInMonth
    }

    if (isPlanned) {
      if (!start) return true
      return start >= monthStart && start <= monthEnd
    }

    return intersects(start, end)
  }

  const booksThisMonth = readings.filter(bookInMonth)
  const haveReadThisMonth = booksThisMonth.filter(r => ['lido', 'finished'].includes(normalizeStatus(r.status))).length
  const readingNowThisMonth = booksThisMonth.filter(r => ['lendo', 'reading'].includes(normalizeStatus(r.status))).length
  const havePlannedThisMonth = booksThisMonth.filter(r => !['lido', 'finished', 'lendo', 'reading'].includes(normalizeStatus(r.status))).length

  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bookToEdit, setBookToEdit] = useState<any>(null)
  const [bookToDelete, setBookToDelete] = useState<string>("")

  const summaryFilter = activeSummary || 'planejados' // exibir planejados por padrão quando nenhum resumo estiver ativo

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Carregar dados
  async function loadData() {
    if (!userEmail) return
    try {
      const response: any = await getReadingData(userEmail, year, false, undefined, monthIndex + 1)
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
  async function handlePlanBook(book: BookSearchResult) {
    if (!userEmail) return
    setIsUpdating(true)

    let startDateValue = null
    if (selectedDay) {
      startDateValue = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}T12:00:00Z`
    }

    try {
      await fetch('/api/reading-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PLAN_READING',
          email: userEmail,
          bookName: book.title,
          author: book.authors || '',
          coverUrl: book.cover || '',
          startDate: startDateValue,
          year,
          month: monthIndex + 1,
          totalPages: book.pages || 0
        })
      })
      await loadData()
      setSearchDialogOpen(false)
      setIsPlanning(false)
      toast.success('Livro adicionado como planejado!')
    } catch (err) {
      toast.error('Não foi possível adicionar planejado')
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleSelectBook(book: BookSearchResult) {
    if (!userEmail) return
    setIsUpdating(true)

    if (isPlanning) {
      await handlePlanBook(book)
      return
    }

    if (!selectedDay) {
      toast.error('Selecione um dia para começar a leitura')
      setIsUpdating(false)
      return
    }

    const dateFormatted = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}T12:00:00Z`
    try {
      await saveReadingDay(userEmail, year, monthIndex + 1, selectedDay, dateFormatted, dateFormatted, book.title, 'START_READING', book.cover, book.authors, book.pages)
      await loadData()
      setSearchDialogOpen(false)
      setIsPlanning(false)
      toast.success('Leitura iniciada!')
    } catch (err) {
      toast.error('Erro ao salvar')
    } finally {
      setIsUpdating(false)
    }
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

  async function handleStartPlanned(book: any) {
    if (!userEmail || !book?.book_name) return
    setIsUpdating(true)

    const now = new Date()
    const startDateObject = book.start_date ? new Date(book.start_date) : now
    const finalDateObj = new Date(startDateObject)
    finalDateObj.setUTCHours(12,0,0,0)

    const dateFormatted = finalDateObj.toISOString()
    const yearValue = finalDateObj.getUTCFullYear()
    const monthValue = finalDateObj.getUTCMonth() + 1
    const dayValue = finalDateObj.getUTCDate()

    try {
      await saveReadingDay(
        userEmail,
        yearValue,
        monthValue,
        dayValue,
        dateFormatted,
        dateFormatted,
        book.book_name,
        "START_READING",
        book.cover_url || book.cover || "",
        book.author_name || book.author || "",
        book.total_pages || 0
      )
      await loadData()
      toast.success("Plano iniciado! Agora está em leitura.")
      setActiveSummary('lendo')
    } catch (err) {
      toast.error("Erro ao mover para lendo")
    } finally {
      setIsUpdating(false)
    }
  }

  function handleEdit(book: any) {
    setBookToEdit(book)
    setEditDialogOpen(true)
  }

  async function handleConcludePlanned(book: any) {
    if (!userEmail || !book?.book_name) return
    setIsUpdating(true)
    try {
      const now = new Date()
      const dateFormatted = now.toISOString()
      await saveReadingDay(
        userEmail,
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        now.getUTCDate(),
        dateFormatted,
        dateFormatted,
        book.book_name,
        "FINISH_READING",
        book.cover_url || book.cover || "",
        book.author_name || book.author || "",
        book.total_pages || book.pages || 0
      )
      await loadData()
      toast.success("Livro marcado como concluído!")
      setActiveSummary('lido')
    } catch (err) {
      toast.error("Erro ao marcar completado")
    } finally {
      setIsUpdating(false)
    }
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
      <div className="text-center mb-4">
        <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">
          {month} <span className="text-primary/40 font-light">{year}</span>
        </h2>
        <p className="text-sm text-slate-500">Mostrando leituras do mês: lidos, lendo e agendados</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-2 text-center text-xs font-bold uppercase">
        <button
          onClick={() => setActiveSummary(activeSummary === 'lendo' ? '' : 'lendo')}
          className={`rounded-xl border p-3 transition ${activeSummary === 'lendo' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
          Lendo: {readingNowThisMonth}
        </button>
        <button
          onClick={() => setActiveSummary(activeSummary === 'lido' ? '' : 'lido')}
          className={`rounded-xl border p-3 transition ${activeSummary === 'lido' ? 'border-emerald-600 bg-emerald-100 text-emerald-700' : 'border-slate-200 bg-emerald-50 text-emerald-700'}`}>
          Concluídos: {haveReadThisMonth}
        </button>
        <button
          onClick={() => setActiveSummary(activeSummary === 'planejados' ? '' : 'planejados')}
          className={`rounded-xl border p-3 transition ${activeSummary === 'planejados' ? 'border-blue-600 bg-blue-100 text-blue-700' : 'border-slate-200 bg-blue-50 text-blue-700'}`}>
          Planejados: {havePlannedThisMonth}
        </button>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setIsPlanning(true)
            setSelectedDay(null)
            setActiveSummary('planejados')
            setSearchDialogOpen(true)
          }}
          className="text-[10px] font-black uppercase rounded border border-blue-400 text-blue-600 px-2 py-1 hover:bg-blue-50"
        >
          + Adicionar planejado
        </button>
      </div>

      <div className="mb-6 p-3 rounded-xl border border-slate-200 bg-white shadow-sm">
          <p className="text-xs font-bold mb-2 uppercase text-slate-500">
            {summaryFilter === 'lendo' && 'Livros em leitura'}
            {summaryFilter === 'lido' && 'Livros concluídos'}
            {summaryFilter === 'planejados' && 'Livros planejados'}
          </p>
          <div className="space-y-2">
            {booksThisMonth
              .filter((r) => {
                const status = normalizeStatus(r.status)
                if (summaryFilter === 'lendo') return ['lendo', 'reading'].includes(status)
                if (summaryFilter === 'lido') return ['lido', 'finished'].includes(status)
                return !['lido', 'finished', 'lendo', 'reading'].includes(status)
              })
              .map((r) => (
                <div key={`${r.book_name}-${r.id || r.start_date || Math.random()}`} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{r.book_name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{r.author_name || r.author || 'Autor não informado'}</p>
                  </div>
                  {summaryFilter === 'planejados' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleStartPlanned(r)}
                        disabled={isUpdating}
                        className="text-[10px] font-black uppercase rounded bg-indigo-600 text-white px-2 py-1 hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Iniciar
                      </button>
                      <button
                        onClick={() => handleConcludePlanned(r)}
                        disabled={isUpdating}
                        className="text-[10px] font-black uppercase rounded bg-emerald-600 text-white px-2 py-1 hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Concluir
                      </button>
                      <button
                        onClick={() => handleEdit(r)}
                        className="text-[10px] font-black uppercase rounded border border-slate-300 px-2 py-1 hover:bg-slate-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => { setBookToDelete(r.book_name); setDeleteDialogOpen(true) }}
                        className="text-[10px] font-black uppercase rounded border border-red-200 text-red-600 px-2 py-1 hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
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
            const startStr = r.start_date?.split('T')[0] || currentDayStr
            const endStr = r.end_date?.split('T')[0]

            const status = (r.status || '').toLowerCase()
            const readingStatus = status === 'lendo' || status === 'reading'
            const finishedStatus = status === 'lido' || status === 'finished'
            // planned não deve ser exibido diretamente nos dias do calendário
            const plannedStatus = status === 'planejado' || status === 'planned'

            if (plannedStatus) {
              return false
            }

            if (readingStatus) {
              if (!startStr) return true
              return currentDayStr >= startStr && (!endStr || currentDayStr <= endStr)
            }

            if (finishedStatus) {
              if (!startStr && !endStr) return false
              return currentDayStr >= startStr && (!endStr || currentDayStr <= endStr)
            }

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
                ${isExpanded ? 'col-span-2 row-span-2 min-h-[280px] z-10 shadow-2xl' : 'aspect-square h-auto'}
              `}

            >
              {/* Número do Dia */}
              <div className="absolute inset-0 p-1 sm:p-3">
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
            </div>

              {/* Conteúdo do Dia */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 mt-4">
                {dayReadings.map((r, idx) => {
                  const daysTotal = calculateDays(r.start_date, r.end_date)
                  const readingStatus = r.status === 'lendo' || r.status === 'reading'
                  const finishedStatus = r.status === 'lido' || r.status === 'finished'
                  const statusLabel = readingStatus ? 'Lendo' : finishedStatus ? 'Concluído' : r.status
                  return (
                    <div key={idx} className={`rounded-lg p-1 sm:p-2 ${isExpanded ? 'bg-slate-50 border border-slate-200 mb-2' : ''}`}>
                      <div className="flex gap-2 items-center">
                        <div className={`w-1 h-4 sm:h-6 rounded-full ${readingStatus ? 'bg-orange-500' : finishedStatus ? 'bg-green-500' : 'bg-slate-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] sm:text-[10px] font-bold truncate uppercase">{r.book_name}</p>
                          <p className="text-[8px] text-slate-500 uppercase tracking-wider">{statusLabel}</p>
                        </div>
                        {!isExpanded && (
                          <div className="flex gap-1">
                            {readingStatus && (
                              <Button size="icon" className="h-5 w-5 bg-green-500" onClick={(e) => { e.stopPropagation(); handleFinishReading(day, r.book_name, e) }}><CheckCircle2 size={10}/></Button>
                            )}
                            <Button size="icon" variant="outline" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); setBookToEdit(r); setEditDialogOpen(true) }}><Edit2 size={10}/></Button>
                            <Button size="icon" variant="destructive" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); setBookToDelete(r.book_name); setDeleteDialogOpen(true) }}><Trash2 size={10}/></Button>
                          </div>
                        )}
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
        onClose={() => { setSearchDialogOpen(false); setIsPlanning(false); }} 
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