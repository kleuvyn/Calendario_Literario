"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, Edit2, BookMarked, Calendar, CheckCircle2, XCircle, Star, Search, ChevronUp, ChevronDown } from "lucide-react"
import { getReadingData, saveReadingDay } from "@/lib/api-client"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { BookSearchDialog } from "@/components/book-search-dialog"
import { EditBookDialog } from "@/components/edit-book-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import type { BookSearchResult } from "@/lib/google-books"

export function MonthCalendar({ month, days, year, userEmail, monthIndex }: any) {
  const [readings, setReadings] = useState<any[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [focusedDay, setFocusedDay] = useState<number | null>(null)
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())
  
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bookToEdit, setBookToEdit] = useState<any>(null)
  const [bookToDelete, setBookToDelete] = useState<string>("")

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
      toast.error("Erro ao carregar dados", { 
        description: "Não foi possível carregar suas leituras." 
      })
    }
  }

  useEffect(() => {
    loadData()
  }, [userEmail, monthIndex, year])

  function openBookSearch(day: number) {
    setSelectedDay(day)
    setSearchDialogOpen(true)
  }

  async function handleSelectBook(book: BookSearchResult) {
    if (!selectedDay || !userEmail) return
    
    setIsUpdating(true)
    const dateFormatted = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}T12:00:00Z`
    
    try {
      const response = await saveReadingDay(
        userEmail, year, monthIndex + 1, selectedDay, 
        dateFormatted, dateFormatted, book.title, "START_READING",
        book.cover, book.authors, book.pages
      )
      
      if (!response || response.error) {
        throw new Error(response?.error || "Erro ao salvar")
      }
      
      setSelectedDay(null)
      await loadData()
      
      toast.success("Leitura iniciada! 📚", { 
        description: `Você começou a ler "${book.title}"`,
        icon: <BookMarked size={16} />
      })
    } catch (err) { 
      console.error("Erro ao iniciar leitura:", err)
      toast.error("Erro ao salvar", { 
        description: "Não foi possível salvar a leitura.",
        icon: <XCircle size={16} />
      })
    } finally { setIsUpdating(false) }
  }

  function openEditDialog(reading: any) {
    setBookToEdit(reading)
    setEditDialogOpen(true)
  }

  async function handleSaveEdit(data: any) {
    if (!bookToEdit || !userEmail) return
    
    setIsUpdating(true)
    try {
      const response = await fetch("/api/reading-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "EDIT_READING", 
          email: userEmail, 
          bookName: data.newName, 
          oldBookName: bookToEdit.book_name,
          author: data.author,
          pages: data.pages,
          rating: data.rating,
          notes: data.notes,
          cover_url: data.cover_url
        })
      })
      
      if (!response.ok) {
        throw new Error("Erro na resposta da API")
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error("Erro ao salvar")
      }
      
      await loadData()
      toast.success("Livro atualizado!", { 
        description: `"${data.newName}" foi atualizado com sucesso`,
        icon: <CheckCircle2 size={16} />
      })
      setBookToEdit(null)
    } catch (err) { 
      console.error("Erro ao atualizar livro:", err)
      toast.error("Erro ao atualizar", { 
        description: "Não foi possível salvar as alterações.",
        icon: <XCircle size={16} />
      })
    } finally { setIsUpdating(false) }
  }

  function openDeleteDialog(bookName: string) {
    setBookToDelete(bookName)
    setDeleteDialogOpen(true)
  }

  async function handleConfirmDelete() {
    if (!bookToDelete || !userEmail) return
    
    setIsUpdating(true)
    try {
      const response = await fetch("/api/reading-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_READING", email: userEmail, bookName: bookToDelete })
      })
      
      if (!response.ok) {
        throw new Error("Erro na resposta da API")
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error("Erro ao deletar")
      }
      
      await loadData()
      toast.success("Livro excluído!", { 
        description: `"${bookToDelete}" foi removido da sua estante.`,
        icon: <CheckCircle2 size={16} />
      })
      setDeleteDialogOpen(false)
      setBookToDelete("")
    } catch (err) {
      console.error("Erro ao excluir livro:", err)
      toast.error("Erro ao excluir", { 
        description: "Não foi possível excluir o livro.",
        icon: <XCircle size={16} />
      })
    } finally { setIsUpdating(false) }
  }

  async function handleFinishReading(day: number, bookName: string) {
    if (isUpdating || !userEmail) return
    
    const book = readings.find(r => r.book_name === bookName && r.status === 'lendo')
    
    setIsUpdating(true)
    const dateFormatted = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00Z`
    
    try {
      const response = await saveReadingDay(
        userEmail, year, monthIndex + 1, day, 
        dateFormatted, dateFormatted, bookName, "FINISH_READING"
      )
      
      if (!response || response.error) {
        throw new Error(response?.error || "Erro ao salvar")
      }
      
      await loadData()
      
      let daysReading = 0
      if (book?.start_date) {
        const startDate = new Date(book.start_date)
        const endDate = new Date(dateFormatted)
        daysReading = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      }
      
      toast.success("Leitura concluída! 🎉", { 
        description: daysReading > 0 
          ? `Parabéns! Você leu "${bookName}" em ${daysReading} ${daysReading === 1 ? 'dia' : 'dias'}!`
          : `Parabéns por terminar "${bookName}"!`,
        icon: <CheckCircle2 size={16} />
      })
    } catch (err) { 
      console.error("Erro ao concluir leitura:", err)
      toast.error("Erro ao salvar", { 
        description: "Não foi possível concluir a leitura.",
        icon: <XCircle size={16} />
      })
    } finally { setIsUpdating(false) }
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 relative"
      >
        <div className="inline-flex items-center gap-4 bg-linear-to-br from-white to-slate-50 px-10 py-5 rounded-2xl border-2 border-slate-200 shadow-md hover:shadow-lg transition-all">
          <Calendar className="text-primary" size={28} strokeWidth={2} />
          <h2 className="text-5xl font-semibold tracking-tight text-slate-800">{month}</h2>
          <Calendar className="text-primary" size={28} strokeWidth={2} />
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 md:gap-4">
        {Array.from({ length: days || 31 }, (_, i) => i + 1).map((day, index) => {
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

          // Calcular stats do dia
          const completedBooks = dayReadings.filter(r => r.status !== 'lendo').length
          const totalPagesDay = dayReadings.reduce((sum, r) => sum + (Number(r.total_pages) || 0), 0)
          const hasMultipleBooks = dayReadings.length > 1
          const isHighActivity = totalPagesDay > 300

          return (
            <motion.div 
              key={`${monthIndex}-${day}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              whileHover={{ scale: 1.05, y: -4 }}
              onClick={() => {
                if (!isFuture && dayReadings.length > 0) {
                  const newSet = new Set(expandedDays)
                  if (newSet.has(day)) {
                    newSet.delete(day)
                  } else {
                    newSet.add(day)
                  }
                  setExpandedDays(newSet)
                }
              }}
              className={`calendar-day-card 
                h-40 rounded-3xl p-4 flex flex-col bg-gradient-to-br shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group ${dayReadings.length > 0 ? 'cursor-pointer' : ''}
                ${isToday 
                  ? 'from-primary/30 via-card to-primary/20 shadow-lg shadow-primary/30 ring-1 ring-primary hover:shadow-2xl hover:shadow-primary/40 dark:from-primary/40 dark:via-card dark:to-primary/30' 
                  : dayReadings.length > 0
                  ? 'from-card via-card to-card/80 shadow-md shadow-primary/20 dark:from-card dark:shadow-primary/30'
                  : 'from-card via-background to-card/60 shadow-sm shadow-primary/15 dark:from-muted/50 dark:to-background dark:shadow-primary/25'
                } 
                ${isFuture ? 'opacity-30 grayscale pointer-events-none' : ''}
                ${expandedDays.has(day) ? 'min-h-96 h-auto ring-2 ring-primary/50 shadow-2xl shadow-primary/40' : ''}
              `}
              style={{ border: '2px solid var(--primary)' }}
            >
              {/* Efeito de fundo */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-300"></div>
              
              {/* Header do dia com stats */}
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className={`calendar-day-card 
                  font-black text-lg px-3 py-1 rounded-lg shadow-sm transition-all transform
                  ${isToday 
                    ? 'bg-primary text-primary-foreground scale-110 shadow-md shadow-primary/40 hover:scale-125' 
                    : 'bg-muted text-foreground border border-border hover:bg-muted/80'}
                `}>
                  {day}
                </span>
                
                {/* Badges de atividade com efeitos */}
                <div className="flex gap-2 flex-wrap justify-end">
                </div>
              </div>
              
              {/* Stats resumidas - sempre visível */}
              {dayReadings.length > 0 && (
                <div className="flex gap-2 mb-2 text-xs relative z-10 cursor-pointer">
                  <span className="text-[9px] font-bold text-foreground/70">{dayReadings.length} livros</span>
                  <span className="text-[9px] font-bold text-foreground/70">{totalPagesDay}p</span>
                </div>
              )}
              
              {/* Lista de livros do dia - só mostra quando expandido */}
              {expandedDays.has(day) && (
                <AnimatePresence>
                  {dayReadings.map((r, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={`calendar-day-card 
                        p-3 rounded-xl border-2 shadow-md relative flex gap-2.5 transition-all group overflow-hidden
                        ${r.status === 'lendo' 
                          ? 'bg-gradient-to-br from-green-100 via-emerald-50 to-white border-green-400/70 hover:shadow-lg hover:border-green-500 shadow-green-200/50' 
                          : r.rating === 5
                          ? 'bg-gradient-to-br from-amber-100 via-yellow-50 to-white border-amber-400/70 hover:shadow-lg hover:border-amber-500 shadow-amber-200/50'
                          : 'bg-gradient-to-br from-blue-50 via-white to-slate-50 border-blue-300/50 hover:shadow-lg hover:border-blue-400'}
                      `}
                    >
                      {/* Efeito de fundo */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="w-8 h-12 rounded-md shadow-md shrink-0 border-2 border-slate-300 overflow-hidden flex items-center justify-center relative z-10 group-hover:shadow-lg transition-all" style={{ backgroundColor: r.cover_url ? 'transparent' : '#e2e8f0' }}>
                        {r.cover_url ? (
                          <img
                            src={r.cover_url}
                            alt="capa"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = '<div class="text-lg">📚</div>';
                            }}
                          />
                        ) : (
                          <span className="text-lg">📚</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5 relative z-10">
                        <div className="flex items-start gap-1.5 flex-1 min-w-0">
                          <BookMarked size={12} className={r.status === 'lendo' ? 'text-green-600 mt-0.5 shrink-0 animate-bounce' : 'text-slate-600 mt-0.5 shrink-0'} strokeWidth={2} />
                          <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-2 cursor-help" title={r.book_name}>
                            {r.book_name}
                          </p>
                        </div>

                        {r.status !== 'lendo' && r.rating && (
                          <div className="flex items-center gap-1 px-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={10} 
                                className={i < r.rating ? 'text-amber-400' : 'text-slate-300'}
                                fill={i < r.rating ? 'currentColor' : 'none'}
                                strokeWidth={1.5}
                              />
                            ))}
                          </div>
                        )}

                        {r.status !== 'lendo' && r.start_date && r.end_date && (
                          <div className="flex items-center gap-1 px-1">
                            <Calendar size={9} className="text-slate-400" strokeWidth={2} />
                            <span className="text-[9px] text-slate-500 font-medium">
                              {(() => {
                                const start = new Date(r.start_date)
                                const end = new Date(r.end_date)
                                const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                                return `${days} ${days === 1 ? 'dia' : 'dias'}`
                              })()}
                            </span>
                          </div>
                        )}

                        {/* Botões embaixo */}
                        <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-slate-300/50 relative z-10">
                          {/* Editar e Apagar no topo */}
                          <div className="flex gap-1">
                            <button 
                              onClick={() => openEditDialog(r)} 
                              className="flex-1 py-1 px-2 bg-muted hover:bg-muted/80 text-foreground rounded-md transition-all font-bold text-[7px] shadow-sm border border-border"
                              title="Editar livro"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => openDeleteDialog(r.book_name)} 
                              className="flex-1 py-1 px-2 bg-muted hover:bg-muted/80 text-foreground rounded-md transition-all font-bold text-[7px] shadow-sm border border-border"
                              title="Excluir livro"
                            >
                              🗑️
                            </button>
                          </div>

                          {/* Concluir embaixo (só aparece se está lendo) */}
                          {r.status === "lendo" && (
                            <button 
                              onClick={() => handleFinishReading(day, r.book_name)} 
                              className="w-full py-1.5 px-2 bg-muted hover:bg-muted/80 text-foreground rounded-md transition-all font-bold text-[7px] shadow-sm border border-border"
                              title="Concluir leitura"
                            >
                              ✓ Concluir
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tooltip ao hover com o título completo */}
                      <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-foreground text-card px-4 py-2 rounded-lg max-w-xs z-50 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none dark:bg-card dark:text-foreground">
                        <p className="text-sm font-bold text-center">{r.book_name}</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground dark:border-t-card"></div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              
              {/* Botão adicionar livro - sempre visível */}
              {!isFuture && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-1 mt-auto"
                >
                  <Button 
                    className="h-7 w-full text-[7px] font-bold bg-muted hover:bg-muted/80 text-foreground border border-border rounded-md shadow-sm transition-all flex items-center gap-1 justify-center" 
                    onClick={(e) => {
                      e.stopPropagation()
                      openBookSearch(day)
                    }}
                    disabled={isUpdating}
                  >
                    ➕ Livro
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      <BookSearchDialog 
        open={searchDialogOpen}
        onClose={() => {
          setSearchDialogOpen(false)
          setSelectedDay(null)
        }}
        onSelectBook={handleSelectBook}
      />

      <EditBookDialog 
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          setBookToEdit(null)
        }}
        onSave={handleSaveEdit}
        bookName={bookToEdit ? bookToEdit.book_name : ''}
        bookData={bookToEdit ? {
          author: bookToEdit.author_name || '',
          pages: bookToEdit.total_pages || 0,
          rating: bookToEdit.rating || 0,
          notes: bookToEdit.notes || '',
          cover_url: bookToEdit.cover_url || ''
        } : undefined}
      />

      <DeleteConfirmDialog 
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setBookToDelete("")
        }}
        onConfirm={handleConfirmDelete}
        bookName={bookToDelete}
        isLoading={isUpdating}
      />
    </div>
  )
}