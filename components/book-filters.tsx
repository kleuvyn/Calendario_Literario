"use client"

import { useState } from "react"
import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface BookFiltersProps {
  onFilterChangeAction: (filters: FilterState) => void
  availableGenres: string[]
}

export interface FilterState {
  search: string
  genres: string[]
  ratingMin: number | null
  sortBy: 'date' | 'rating' | 'pages' | 'title'
}

export function BookFilters({ onFilterChangeAction, availableGenres }: BookFiltersProps) {
  const [search, setSearch] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [ratingMin, setRatingMin] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<FilterState['sortBy']>('date')
  const [isOpen, setIsOpen] = useState(false)

  const applyFilters = () => {
    onFilterChangeAction({
      search: search.trim(),
      genres: selectedGenres,
      ratingMin,
      sortBy
    })
  }

  const clearFilters = () => {
    setSearch("")
    setSelectedGenres([])
    setRatingMin(null)
    setSortBy('date')
    onFilterChangeAction({
      search: "",
      genres: [],
      ratingMin: null,
      sortBy: 'date'
    })
  }

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    )
  }

  const hasActiveFilters = search || selectedGenres.length > 0 || ratingMin !== null || sortBy !== 'date'
  const editorial = {
    bg: '#FAFAF5',
    text: '#4A443F',
    accent: '#8C7B6E',
    border: 'rgba(0, 0, 0, 0.08)',
    subtle: 'rgba(74, 68, 63, 0.45)',
  }

  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: editorial.accent, opacity: 0.4 }} />
        <Input
          type="text"
          placeholder="buscar por titulo ou autor..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            onFilterChangeAction({
              search: e.target.value.trim(),
              genres: selectedGenres,
              ratingMin,
              sortBy
            })
          }}
          className="pl-10 pr-4 h-10 rounded-[2rem] border border-dashed font-serif italic"
          style={{ backgroundColor: '#FFFFFF', borderColor: editorial.border, color: editorial.text }}
        />
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 relative rounded-[2rem] border-dashed font-serif italic" style={{ borderColor: editorial.border, color: editorial.text, backgroundColor: '#FFFFFF' }}>
            <Filter className="h-4 w-4" style={{ opacity: 0.4 }} />
            Filtros
            {hasActiveFilters && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]" style={{ backgroundColor: editorial.accent, color: '#FFFFFF' }}>
                {(selectedGenres.length > 0 ? 1 : 0) + (ratingMin !== null ? 1 : 0) + (sortBy !== 'date' ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 border border-dashed shadow-xl rounded-[2rem]" align="end" style={{ backgroundColor: editorial.bg, borderColor: editorial.border }}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-serif italic font-black tracking-tighter text-sm" style={{ color: editorial.text }}>Filtros avançados</h4>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="h-7 text-xs rounded-[2rem] font-serif italic"
                  style={{ color: editorial.accent }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold tracking-widest uppercase mb-2 block" style={{ color: editorial.subtle }}>
                ordenar por
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={sortBy === 'date' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSortBy('date')
                    onFilterChangeAction({ search, genres: selectedGenres, ratingMin, sortBy: 'date' })
                  }}
                  className="text-xs rounded-[2rem] border-dashed font-serif italic"
                  style={sortBy === 'date' ? { backgroundColor: editorial.accent, color: '#FFFFFF', borderColor: editorial.accent } : { borderColor: editorial.border, color: editorial.text, backgroundColor: '#FFFFFF' }}
                >
                  Data
                </Button>
                <Button
                  variant={sortBy === 'rating' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSortBy('rating')
                    onFilterChangeAction({ search, genres: selectedGenres, ratingMin, sortBy: 'rating' })
                  }}
                  className="text-xs rounded-[2rem] border-dashed font-serif italic"
                  style={sortBy === 'rating' ? { backgroundColor: editorial.accent, color: '#FFFFFF', borderColor: editorial.accent } : { borderColor: editorial.border, color: editorial.text, backgroundColor: '#FFFFFF' }}
                >
                  Avaliação
                </Button>
                <Button
                  variant={sortBy === 'pages' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSortBy('pages')
                    onFilterChangeAction({ search, genres: selectedGenres, ratingMin, sortBy: 'pages' })
                  }}
                  className="text-xs rounded-[2rem] border-dashed font-serif italic"
                  style={sortBy === 'pages' ? { backgroundColor: editorial.accent, color: '#FFFFFF', borderColor: editorial.accent } : { borderColor: editorial.border, color: editorial.text, backgroundColor: '#FFFFFF' }}
                >
                  Páginas
                </Button>
                <Button
                  variant={sortBy === 'title' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSortBy('title')
                    onFilterChangeAction({ search, genres: selectedGenres, ratingMin, sortBy: 'title' })
                  }}
                  className="text-xs rounded-[2rem] border-dashed font-serif italic"
                  style={sortBy === 'title' ? { backgroundColor: editorial.accent, color: '#FFFFFF', borderColor: editorial.accent } : { borderColor: editorial.border, color: editorial.text, backgroundColor: '#FFFFFF' }}
                >
                  Título
                </Button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold tracking-widest uppercase mb-2 block" style={{ color: editorial.subtle }}>
                Avaliação mínima
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <Button
                    key={rating}
                    variant={ratingMin === rating ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const newRating = ratingMin === rating ? null : rating
                      setRatingMin(newRating)
                      onFilterChangeAction({ search, genres: selectedGenres, ratingMin: newRating, sortBy })
                    }}
                    className="h-8 w-8 p-0 rounded-full border-dashed"
                    style={ratingMin === rating ? { backgroundColor: editorial.accent, color: '#FFFFFF', borderColor: editorial.accent } : { borderColor: editorial.border, color: editorial.text, backgroundColor: '#FFFFFF' }}
                  >
                    {rating}⭐
                  </Button>
                ))}
              </div>
            </div>

            {availableGenres.length > 0 && (
              <div>
                <label className="text-[10px] font-bold tracking-widest uppercase mb-2 block" style={{ color: editorial.subtle }}>
                  Gêneros
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {availableGenres.map(genre => (
                    <Badge
                      key={genre}
                      variant={selectedGenres.includes(genre) ? 'default' : 'outline'}
                      className="cursor-pointer border border-dashed rounded-[2rem] font-serif italic"
                      style={selectedGenres.includes(genre)
                        ? { backgroundColor: editorial.accent, color: '#FFFFFF', borderColor: editorial.accent }
                        : { backgroundColor: '#FFFFFF', color: editorial.text, borderColor: editorial.border }}
                      onClick={() => {
                        toggleGenre(genre)
                        const newGenres = selectedGenres.includes(genre)
                          ? selectedGenres.filter(g => g !== genre)
                          : [...selectedGenres, genre]
                        onFilterChangeAction({ search, genres: newGenres, ratingMin, sortBy })
                      }}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => setIsOpen(false)} className="w-full rounded-[2rem] border border-dashed font-serif italic" size="sm" style={{ backgroundColor: editorial.accent, borderColor: editorial.accent, color: '#FFFFFF' }}>
              Aplicar filtros
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters}
          className="gap-1 rounded-[2rem] font-serif italic"
          style={{ color: editorial.accent }}
        >
          <X className="h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  )
}
