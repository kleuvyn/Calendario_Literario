"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, BarChart3 } from "lucide-react" 
import { MonthReview } from "./month-review"
import Link from "next/link" 

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function CalendarContent() {
  const { data: session } = useSession();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  if (selectedMonth !== null) {
    return (
      <div className="p-4">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedMonth(null)}
          className="mb-6 hover:bg-slate-100 font-bold uppercase text-[10px] tracking-widest"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar ao Calendário
        </Button>
        <MonthReview 
          month={MONTHS[selectedMonth]} 
          monthIndex={selectedMonth}
          year={currentYear}
          userEmail={session?.user?.email}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg text-white">
            <CalendarIcon size={20} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">
            Calendário <span className="text-primary">{currentYear}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/retrospectiva">
            <Button 
              variant="outline" 
              className="hidden sm:flex gap-2 font-black uppercase text-[10px] tracking-widest border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
            >
              <BarChart3 size={16} />
              Retrospectiva Anual
            </Button>
          </Link>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <Button variant="ghost" size="icon" onClick={() => setCurrentYear(prev => prev - 1)}>
              <ChevronLeft size={16} />
            </Button>
            <span className="px-4 font-black text-sm">{currentYear}</span>
            <Button variant="ghost" size="icon" onClick={() => setCurrentYear(prev => prev + 1)}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {MONTHS.map((month, index) => (
          <Card 
            key={month}
            className="group cursor-pointer hover:border-primary transition-all duration-300 overflow-hidden border-slate-100"
            onClick={() => setSelectedMonth(index)}
          >
            <div className="p-6 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary transition-colors">
                Mês {index + 1}
              </p>
              <h3 className="text-lg font-black uppercase text-slate-800 mt-1">{month}</h3>
            </div>
            <div className="h-1 bg-slate-50 group-hover:bg-primary transition-colors" />
          </Card>
        ))}
      </div>
      <div className="mt-8 flex justify-center sm:hidden">
        <Link href="/retrospectiva">
          <Button variant="outline" className="gap-2 font-black uppercase text-[10px] tracking-widest border-primary/20 text-primary">
            <BarChart3 size={16} />
            Ver Retrospectiva do Ano
          </Button>
        </Link>
      </div>
    </div>
  );
}