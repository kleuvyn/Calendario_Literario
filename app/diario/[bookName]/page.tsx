"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookOpen, Calendar, Star } from "lucide-react"
import { getReadingData } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { OptimizedBookCover } from "@/components/optimized-book-cover"

const getProxyUrl = (url: string) => {
  if (!url) return ""
  if (url.includes("googleusercontent.com") || url.includes("books.google.com")) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(url.replace("http://", "https://"))}`
  }
  return url
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  } catch {
    return dateString
  }
}

const renderStars = (rating?: number) => {
  const value = Number(rating) || 0
  return Array.from({ length: 5 }).map((_, index) => (
    <Star
      key={index}
      size={18}
      className={index < value ? "text-amber-400 fill-amber-400" : "text-slate-300"}
    />
  ))
}

export default function BookDiaryPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [book, setBook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const rawBookName = Array.isArray(params?.bookName) ? params.bookName[0] : (params?.bookName || "")
  const bookName = decodeURIComponent(rawBookName)
  const yearParam = searchParams?.get("year")
  const currentYear = yearParam ? Number(yearParam) : new Date().getFullYear()

  useEffect(() => {
    if (status !== "authenticated") return
    if (!session?.user?.email) return
    if (!bookName) return

    setLoading(true)
    setError(null)

    getReadingData(session.user.email, currentYear, true)
      .then((data) => {
        const books = Array.isArray(data) ? data : data?.data || []
        const found = books.find((item: any) => {
          return String(item.book_name || "").toLowerCase() === String(bookName || "").toLowerCase()
        })
        if (!found) {
          setError("Não foi possível encontrar esse livro no diário. Tente voltar e abrir por outro book.")
          setBook(null)
        } else {
          setBook(found)
        }
      })
      .catch((err) => {
        console.error(err)
        setError("Erro ao carregar o diário do livro.")
      })
      .finally(() => setLoading(false))
  }, [status, session, bookName, currentYear])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="rounded-3xl border p-10 shadow-xl bg-white text-center">
          <p className="text-base font-semibold">Carregando diário do livro...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Diário de leitura</h1>
            <p className="text-sm text-slate-500 mt-1">Registros do livro escolhido, suas notas e percepções.</p>
          </div>
          <Link href="/retrospectiva" className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <ArrowLeft size={16} /> Voltar
          </Link>
        </div>

        {!book && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="text-lg font-semibold text-rose-700">Livro não encontrado</p>
            <p className="mt-2 text-sm text-rose-600">Verifique se o livro já está registrado e tente novamente.</p>
            <div className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              {bookName}
            </div>
          </div>
        )}

        {book && (
          <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <div className="rounded-[36px] overflow-hidden border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[2/3] bg-slate-100">
                <OptimizedBookCover src={getProxyUrl(book.cover_url)} alt={book.book_name} fill className="object-cover" />
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Livro</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{book.book_name}</h2>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Autora / Autor</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{book.author_name || book.author || 'Não informado'}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Status</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{String(book.status || 'planejado').replace('planejado', 'Planejado').replace('lendo', 'Lendo').replace('lido', 'Lido')}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Minhas notas</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{book.review || 'Ainda sem percepções registradas.'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Minha classificação</p>
                    <div className="mt-3 flex items-center gap-2">{renderStars(book.rating)}</div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">{book.rating ? `${book.rating}/5` : 'Sem nota'}</div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-600">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Páginas</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{book.total_pages || '—'}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Gênero</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{book.genre || 'Sem gênero'}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Início</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{formatDate(book.start_date)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Conclusão</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{formatDate(book.end_date)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 text-slate-900">
                  <BookOpen size={18} />
                  <p className="text-sm font-semibold">Percepção pessoal</p>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-700">
                  {book.review || 'Use este espaço como seu diário: o que você achou, o que marcou, e qual foi a sua sensação ao ler.'}
                </p>
              </div>

              <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 text-slate-900">
                  <Calendar size={18} />
                  <p className="text-sm font-semibold">Resumo rápido</p>
                </div>
                <div className="mt-4 grid gap-4 text-sm text-slate-600">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Nome</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{book.book_name}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Autor(a)</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{book.author_name || book.author || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
