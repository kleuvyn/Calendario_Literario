"use client"

interface ReadingStatsProps {
  readings: any[]
  goal: number
}

export function ReadingStats({ readings, goal }: ReadingStatsProps) {
  const finishedCount = readings.filter(r => r.status === 'lido').length
  const percentage = Math.min(Math.round((finishedCount / goal) * 100), 100)

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-card border border-border rounded-3xl shadow-sm mb-8">
      <div className="flex justify-between items-end mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Sua Meta Literária
            </h3>
          </div>
          <p className="text-[11px] font-bold text-foreground/70">
            VOCÊ LEU <span className="text-foreground font-black">{finishedCount}</span> DE {goal} LIVROS EM 2026
          </p>
        </div>
        <span className="text-3xl font-serif font-bold text-foreground tracking-tighter">
          {percentage}%
        </span>
      </div>

      <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden border border-border/50">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,0,0,0.05)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {percentage === 100 && (
        <p className="text-center mt-3 text-[9px] font-black uppercase tracking-widest text-primary animate-pulse">
          ✨ Meta alcançada! Parabéns! ✨
        </p>
      )}
    </div>
  )
}