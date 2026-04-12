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

const readingDataCache = new Map<string, { expires: number; data: any }>();
const READING_DATA_CACHE_TTL = 30_000;

function getReadingDataCacheKey(email: string, year: number, isRetrospective: boolean, month?: number, includeAllYears?: boolean) {
  return `readingData:${email.toLowerCase()}:${year}:${isRetrospective}:${month ?? 0}:${includeAllYears ? 1 : 0}`;
}

export function invalidateReadingDataCache(email: string, year?: number, month?: number) {
  const normalizedEmail = email.toLowerCase();
  for (const key of Array.from(readingDataCache.keys())) {
    if (!key.startsWith(`readingData:${normalizedEmail}:`)) continue;
    if (year !== undefined && !key.includes(`:${year}:`)) continue;
    if (month !== undefined && !key.includes(`:${month}:`)) continue;
    readingDataCache.delete(key);
  }
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
  signal?: AbortSignal,
  month?: number,
  includeAllYears: boolean = false
): Promise<any> {
  const cacheKey = getReadingDataCacheKey(email, year, isRetrospective, month, includeAllYears);
  const cached = readingDataCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  let url = `/api/reading-data?email=${encodeURIComponent(email.toLowerCase())}&year=${year}&isRetrospective=${isRetrospective}&includeAllYears=${includeAllYears}`;
  if (month) url += `&month=${month}`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao buscar dados");
  }

  const data = await response.json();
  readingDataCache.set(cacheKey, { expires: Date.now() + READING_DATA_CACHE_TTL, data });
  return data;
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
  invalidateReadingDataCache(email, currentYear);
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
  author?: string,
  genre?: string,
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
      author,
      genre,
      action,
      coverUrl,    
      totalPages: Number(totalPages) || 0 
    }),
  });
  if (!response.ok) throw new Error("Erro ao salvar dados");
  invalidateReadingDataCache(email, year, month);
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
  invalidateReadingDataCache(email, undefined, undefined);
  return response.json();
}

export async function editReading(
  email: string,
  oldBookName: string,
  updates: {
    bookName?: string,
    author?: string | null,
    pages?: number | null,
    rating?: number | null,
    notes?: string | null,
    coverUrl?: string | null,
    genre?: string | null,
    format?: string | null,
    owned?: boolean | null,
    status?: string | null,
    startDate?: string | null,
    endDate?: string | null
  }
) {
  const body = {
    action: 'EDIT_READING',
    email: email.toLowerCase(),
    oldBookName,
    bookName: updates.bookName || oldBookName,
    author: updates.author,
    pages: updates.pages,
    rating: updates.rating,
    notes: updates.notes,
    cover_url: updates.coverUrl,
    genre: updates.genre || null,
    format: updates.format || null,
    owned: updates.owned === true,
    status: updates.status,
    startDate: updates.startDate || null,
    endDate: updates.endDate || null
  };

  const response = await fetch('/api/reading-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error('Erro ao editar leitura');
  invalidateReadingDataCache(email);
  return response.json();
}

export async function planReading(
  email: string,
  bookName: string,
  author?: string,
  startDate?: string | null,
  year?: number,
  month?: number,
  coverUrl?: string,
  totalPages?: number,
  format?: string,
  owned?: boolean,
  notes?: string,
  genre?: string
) {
  const response = await fetch("/api/reading-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.toLowerCase(),
      bookName,
      author,
      startDate: startDate || null,
      year: year || new Date().getUTCFullYear(),
      month: month || (new Date().getUTCMonth() + 1),
      coverUrl: coverUrl || null,
      totalPages: Number(totalPages) || 0,
      action: "PLAN_READING",
      format: format || null,
      owned: owned === true,
      notes: notes || null,
      genre: genre || null
    }),
  });
  if (!response.ok) throw new Error("Erro ao salvar planejado");
  invalidateReadingDataCache(email, year || new Date().getUTCFullYear(), month);
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

export async function deleteReading(email: string, bookName: string) {
  const response = await fetch('/api/reading-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'DELETE_READING', email: email.toLowerCase(), bookName })
  })
  if (!response.ok) throw new Error('Erro ao excluir leitura');
  return response.json();
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