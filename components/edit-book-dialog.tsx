"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Star, BookOpen, User, Hash, Upload, Image as ImageIcon } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface EditBookDialogProps {
  open: boolean
  onClose: () => void
  bookName: string
  bookData?: {
    author?: string
    pages?: number
    total_pages?: number
    rating?: number
    notes?: string
    cover_url?: string
    startDate?: string
    start_date?: string
    endDate?: string
    end_date?: string
  }
  onSave: (data: {
    newName: string
    author: string
    pages: number
    rating: number
    notes: string
    cover_url?: string
    startDate?: string
    endDate?: string
  }) => void
}

export function EditBookDialog({ open, onClose, bookName, bookData, onSave }: EditBookDialogProps) {
  const [newName, setNewName] = useState(bookName)
  const [author, setAuthor] = useState(bookData?.author || "")
  const [pages, setPages] = useState((bookData?.pages ?? bookData?.total_pages)?.toString() || "")
  const [rating, setRating] = useState(bookData?.rating || 0)
  const [notes, setNotes] = useState(bookData?.notes || "")
  const [coverUrl, setCoverUrl] = useState(bookData?.cover_url || "")
  const [previewCover, setPreviewCover] = useState(bookData?.cover_url || "")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    setNewName(bookName)
    setAuthor(bookData?.author || "")
    setPages((bookData?.pages ?? bookData?.total_pages)?.toString() || "")
    setRating(bookData?.rating ?? 0)
    setNotes(bookData?.notes || "")
    setCoverUrl(bookData?.cover_url || "")
    setPreviewCover(bookData?.cover_url || "")
    setStartDate((bookData?.startDate || bookData?.start_date || "").split('T')[0])
    setEndDate((bookData?.endDate || bookData?.end_date || "").split('T')[0])
  }, [open, bookName, bookData])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setCoverUrl(base64)
        setPreviewCover(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverUrlChange = (value: string) => {
    setCoverUrl(value)
    setPreviewCover(value)
  }

  const handleRemoveCover = () => {
    setCoverUrl("")
    setPreviewCover("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      newName,
      author,
      pages: parseInt(pages) || 0,
      rating,
      notes,
      cover_url: coverUrl || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="text-primary" />
            Editar Livro
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Foto da Capa */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ImageIcon size={16} />
              Foto da Capa do Livro
            </Label>
            
            {/* Área de upload com drag and drop */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                e.currentTarget.classList.add('bg-primary/10')
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-primary/10')
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('bg-primary/10')
                const file = e.dataTransfer.files?.[0]
                if (file && file.type.startsWith('image/')) {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    const base64 = event.target?.result as string
                    setCoverUrl(base64)
                    setPreviewCover(base64)
                  }
                  reader.readAsDataURL(file)
                }
              }}
              className="border-2 border-dashed border-slate-300 rounded-xl p-6 transition-colors hover:border-primary hover:bg-primary/5 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Selecionar foto da capa"
              />
              
              {previewCover ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-36 rounded-lg overflow-hidden border-2 border-slate-200 shadow-md">
                    <img
                      src={previewCover}
                      alt="Capa do livro"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Upload size={14} />
                    Trocar foto
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-24 rounded-lg border-2 border-dashed border-slate-400 flex items-center justify-center bg-slate-50">
                    <ImageIcon size={32} className="text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-700">Clique ou arraste a foto</p>
                    <p className="text-xs text-slate-500">PNG, JPG ou GIF (máx 5MB)</p>
                  </div>
                </div>
              )}
            </div>
            
            {previewCover && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveCover}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                ✕ Remover foto
              </Button>
            )}
          </div>

          {/* Link da Capa */}
          <div className="space-y-2">
            <Label htmlFor="coverUrl" className="flex items-center gap-2">
              <ImageIcon size={16} />
              Link da Capa
            </Label>
            <Input
              id="coverUrl"
              type="text"
              value={coverUrl}
              onChange={(e) => handleCoverUrlChange(e.target.value)}
              placeholder="https://..."
              className="h-11"
            />
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <BookOpen size={16} />
              Título
            </Label>
            <Input
              id="title"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do livro"
              className="h-11"
              required
            />
          </div>

          {/* Autor */}
          <div className="space-y-2">
            <Label htmlFor="author" className="flex items-center gap-2">
              <User size={16} />
              Autor
            </Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Nome do autor"
              className="h-11"
            />
          </div>

          {/* Páginas */}
          <div className="space-y-2">
            <Label htmlFor="pages" className="flex items-center gap-2">
              <Hash size={16} />
              Número de Páginas
            </Label>
            <Input
              id="pages"
              type="number"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="Páginas"
              className="h-11"
              min="0"
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Conclusão</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          {/* Avaliação */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Star size={16} />
              Avaliação
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-all hover:scale-110"
                >
                  <Star
                    size={32}
                    className={`${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-300 hover:text-yellow-200"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="ml-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Impressões</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que você achou deste livro?"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
