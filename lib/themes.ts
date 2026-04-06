import { Sun, Moon, Sparkles } from "lucide-react"

export const THEMES = {
  light: {
    primary: '#8C7B6E',
    bg: '#FAFAF5',
    text: '#4A443F',
    card: '#ffffff',
    name: 'Algodão',
    icon: Sun,
  },
  dark: {
    primary: '#8C7B6E', // Mudando de #D1C7BD para equilibrar o visual vintage no modo escuro
    bg: '#1A1918',
    text: '#F5F5F5',
    card: '#262422',
    name: 'Noite',
    icon: Moon,
  },
  purple: {
    primary: '#9B89B3',
    bg: '#F8F7FA',
    text: '#3D3547',
    card: '#ffffff',
    name: 'Brisa',
    icon: Sparkles,
  },
} as const;

export type ThemeKey = keyof typeof THEMES;
