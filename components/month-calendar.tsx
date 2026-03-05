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
          notes: data.notes
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

          return (
            <motion.div 
              key={`${monthIndex}-${day}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              className={`
                min-h-48 rounded-xl border-2 p-4 flex flex-col bg-white shadow-sm hover:shadow-md transition-all duration-300 relative
                ${isToday ? 'ring-2 ring-primary shadow-lg bg-linear-to-br from-primary/10 to-white border-primary/40' : 'border-slate-200 hover:border-primary/30'} 
                ${isFuture ? 'opacity-40 grayscale pointer-events-none' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`
                  font-bold text-sm px-3 py-1.5 rounded-lg shadow-sm transition-colors
                  ${isToday ? 'bg-primary text-white' : 'bg-linear-to-br from-slate-100 to-slate-50 text-slate-700 border border-slate-200'}
                `}>
                  {day}
                </span>
                {isUpdating && <Loader2 size={14} className="animate-spin text-primary" />}
              </div>
              
              <div className="flex-1 space-y-2 mb-3">
                <AnimatePresence>
                  {dayReadings.slice(0, expandedDays.has(day) ? undefined : 1).map((r, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`
                        p-3 rounded-lg border-2 shadow-sm relative flex gap-2.5 transition-all
                        ${r.status === 'lendo' 
                          ? 'bg-linear-to-br from-green-50 to-emerald-50 border-green-300 hover:shadow-md hover:border-green-400' 
                          : 'bg-linear-to-br from-white to-slate-50 border-slate-200 hover:shadow-md hover:border-slate-300'}
                      `}
                    >
                      <div className="w-8 h-12 rounded-md shadow-sm shrink-0 border-2 border-slate-200 overflow-hidden flex items-center justify-center" style={{ backgroundColor: r.cover_url ? 'transparent' : '#e2e8f0' }}>
                        {r.cover_url ? (
                          <img
                            src={r.cover_url}
                            alt="capa"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = '<div class="text-[9px] text-slate-600 font-bold text-center px-1">📚</div>';
                            }}
                          />
                        ) : (
                          <span className="text-lg">📚</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-start gap-1.5 flex-1 min-w-0">
                            <BookMarked size={12} className={r.status === 'lendo' ? 'text-green-600 mt-0.5 shrink-0' : 'text-slate-500 mt-0.5 shrink-0'} strokeWidth={2} />
                            <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2">
                              {r.book_name}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button 
                              onClick={() => openEditDialog(r)} 
                              className="p-1.5 hover:bg-blue-100 rounded-md transition-all hover:scale-110 bg-white border border-blue-200 shadow-sm hover:shadow"
                              title="Editar livro"
                            >
                              <Edit2 size={11} className="text-blue-600" strokeWidth={2.5} />
                            </button>
                            <button 
                              onClick={() => openDeleteDialog(r.book_name)} 
                              className="p-1.5 hover:bg-red-100 rounded-md transition-all hover:scale-110 bg-white border border-red-200 shadow-sm hover:shadow"
                              title="Excluir livro"
                            >
                              <Trash2 size={11} className="text-red-600" strokeWidth={2.5} />
                            </button>
                          </div>
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

                        {r.status === "lendo" && (
                          <Button 
                            size="sm" 
                            className="h-7 w-full text-[10px] mt-2 font-medium bg-linear-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white border-0 shadow-sm hover:shadow-md transition-all" 
                            onClick={() => handleFinishReading(day, r.book_name)}
                          >
                            ✓ Concluir
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {dayReadings.length > 1 && (
                  <button
                    onClick={() => {
                      const newSet = new Set(expandedDays)
                      if (newSet.has(day)) {
                        newSet.delete(day)
                      } else {
                        newSet.add(day)
                      }
                      setExpandedDays(newSet)
                    }}
                    className="w-full py-1.5 text-[10px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-all flex items-center justify-center gap-1"
                  >
                    {expandedDays.has(day) ? (
                      <>
                        <ChevronUp size={12} />
                        Ver menos
                      </>
                    ) : (
                      <>
                        <ChevronDown size={12} />
                        Ver todos ({dayReadings.length})
                      </>
                    )}
                  </button>
                )}
              </div>

              {!isFuture && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-auto pt-3 border-t-2 border-slate-100"
                >
                  <Button 
                    className="h-10 w-full text-sm font-semibold bg-linear-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/95 text-white border-0 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 justify-center" 
                    onClick={() => openBookSearch(day)}
                    disabled={isUpdating}
                  >
                    <Search size={14} strokeWidth={2.5} />
                    Adicionar Livro
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
          notes: bookToEdit.notes || ''
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