"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, Edit2, BookMarked, Calendar, CheckCircle2, XCircle, Star, Plus, Info } from "lucide-react"
import { getReadingData, saveReadingDay } from "@/lib/api-client"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { BookSearchDialog } from "@/components/book-search-dialog"
import { EditBookDialog } from "@/components/edit-book-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import type { BookSearchResult } from "@/lib/google-books"

export function MonthCalendar({ month, days, year, userEmail, monthIndex, themePrimary, initialReadings }: any) {
  const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop"
  const initialYearRef = useRef(year)
  const hasInitialReadings = Array.isArray(initialReadings) && initialReadings.length > 0
  const safeCoverUrl = (url?: string) => {
    if (!url || !url.trim()) return PLACEHOLDER_IMAGE
    const trimmed = url.trim()
    // permite URL padrão de imagem ou data URI para imagens base64
    if (/^data:image\/(?:png|jpe?g|webp|avif|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) return trimmed
    if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
      // Em produção HTTPS, evita bloqueio de mixed content para capas antigas.
      return trimmed.replace(/^http:\/\//i, 'https://')
    }
    return PLACEHOLDER_IMAGE
  }

  const [readings, setReadings] = useState<any[]>(initialReadings ?? [])
  const [isUpdating, setIsUpdating] = useState(false)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())
  const [activeSummary, setActiveSummary] = useState<'lendo' | 'lido' | 'planejados' | ''>('')
  const [isPlanning, setIsPlanning] = useState(false)

  const normalizeStatus = (status: string | undefined) => (status || '').toLowerCase().trim()

  const PLANNED_STATUSES = ['planejado', 'planned', 'quero-ler', 'quero ler', 'wishlist', 'desejado']
  const READING_STATUSES = ['lendo', 'reading']
  const FINISHED_STATUSES = ['lido', 'finished']

  const monthStart = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0))
  const monthEnd = new Date(Date.UTC(year, monthIndex, days || 31, 23, 59, 59))

  const bookInMonth = (r: any) => {
    const status = normalizeStatus(r.status)
    const start = r.start_date ? new Date(r.start_date) : null
    const end = r.end_date ? new Date(r.end_date) : null

    const isOngoing = READING_STATUSES.includes(status)
    const isFinished = FINISHED_STATUSES.includes(status)
    const isPlanned = PLANNED_STATUSES.includes(status)

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
      if (start) return start >= monthStart && start <= monthEnd
      return Number(r.month) === monthIndex + 1 && Number(r.year) === year
    }

    return intersects(start, end)
  }

  const booksThisMonth = readings.filter(bookInMonth)
  const haveReadThisMonth = booksThisMonth.filter(r => FINISHED_STATUSES.includes(normalizeStatus(r.status))).length
  const readingNowThisMonth = booksThisMonth.filter(r => READING_STATUSES.includes(normalizeStatus(r.status))).length
  const havePlannedThisMonth = booksThisMonth.filter(r => PLANNED_STATUSES.includes(normalizeStatus(r.status))).length

  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bookToEdit, setBookToEdit] = useState<any>(null)
  const [bookToDelete, setBookToDelete] = useState<string>("")

  useEffect(() => {
    if (Array.isArray(initialReadings) && initialReadings.length > 0) {
      setReadings(initialReadings)
      initialYearRef.current = year
    }
  }, [initialReadings, year])

  const summaryFilter = activeSummary

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

  useEffect(() => {
    if (!userEmail) return
    if (hasInitialReadings && year === initialYearRef.current) return
    loadData()
  }, [userEmail, monthIndex, year, hasInitialReadings])

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

    const genre = Array.isArray(book.categories)
      ? book.categories.join(', ')
      : book.categories || ''

    try {
      const response = await fetch('/api/reading-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PLAN_READING',
          email: userEmail,
          bookName: book.title,
          author: book.authors || '',
          genre,
          coverUrl: book.cover || '',
          startDate: startDateValue,
          year,
          month: monthIndex + 1,
          totalPages: book.pages || 0
        })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Erro ao adicionar planejado')
      }

      await loadData()
      setSearchDialogOpen(false)
      setIsPlanning(false)
      toast.success('Livro adicionado como planejado!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível adicionar planejado'
      toast.error(message)
      console.error(err)
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

    const genre = Array.isArray(book.categories)
      ? book.categories.join(', ')
      : book.categories || ''
    const dateFormatted = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}T12:00:00Z`
    const dateOnly = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    const shouldFinishReading = dateOnly <= todayStr
    const action = shouldFinishReading ? 'FINISH_READING' : 'START_READING'

    try {
      await saveReadingDay(
        userEmail,
        year,
        monthIndex + 1,
        selectedDay,
        dateFormatted,
        dateFormatted,
        book.title,
        action,
        book.cover,
        book.authors,
        genre,
        book.pages
      )
      await loadData()
      setSearchDialogOpen(false)
      setIsPlanning(false)
      toast.success(shouldFinishReading ? 'Livro registrado como lido!' : 'Leitura iniciada!')
      if (shouldFinishReading) setActiveSummary('lido')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar'
      toast.error(message)
      console.error(err)
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

    const genre = Array.isArray(book.categories)
      ? book.categories.join(', ')
      : book.genre || book.categories || ''

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
        genre,
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

  async function handleUpdateBook(book: any, data: { newName: string; author: string; pages: number; rating: number; notes: string; cover_url?: string; genre?: string; format?: string; owned?: boolean; startDate?: string; endDate?: string }) {
    setIsUpdating(true)
    try {
      let targetYear = book.year || year
      let targetMonth = book.month || (monthIndex + 1)
      const dateRef = data.endDate || data.startDate
      if (dateRef) {
        const parsed = new Date(dateRef)
        if (!isNaN(parsed.getTime())) {
          targetYear = parsed.getUTCFullYear()
          targetMonth = parsed.getUTCMonth() + 1
        }
      }

      const response = await fetch("/api/reading-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_REVIEW",
          email: userEmail,
          oldBookName: book.book_name,
          bookName: data.newName,
          author: data.author || book.author_name || book.author || null,
          rating: data.rating,
          coverUrl: data.cover_url || book.cover_url || "",
          totalPages: data.pages || book.total_pages || 0,
          review: data.notes || "",
          genre: data.genre || book.genre || "",
          format: data.format || book.format || null,
          owned: data.owned !== undefined ? data.owned : book.owned || false,
          year: targetYear,
          month: targetMonth,
          startDate: data.startDate ?? book.start_date ?? book.startDate ?? null,
          endDate: data.endDate ?? book.end_date ?? book.endDate ?? null,
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.error || "Falha ao salvar edição")
      }
      await loadData()
      toast.success("Informações salvas com sucesso!")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao salvar edição"
      toast.error(message)
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
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 p-1 sm:p-2">
      {/* Header Estilo Diário Delicado */}
      <div className="text-center mb-6 sm:mb-10 flex flex-col items-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
            <Star size={14} className="text-slate-300" />
            <h2 className="text-2xl sm:text-5xl font-serif italic capitalize flex items-baseline justify-center">
              <span style={{ color: themePrimary || '#8B4513' }}>Páginas Selecionadas</span> <span className="text-xl font-serif ml-3"></span>
            </h2>
            <Star size={14} className="text-slate-300" />
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 sm:mt-4 font-serif italic">
          "Um capítulo por vez, uma página por dia..."
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 text-center text-xs font-serif text-slate-600">
        <button
          onClick={() => setActiveSummary(activeSummary === 'lendo' ? '' : 'lendo')}
          className={`rounded-full border border-dashed px-3 sm:px-6 py-1.5 sm:py-2 transition-all ${activeSummary === 'lendo' ? 'border-amber-400/50 bg-amber-50 text-amber-700 scale-105' : 'border-slate-300 hover:border-amber-400/30 hover:bg-amber-50'}`}>
          <span className="italic">Lendo ({readingNowThisMonth})</span>
        </button>
        <button
          onClick={() => setActiveSummary(activeSummary === 'lido' ? '' : 'lido')}
          className={`rounded-full border border-dashed px-3 sm:px-6 py-1.5 sm:py-2 transition-all ${activeSummary === 'lido' ? 'border-emerald-500/50 bg-emerald-50 text-emerald-700 scale-105' : 'border-slate-300 hover:border-emerald-500/30 hover:bg-emerald-50'}`}>
          <span className="italic">Concluídos ({haveReadThisMonth})</span>
        </button>
        <button
          onClick={() => setActiveSummary(activeSummary === 'planejados' ? '' : 'planejados')}
          className={`rounded-full border border-dashed px-3 sm:px-6 py-1.5 sm:py-2 transition-all ${activeSummary === 'planejados' ? 'border-slate-400/50 bg-slate-100 text-slate-700 scale-105' : 'border-slate-300 hover:border-slate-400/30 hover:bg-slate-100'}`}>
          <span className="italic">Planejados ({havePlannedThisMonth})</span>
        </button>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={() => {
            setIsPlanning(true)
            setSelectedDay(null)
            setActiveSummary('planejados')
            setSearchDialogOpen(true)
          }}
          className="inline-flex items-center gap-1 text-xs font-serif italic border-b border-slate-300 text-slate-600 hover:text-slate-800 hover:border-slate-500 transition duration-150"
        >
          <Plus size={12} strokeWidth={1.5} /> Adicionar novo livro planejado...
        </button>
      </div>

      {summaryFilter && (
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
                  if (summaryFilter === 'lendo') return READING_STATUSES.includes(status)
                  if (summaryFilter === 'lido') return FINISHED_STATUSES.includes(status)
                  return PLANNED_STATUSES.includes(status)
                })
                .map((r) => (
                  <div key={`${r.book_name}-${r.id || r.start_date || Math.random()}`} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{r.book_name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{r.author_name || r.author || 'Autor não informado'}</p>
                    </div>
                    {summaryFilter === 'planejados' && (
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button
                          onClick={() => handleStartPlanned(r)}
                          disabled={isUpdating}
                          className="text-[10px] font-black uppercase rounded bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 hover:bg-slate-200 disabled:opacity-50"
                        >
                          Iniciar
                        </button>
                        <button
                          onClick={() => handleConcludePlanned(r)}
                          disabled={isUpdating}
                          className="text-[10px] font-black uppercase rounded border border-emerald-200 bg-emerald-100 text-emerald-800 px-2 py-1 hover:bg-emerald-200 disabled:opacity-50"
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
                          className="text-[10px] font-black uppercase rounded border border-rose-200 text-rose-700 px-2 py-1 hover:bg-rose-50"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
      )}

      {/* Container Principal do Calendário */}
      <div className="bg-white/60 backdrop-blur-sm rounded-[3rem] p-4 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 relative">
        <div className="absolute top-8 left-0 right-0 h-[1px] bg-slate-100 pointer-events-none" />
        
        {/* Dias da Semana */}
        <div className="grid grid-cols-7 gap-2 mb-6 px-2 sm:px-4">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <span key={d} className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] text-center bg-white py-1 relative z-10 w-full rounded-full">{d}</span>
          ))}
        </div>

        {/* Grade do Calendário - 7 Colunas em PC e Mobile */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4">
        {Array.from({ length: monthStart.getUTCDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="pointer-events-none" />
        ))}
        {Array.from({ length: days || 31 }, (_, i) => i + 1).map((day) => {
          const currentDayStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isFuture = currentDayStr > todayStr
          const isToday = currentDayStr === todayStr
          const isExpanded = expandedDays.has(day)
          
          const dayReadings = readings.filter((r) => {
            const startStr = r.start_date?.split('T')[0] || null
            const endStr = r.end_date?.split('T')[0]

            const status = normalizeStatus(r.status)
            const readingStatus = READING_STATUSES.includes(status)
            const finishedStatus = FINISHED_STATUSES.includes(status)
            // planned não deve ser exibido diretamente nos dias do calendário
            const plannedStatus = PLANNED_STATUSES.includes(status)

            if (plannedStatus) {
              return false
            }

            if (readingStatus) {
              if (!startStr) return false
              // Livro em leitura aparece do dia de início até hoje (ou até end_date se houver).
              const effectiveEnd = endStr || todayStr
              return currentDayStr >= startStr && currentDayStr <= effectiveEnd
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
              className={`relative flex flex-col p-1 sm:p-3 rounded-xl sm:rounded-4xl border-2 transition-all 
                ${isToday ? 'border-amber-300 bg-amber-50 shadow-lg' : 'border-slate-100 bg-white'}
                ${isFuture ? 'opacity-30 grayscale' : 'hover:border-amber-300'}
                ${isExpanded ? 'col-span-2 row-span-2 min-h-70 z-10 shadow-2xl' : 'aspect-square h-auto'}
              `}
            >
              {/* Número do Dia */}
              <div className="absolute inset-0 p-2 sm:p-3 pointer-events-none z-20">
              <div className="flex justify-between items-start mb-1 sm:mb-2">
                <span
                  className={`text-xs sm:text-base font-black px-2 py-0.5 rounded-full shadow-sm ${isToday ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-white/95 text-slate-700 border border-slate-200'}`}
                >
                  {day}
                </span>
              </div>
            </div>

              {/* Conteúdo do Dia */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 mt-8 sm:mt-10">
                {!isExpanded && dayReadings.length > 0 && (
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {dayReadings.map((r, i) => (
                      <img
                        key={`${r.book_name}-${r.id || i}`}
                        src={safeCoverUrl(r.cover_url)}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE }}
                        className="w-5 h-7 sm:w-6 sm:h-8 rounded-md border border-white object-cover shadow-sm"
                        alt=""
                      />
                    ))}
                  </div>
                )}

                {isExpanded && dayReadings.map((r, idx) => {
                  const daysTotal = calculateDays(r.start_date, r.end_date)
                  const readingStatus = r.status === 'lendo' || r.status === 'reading'
                  const finishedStatus = r.status === 'lido' || r.status === 'finished'
                  const statusLabel = readingStatus ? 'Lendo' : finishedStatus ? 'Concluído' : r.status
                  return (
                    <div key={idx} className="rounded-lg p-1 sm:p-2 bg-slate-50 border border-slate-200 mb-2">
                      <div className="flex gap-2 items-center">
                        <div className={`w-1 h-4 sm:h-6 rounded-full ${readingStatus ? 'bg-orange-500' : finishedStatus ? 'bg-emerald-300' : 'bg-slate-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] sm:text-[10px] font-bold truncate uppercase">{r.book_name}</p>
                          <p className="text-[8px] text-slate-500 uppercase tracking-wider">{statusLabel}</p>
                        </div>
                      </div>
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
                              <Button size="icon" className="h-6 w-6 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200" onClick={(e) => handleFinishReading(day, r.book_name, e)}><CheckCircle2 size={12}/></Button>
                            )}
                            <Button size="icon" variant="outline" className="h-6 w-6" onClick={(e) => {e.stopPropagation(); setBookToEdit(r); setEditDialogOpen(true)}}><Edit2 size={12}/></Button>
                            <Button size="icon" variant="outline" className="h-6 w-6 border-rose-200 text-rose-700 hover:bg-rose-50" onClick={(e) => {e.stopPropagation(); setBookToDelete(r.book_name); setDeleteDialogOpen(true)}}><Trash2 size={12}/></Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
                  {!isFuture && isExpanded && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsPlanning(false); setSelectedDay(day); setSearchDialogOpen(true); }}
                  className="mt-auto w-full py-1 text-[8px] sm:text-[10px] font-black uppercase text-slate-400 hover:text-amber-700 transition-colors flex items-center justify-center gap-1 border-t border-dashed border-slate-200 pt-1"
                >
                  <Plus size={10} /> <span className="hidden sm:inline">Iniciar</span>
                </button>
              )}
            </motion.div>
          )
        })}
      </div>
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