export interface User {
  id: number;
  email: string;
  name: string;
  image?: string;
}

export interface ReadingDay {
  id: number;
  day: number;
  month: number;
  year: number;
  start_date: string;
  end_date?: string;
  book_name: string;
  status: string;
  email: string;
  user_id: number;
  rating?: number;
  cover_url?: string;
  display_pages?: number;
}

export interface Book {
  book_name: string;
  cover_url?: string;
  rating: number;
  start_date?: string;
  end_date?: string;
  display_pages?: number;
}

export async function loginUser(email: string, name?: string, image?: string): Promise<User> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, image }),
  });

  if (!response.ok) throw new Error("Erro ao fazer login");
  const data = await response.json();
  return data.user;
}

export async function getReadingData(email: string, year: number, month?: number, signal?: AbortSignal): Promise<ReadingDay[]> {
  let url = `/api/reading-data?email=${encodeURIComponent(email)}&year=${year}`;
  
  if (month !== undefined) {
    url += `&month=${month}`;
  }
  
  url += `&t=${Date.now()}`;

  const response = await fetch(url, {
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao buscar dados de leitura");
  }

  const data = await response.json();
  return data.data || [];
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
  });

  if (!response.ok) throw new Error("Erro ao salvar dados");
  return response.json();
}

export async function saveReview(
  email: string, 
  bookName: string, 
  rating: number, 
  coverUrl: string,
  totalPages?: number
) {
  const response = await fetch("/api/reading-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      email, 
      bookName, 
      rating, 
      coverUrl, 
      totalPages,
      action: "UPDATE_REVIEW" 
    }),
  });

  if (!response.ok) throw new Error("Erro ao salvar avaliação");
  return response.json();
}

export async function updateProfileImage(email: string, imageUrl: string) {
  const response = await fetch("/api/user/update-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, image: imageUrl }),
  });

  if (!response.ok) throw new Error("Erro ao atualizar foto de perfil");
  return response.json();
}

export async function deleteBookRecord(id: string) {
  const response = await fetch(`/api/books/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("Erro ao deletar");
  return response.json();
}

export async function updateBookName(id: string, title: string) {
  const response = await fetch(`/api/books/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) throw new Error("Erro ao atualizar nome");
  return response.json();
}