export interface UserData {
  password: any
  email: string
  name: string
  provider: string
}

export interface DayData {
  startDate: string
  endDate: string
  bookName: string
}

export interface BookData {
  title: string
  cover: string
  rating: number
}

export interface UserCalendarData {
  [monthIndex: number]: {
    days: Record<number, DayData>
    books: Record<number, BookData>
  }
}

const STORAGE_PREFIX = "literario_2026_"

export function saveCurrentUser(userData: UserData) {
  localStorage.setItem(`${STORAGE_PREFIX}current_user`, JSON.stringify(userData))
}

export function getCurrentUser(): UserData | null {
  const data = localStorage.getItem(`${STORAGE_PREFIX}current_user`)
  return data ? JSON.parse(data) : null
}

export function clearCurrentUser() {
  localStorage.removeItem(`${STORAGE_PREFIX}current_user`)
}

export function saveUserCalendarData(userEmail: string, data: UserCalendarData) {
  const key = `${STORAGE_PREFIX}${userEmail}_calendar`
  localStorage.setItem(key, JSON.stringify(data))
}

export function getUserCalendarData(userEmail: string): UserCalendarData {
  const key = `${STORAGE_PREFIX}${userEmail}_calendar`
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : {}
}

export function saveMonthData(
  userEmail: string,
  monthIndex: number,
  days: Record<number, DayData>,
  books: Record<number, BookData>,
) {
  const allData = getUserCalendarData(userEmail)
  allData[monthIndex] = { days, books }
  saveUserCalendarData(userEmail, allData)
}

export function getMonthData(userEmail: string, monthIndex: number) {
  const allData = getUserCalendarData(userEmail)
  return allData[monthIndex] || { days: {}, books: {} }
}
