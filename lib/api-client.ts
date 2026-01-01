export interface User {
  id: number;
  email: string;
  name: string;
  image?: string;
  theme?: string; 
  literary_goal?: number;
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
  total_pages?: number;
  genre?: string; 
}

export interface Book {
  book_name: string;
  cover_url?: string;
  rating: number;
  start_date?: string;
  end_date?: string;
  total_pages?: number;
  id?: number;
  book_id?: number;
}

export async function loginUser(email: string, name?: string, image?: string): Promise<User> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.toLowerCase(), name, image }),
  });
  if (!response.ok) throw new Error("Erro ao fazer login");
  const data = await response.json();
  return data.user;
}

export async function getReadingData(
  email: string, 
  year: number, 
  isRetrospective: boolean = false,
  signal?: AbortSignal
): Promise<any> {
  let url = `/api/reading-data?email=${encodeURIComponent(email.toLowerCase())}&year=${year}&isRetrospective=${isRetrospective}`;
  
  url += `&t=${Date.now()}`;
  
  const response = await fetch(url, { cache: 'no-store', signal });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao buscar dados");
  }
  return await response.json();
}

export async function updateUserGoal(email: string, goal: number, currentYear: number) {
  const response = await fetch("/api/reading-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      action: "SET_GOAL", 
      email: email.toLowerCase(), 
      goal: goal,
      year: currentYear 
    }),
  });
  if (!response.ok) throw new Error("Erro ao salvar meta");
  return response.json();
}

export async function saveReadingDay(
  email: string, 
  year: number, 
  month: number, 
  day: number,
  startDate: string, 
  endDate: string, 
  bookName: string,
  action: "START_READING" | "FINISH_READING",
  coverUrl?: string,      
  totalPages?: number     
) {
  const response = await fetch("/api/reading-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      email: email.toLowerCase(), 
      year, 
      month, 
      day, 
      startDate, 
      endDate, 
      bookName, 
      action,
      coverUrl,    
      totalPages: Number(totalPages) || 0 
    }),
  });
  if (!response.ok) throw new Error("Erro ao salvar dados");
  return response.json();
}

export async function saveReview(email: string, bookName: string, rating: number, coverUrl: string, totalPages?: number) {
  const response = await fetch("/api/reading-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      email: email.toLowerCase(), 
      bookName, 
      rating, 
      coverUrl, 
      totalPages: Number(totalPages) || 0, 
      action: "UPDATE_REVIEW" 
    }),
  });
  if (!response.ok) throw new Error("Erro ao salvar avaliação");
  return response.json();
}

export async function updateProfile(email: string, data: { image?: string, theme?: string }) {
  const response = await fetch("/api/user/update-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      email: email.toLowerCase(), 
      ...data 
    }),
  });
  if (!response.ok) throw new Error("Erro ao atualizar perfil");
  return response.json();
}

export async function updateProfileImage(email: string, imageUrl: string) {
  return updateProfile(email, { image: imageUrl });
}

export async function deleteFullAccount() {
  const response = await fetch("/api/user/delete-account", {
    method: "DELETE",
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao apagar conta");
  }
  return response.json();
}

export async function searchGoogleBooks(query: string) {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
    const data = await res.json();
    return data.items?.map((item: any) => ({
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors?.join(", "),
      thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:"),
      pageCount: item.volumeInfo.pageCount || 0
    })) || [];
  } catch (e) {
    console.error("Google Books Error:", e);
    return [];
  }
}