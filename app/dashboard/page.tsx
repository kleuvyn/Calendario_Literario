"use client"

import { useSession } from "next-auth/react"
import { CalendarContent } from "@/components/CalendarContent"
import { BookOpen } from "lucide-react"

export default function DashboardPage() {
  const { status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <BookOpen className="h-8 w-8 animate-pulse text-primary" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <CalendarContent />
    </div>
  )
}