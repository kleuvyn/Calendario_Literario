"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function BookCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-slate-200">
      <Skeleton className="w-full aspect-2/3 rounded" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-3 w-3 rounded-full" />
        ))}
      </div>
    </div>
  )
}

export function BookShelfSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map(shelf => (
        <div key={shelf}>
          <div className="relative rounded-lg overflow-hidden p-8 bg-linear-to-b from-amber-100/40 to-amber-50/30 border-2 border-amber-200/50">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(book => (
                <div key={book} className="flex flex-col gap-2">
                  <Skeleton className="w-full aspect-2/3 rounded-lg" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-3/4" />
                  <div className="flex gap-0.5 justify-center">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-2.5 w-2.5 rounded-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="h-2 bg-linear-to-b from-amber-900/10 to-transparent rounded-b-lg" />
        </div>
      ))}
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <div className="flex gap-4 items-center">
        <Skeleton className="w-16 h-24 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  )
}

export function RetrospectivaLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg border border-slate-200 p-6 space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>

        <BookShelfSkeleton />
      </div>
    </div>
  )
}

export function CalendarDaySkeleton() {
  return (
    <div className="min-h-24 p-2 border border-slate-200 rounded-lg bg-white">
      <Skeleton className="h-6 w-6 rounded-full mb-2" />
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <Skeleton className="w-8 h-12 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function CalendarMonthSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }).map((_, i) => (
        <CalendarDaySkeleton key={i} />
      ))}
    </div>
  )
}
