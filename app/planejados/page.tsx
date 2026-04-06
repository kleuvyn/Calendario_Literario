"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Loader2, Bookmark, LogOut, Edit3, BarChart3, Sun, Moon, Sparkles, Trash2, Check, Book as BookIcon, Play, Search, X, Upload } from "lucide-react"
import { getReadingData, saveReadingDay, planReading, editReading, deleteReading } from "@/lib/api-client"
import { searchBooks } from "@/lib/google-books"
import { toast } from "sonner"
import Link from "next/link"
import { EditBookDialog } from "@/components/edit-book-dialog"
import { SiteHeader } from "@/components/site-header"

const THEMES = {
  light: {
    primary: '#8C7B6E',
    bg: '#FAFAF5',
    text: '#4A443F',
    card: '#ffffff',
    name: 'Algodão',
    icon: Sun
  },
  dark: {
    primary: '#D1C7BD',
    bg: '#1A1918',
    text: '#F5F5F5',
    card: '#262422',
    name: 'Noite',
    icon: Moon
  },
  purple: {
    primary: '#9B89B3',
    bg: '#F8F7FA',
    text: '#3D3547',
    card: '#ffffff',
    name: 'Brisa',
    icon: Sparkles
  }
}

type ThemeKey = keyof typeof THEMES

export default function PlanejadosPage() {
  const { data: session, status } = useSession()
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('light')
  const [currentYear] = useState(() => new Date().getFullYear())
  
  // Estados do Formulário
  const [newTitle, setNewTitle] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [newCover, setNewCover] = useState('') 
  const [newFormat, setNewFormat] = useState('Físico')
  const [newOwned, setNewOwned] = useState(false)
  const [newPages, setNewPages] = useState<number | ''>('')
  const [newGenre, setNewGenre] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const [isUpdating, setIsUpdating] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [bookToEdit, setBookToEdit] = useState<any>(null)

  // Estados da Busca Google Books
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const coverFileInputRef = useRef<HTMLInputElement>(null)

  const theme = THEMES[activeTheme] || THEMES.light
  const isDark = activeTheme === 'dark'
  const editorial = {
    bg: '#FAFAF5',
    text: '#4A443F',
    accent: '#8C7B6E',
    card: '#FFFFFF',
    border: 'rgba(0, 0, 0, 0.08)',
    subtle: 'rgba(74, 68, 63, 0.45)',
  }

  // Busca no Google Books conforme digita
  useEffect(() => {
    if (newTitle.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const books = await searchBooks(newTitle)
        setSuggestions(books)
        setShowSuggestions(true)
      } catch (err) {
        console.error("Erro na busca", err)
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [newTitle])

  const selectSuggestion = (book: any) => {
    setNewTitle(book.title || '')
    setNewAuthor(book.authors || '')
    setNewCover(book.cover || '')
    setNewPages(book.pages || '')
    setNewGenre(book.categories?.[0] || '')
    setShowSuggestions(false)
    toast.success("Dados importados do Google Books")
  }

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setNewCover(base64)
      toast.success("Capa enviada com sucesso")
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as keyof typeof THEMES
    if (savedTheme && THEMES[savedTheme]) setActiveTheme(savedTheme)
    loadData()
  }, [session?.user?.email])

  const loadData = async () => {
    if (!session?.user?.email) return
    setLoading(true)
    try {
      const response: any = await getReadingData(session.user.email, currentYear, false)
      setBooks(Array.isArray(response) ? response : response?.data || [])
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const plannedBooks = useMemo(() => {
    return books.filter((book) => (book.status || '').toLowerCase().trim() === 'planejado')
  }, [books])

  const handleDelete = async (bookName: string) => {
    if (!session?.user?.email) return
    setLoading(true)
    try {
      await deleteReading(session.user.email, bookName)
      toast.success('Livro removido dos planejados')
      loadData()
    } catch (err) {
      toast.error('Erro ao remover o livro')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartReading = async (book: any) => {
    if (!session?.user?.email) return
    setLoading(true)
    try {
      const now = new Date()
      const dateFormatted = now.toISOString()
      const yearValue = now.getUTCFullYear()
      const monthValue = now.getUTCMonth() + 1
      const dayValue = now.getUTCDate()

      await saveReadingDay(
        session.user.email,
        yearValue,
        monthValue,
        dayValue,
        dateFormatted,
        dateFormatted,
        book.book_name,
        'START_READING',
        book.cover_url || book.cover || '',
        book.author_name || book.author || '',
        book.genre || '',
        Number(book.total_pages || book.pages || 0)
      )
      toast.success('Leitura iniciada!')
      loadData()
    } catch (err) {
      toast.error('Erro ao iniciar leitura')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFinishReading = async (book: any) => {
    if (!session?.user?.email) return
    setLoading(true)
    try {
      const now = new Date()
      const dateFormatted = now.toISOString()
      await saveReadingDay(
        session.user.email,
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        now.getUTCDate(),
        dateFormatted,
        dateFormatted,
        book.book_name,
        'FINISH_READING'
      )
      toast.success('Livro marcado como concluído!')
      loadData()
    } catch (err) {
      toast.error('Erro ao concluir livro')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditBook = (book: any) => {
    setBookToEdit(book)
    setEditDialogOpen(true)
  }

  const handleUpdateBook = async (data: any) => {
    if (!session?.user?.email || !bookToEdit) return
    setLoading(true)
    try {
      await editReading(session.user.email, bookToEdit.book_name, {
        bookName: data.newName,
        author: data.author || bookToEdit.author_name || bookToEdit.author || '',
        pages: Number(data.pages || bookToEdit.total_pages || bookToEdit.pages || 0),
        coverUrl: data.cover_url || bookToEdit.cover_url || bookToEdit.cover || '',
        genre: data.genre || bookToEdit.genre || '',
        format: data.format || bookToEdit.format || 'Físico',
        owned: data.owned !== undefined ? data.owned : (bookToEdit.owned || false),
        status: bookToEdit.status || undefined,
        startDate: bookToEdit.start_date || bookToEdit.startDate || undefined,
        endDate: bookToEdit.end_date || bookToEdit.endDate || undefined,
      })
      toast.success('Dados do livro atualizados!')
      loadData()
    } catch (err) {
      toast.error('Erro ao salvar edição')
      console.error(err)
    } finally {
      setLoading(false)
      setEditDialogOpen(false)
      setBookToEdit(null)
    }
  }

  const handleAddPlanned = async () => {
    if (!newTitle || !session?.user?.email) return toast.error('Título é obrigatório')
    setIsAdding(true)
    try {
      await planReading(
        session.user.email,
        newTitle,
        newAuthor || undefined,
        new Date().toISOString(),
        currentYear,
        new Date().getMonth() + 1,
        newCover,
        Number(newPages) || 0,
        newFormat,
        newOwned,
        undefined,
        newGenre || undefined
      )
      toast.success('Adicionado aos planejados!')
      setNewTitle(''); setNewAuthor(''); setNewCover(''); setNewPages(''); setNewOwned(false); setNewFormat('Físico'); setNewGenre('')
      loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar'
      toast.error(message)
      console.error(err)
    } finally { setIsAdding(false) }
  }

  if (status === 'loading') return <div className="flex min-h-screen items-center justify-center font-serif italic" style={{ backgroundColor: editorial.bg, color: editorial.accent }}><Loader2 className="animate-spin" /></div>

  return (
    <div className="min-h-screen transition-all duration-500 relative font-serif" style={{ background: editorial.bg, color: editorial.text }}>
      <div className="fixed top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ backgroundColor: editorial.accent }} />
      
      <main className="max-w-7xl mx-auto p-4 md:p-10 relative z-10 space-y-8">
        
        {/* HEADER */}
        <SiteHeader 
          activeTheme={activeTheme} 
          setActiveTheme={setActiveTheme as any} 
          title={<h1 className="text-3xl font-serif italic font-black tracking-tighter" style={{ color: editorial.text }}>Meus planejados</h1>}
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/" className="flex-1">
            <Button asChild className="w-full h-14 rounded-full text-white font-serif italic shadow-sm text-lg border border-dashed transition-all hover:opacity-90" style={{ backgroundColor: editorial.accent, borderColor: `${editorial.accent}40` }}>
              <a>Meus livros lidos →</a>
            </Button>
          </Link>
          <Link href="/retrospectiva" className="flex-1">
            <Button asChild variant="outline" className="w-full h-14 rounded-full font-serif italic border border-dashed text-lg shadow-sm transition-all hover:bg-white" style={{ borderColor: editorial.border, color: editorial.text, backgroundColor: editorial.card }}>
              <a><BarChart3 size={18} className="mr-2" style={{ opacity: 0.4 }} /> Retrospectiva</a>
            </Button>
          </Link>
        </div>

        {/* FORMULÁRIO COM BUSCA INTELIGENTE */}
        <Card className="p-6 border border-dashed shadow-sm backdrop-blur-sm rounded-[2.5rem]" style={{ backgroundColor: editorial.card, borderColor: editorial.border }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 relative">
            <div className="relative">
              <label className="text-[10px] font-bold uppercase tracking-widest font-serif opacity-50 ml-2 italic" style={{ color: editorial.subtle }}>Título (busca automática)</label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5" size={16} style={{ opacity: 0.35 }} />
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full border border-dashed p-3 pl-10 rounded-full outline-none text-sm font-serif italic" style={{ backgroundColor: editorial.card, borderColor: editorial.border }} placeholder="Digite para buscar..." />
              </div>
              
              {/* Sugestões do Google Books */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-50 left-0 right-0 mt-2 border border-dashed shadow-2xl rounded-xl overflow-hidden max-h-60 overflow-y-auto" style={{ backgroundColor: editorial.card, borderColor: editorial.border }}>
                    {suggestions.map((s, i) => (
                      <div key={i} onClick={() => selectSuggestion(s)} className="p-3 hover:bg-[#FAFAF5] cursor-pointer flex gap-3 border-b last:border-0" style={{ borderColor: editorial.border }}>
                        <img src={s.cover || 'https://via.placeholder.com/80x120'} className="h-10 w-8 object-cover rounded shadow-sm" alt="" />
                        <div className="min-w-0">
                          <p className="text-sm font-serif italic font-black truncate" style={{ color: editorial.text }}>{s.title}</p>
                          <p className="text-xs" style={{ color: editorial.subtle }}>{s.authors}</p>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setShowSuggestions(false)} className="w-full p-2 text-[10px] uppercase font-bold text-center" style={{ backgroundColor: editorial.bg, color: editorial.subtle }}>Fechar sugestões</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest font-serif opacity-50 ml-2 italic" style={{ color: editorial.subtle }}>Autor</label>
              <input value={newAuthor} onChange={e => setNewAuthor(e.target.value)} className="w-full border border-dashed p-3 rounded-full outline-none text-sm font-serif italic" style={{ backgroundColor: editorial.card, borderColor: editorial.border }} placeholder="Manual ou automático" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest font-serif opacity-50 ml-2 italic" style={{ color: editorial.subtle }}>Gênero</label>
              <input value={newGenre} onChange={e => setNewGenre(e.target.value)} className="w-full border border-dashed p-3 rounded-full outline-none text-sm font-serif italic" style={{ backgroundColor: editorial.card, borderColor: editorial.border }} placeholder="Ex: Fantasia" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest font-serif opacity-50 ml-2 italic" style={{ color: editorial.subtle }}>Link da capa</label>
              <div className="flex gap-2">
                <input
                  value={newCover}
                  onChange={e => setNewCover(e.target.value)}
                  className="w-full border border-dashed p-3 rounded-full outline-none text-sm font-serif italic"
                  style={{ backgroundColor: editorial.card, borderColor: editorial.border }}
                  placeholder="https://..."
                />
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border border-dashed px-4 font-serif italic"
                  style={{ borderColor: editorial.border, color: editorial.text, backgroundColor: editorial.card }}
                  onClick={() => coverFileInputRef.current?.click()}
                >
                  <Upload size={16} className="mr-2" /> Upload
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest font-serif opacity-50 ml-2 italic" style={{ color: editorial.subtle }}>Tipo</label>
              <select value={newFormat} onChange={e => setNewFormat(e.target.value)} className="w-full border border-dashed p-3 rounded-full outline-none text-sm font-serif italic" style={{ backgroundColor: editorial.card, borderColor: editorial.border }}>
                <option>Físico</option><option>E-book</option><option>Audiobook</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest font-serif opacity-50 ml-2 italic" style={{ color: editorial.subtle }}>Páginas</label>
              <input type="number" value={newPages} onChange={e => setNewPages(e.target.value ? Number(e.target.value) : '')} className="w-full border border-dashed p-3 rounded-full outline-none text-sm font-serif italic" style={{ backgroundColor: editorial.card, borderColor: editorial.border }} placeholder="Páginas" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest font-serif opacity-50 ml-2 italic" style={{ color: editorial.subtle }}>Tenho</label>
              <Button variant="outline" onClick={() => setNewOwned(!newOwned)} className={`w-full rounded-full border border-dashed transition-all font-serif italic ${newOwned ? "shadow-sm" : "opacity-70"}`} style={newOwned ? { borderColor: editorial.accent, color: editorial.accent, backgroundColor: `${editorial.accent}10` } : { borderColor: editorial.border, color: editorial.text, backgroundColor: editorial.card }}>
                {newOwned ? <Check size={16} className="mr-2" /> : <BookIcon size={16} className="mr-2" />} {newOwned ? 'Tenho' : 'Não tenho'}
              </Button>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest font-serif opacity-50 ml-2 italic" style={{ color: editorial.subtle }}>Ação</label>
              <Button onClick={handleAddPlanned} disabled={isAdding} className="w-full rounded-full font-serif italic text-lg text-white shadow-sm active:scale-95 transition-transform" style={{ backgroundColor: editorial.accent }}>
                {isAdding ? <Loader2 className="animate-spin" /> : 'Salvar no Planejamento'}
              </Button>
            </div>
          </div>
        </Card>

        {/* LISTAGEM DE PLANEJADOS */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {plannedBooks.map((book) => (
              <motion.div key={book.id || book.book_name} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="p-5 border border-dashed shadow-sm group hover:shadow-md transition-all rounded-[2rem]" style={{ borderColor: editorial.border, backgroundColor: editorial.card }}>
                  <div className="flex gap-4">
                    <img src={book.cover_url || book.cover || 'https://via.placeholder.com/150'} className="h-40 w-28 rounded-lg object-cover shadow-sm" alt="" />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-serif italic font-black text-lg leading-tight line-clamp-2" style={{ color: editorial.text }}>{book.book_name}</h3>
                        <p className="text-xs mb-3 font-serif italic" style={{ color: editorial.subtle }}>{book.author_name || 'Autor desconhecido'}</p>
                        <div className="flex gap-1">
                          <span className="text-[9px] px-2 py-1 rounded-full border border-dashed font-bold uppercase tracking-widest italic" style={{ borderColor: editorial.border, color: editorial.accent, backgroundColor: `${editorial.accent}10` }}>{book.format || 'Físico'}</span>
                          <span
                            className="text-[9px] px-2 py-1 rounded-full border border-dashed font-bold uppercase tracking-widest italic"
                            style={book.owned
                              ? { color: editorial.accent, borderColor: editorial.border, backgroundColor: editorial.bg }
                              : { color: editorial.subtle, borderColor: editorial.border, backgroundColor: editorial.card }}
                          >
                            {book.owned ? 'Tenho' : 'Não tenho'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <Button
                          size="sm"
                          className="font-serif italic h-8 rounded-full shadow-sm border border-dashed"
                          style={{
                            backgroundColor: '#EAF4EC',
                            borderColor: '#BFDCC6',
                            color: '#4E6B56'
                          }}
                          onClick={() => handleStartReading(book)}
                        >
                          <Play size={14} className="mr-1" />Iniciar
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 rounded-full border border-dashed font-serif italic" style={{ borderColor: editorial.border, color: editorial.text, backgroundColor: editorial.card }} onClick={() => handleFinishReading(book)}><Check size={14} className="mr-1" />Concluir</Button>
                        <Button size="sm" variant="outline" className="h-8 rounded-full border border-dashed font-serif italic" style={{ borderColor: editorial.border, color: editorial.text, backgroundColor: editorial.card }} onClick={() => handleEditBook(book)}><Edit3 size={14} className="mr-1" />Editar</Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-full font-serif italic border border-dashed"
                          style={{
                            backgroundColor: '#F8ECEC',
                            borderColor: '#E7C5C5',
                            color: '#8A5A5A'
                          }}
                          onClick={() => handleDelete(book.book_name)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <EditBookDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          bookName={bookToEdit?.book_name || ''}
          bookData={{
            author: bookToEdit?.author_name || bookToEdit?.author || '',
            pages: bookToEdit?.total_pages || bookToEdit?.pages || 0,
            rating: bookToEdit?.rating || 0,
            notes: bookToEdit?.notes || '',            genre: bookToEdit?.genre || '',
            format: bookToEdit?.format || 'Físico',
            owned: bookToEdit?.owned || false,            cover_url: bookToEdit?.cover_url || bookToEdit?.cover || ''
          }}
          onSave={handleUpdateBook}
        />
      </main>
    </div>
  )
}