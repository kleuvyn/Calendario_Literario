"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, BookOpen, User, FileText, Upload, ImageIcon } from "lucide-react"
import { searchBooks, type BookSearchResult } from "@/lib/google-books"

interface BookSearchDialogProps {
  open: boolean
  onClose: () => void
  onSelectBook: (book: BookSearchResult & { cover?: string }) => void
}

export function BookSearchDialog({ open, onClose, onSelectBook }: BookSearchDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<BookSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedCover, setSelectedCover] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!query) {
      setResults([])
      setSearchError(null)
      return
    }

    if (query.length < 3) {
      setResults([])
      setSearchError(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      setSearchError(null)
      try {
        const books = await searchBooks(query)
        setResults(books)
      } catch (error) {
        console.error("Erro na busca de livros:", error)
        setResults([])
        setSearchError("Não foi possível buscar livros. Tente novamente mais tarde.")
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSelect = (book: BookSearchResult) => {
    onSelectBook({
      ...book,
      cover: selectedCover || book.cover,
    })
    onClose()
    setQuery("")
    setResults([])
    setSelectedCover("")
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setSelectedCover(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleManualEntry = () => {
    onSelectBook({
      title: query,
      authors: "",
      cover: selectedCover || "",
      pages: 0,
      isbn: "",
      description: "",
      categories: [],
    })
    onClose()
    setQuery("")
    setSelectedCover("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="text-primary" />
            Buscar Livro
          </DialogTitle>
          <DialogDescription>
            Digite o título do livro e escolha uma opção da busca
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Digite o nome do livro, autor ou ISBN..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-primary" />
            )}
          </div>

          {/* Upload de capa local (opcional) */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer mb-2">
              <ImageIcon size={14} className="text-primary" />
              Capa do livro (opcional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedCover ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-16 rounded border border-slate-300 overflow-hidden">
                  <img
                    src={selectedCover}
                    alt="Capa selecionada"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2 flex-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 gap-1"
                  >
                    <Upload size={12} />
                    Trocar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedCover("")}
                    className="text-rose-700 hover:text-rose-800 hover:bg-rose-50"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2"
              >
                <Upload size={14} />
                Selecionar imagem
              </Button>
            )}
          </div>

          {/* Resultados */}
          <ScrollArea className="h-100 pr-4">
            {searchError && (
              <div className="text-center py-12 space-y-4">
                <p className="text-rose-700">{searchError}</p>
              </div>
            )}
            {results.length === 0 && query.length >= 3 && !isLoading && !searchError && (
              <div className="text-center py-12 space-y-4">
                <p className="text-muted-foreground">Nenhum livro encontrado</p>
                <Button
                  variant="outline"
                  onClick={handleManualEntry}
                  className="gap-2"
                >
                  <FileText size={16} />
                  Adicionar "{query}" manualmente
                </Button>
              </div>
            )}
            {results.length === 0 && query.length > 0 && query.length < 3 && !isLoading && !searchError && (
              <div className="text-center py-12 space-y-4">
                <p className="text-muted-foreground">Digite pelo menos 3 caracteres para iniciar a busca.</p>
              </div>
            )}

            <div className="space-y-3">
              {results.map((book, index) => (
                <div
                  key={index}
                  onClick={() => handleSelect(book)}
                  className="flex gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group"
                >
                  {/* Capa */}
                  <div className="w-16 h-24 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 shadow-md">
                    {book.cover ? (
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="text-slate-400" size={24} />
                    )}
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base line-clamp-2 group-hover:text-primary transition-colors">
                      {book.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <User size={14} />
                      <span className="line-clamp-1">{book.authors}</span>
                    </div>
                    {book.pages > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {book.pages} páginas
                      </p>
                    )}
                    {book.categories.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {book.categories.slice(0, 2).map((cat, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Botão adicionar manualmente */}
          {query && results.length > 0 && (
            <Button
              variant="ghost"
              onClick={handleManualEntry}
              className="w-full gap-2"
            >
              <FileText size={16} />
              Não encontrou? Adicionar "{query}" manualmente
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
