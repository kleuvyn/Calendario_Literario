export interface User {
  id: number
  email: string
  name: string
  pictureUrl?: string
}

export interface ReadingDay {
  day: number
  startDate: string
  endDate: string
  bookName: string
}

export interface Book {
  book_name: string 
  cover_url?: string
  rating: number
  start_date?: string
  end_date?: string
}

export async function loginUser(email: string, name?: string, pictureUrl?: string): Promise<User> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, pictureUrl }),
  })

  if (!response.ok) throw new Error("Erro ao fazer login")
  const data = await response.json()
  return data.user
}

export async function getReadingData(email: string, year: number, month?: number) {
  let url = `/api/reading-data?email=${encodeURIComponent(email)}&year=${year}`;
  
  if (month !== undefined) {
    url += `&month=${month}`;
  }
  
  url += `&t=${Date.now()}`;

  const response = await fetch(url, {
    cache: 'no-store'
  })

  if (!response.ok) throw new Error("Erro ao buscar dados de leitura")
  const data = await response.json()
  return data.data
}

export async function saveReadingDay(
  email: string,
  year: number,
  month: number,
  day: number,
  startDate: string,
  endDate: string,
  bookName: string,
  action: "START_READING" | "FINISH_READING"
) {
  const response = await fetch("/api/reading-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, year, month, day, startDate, endDate, bookName, action }),
  })

  if (!response.ok) throw new Error("Erro ao salvar dados")
  return response.json()
}

export async function saveReview(email: string, bookName: string, rating: number, coverUrl: string) {
  const response = await fetch("/api/reading-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      email, 
      bookName, 
      rating, 
      coverUrl, 
      action: "UPDATE_REVIEW" 
    }),
  })

  if (!response.ok) throw new Error("Erro ao salvar avaliação")
  return response.json()
}