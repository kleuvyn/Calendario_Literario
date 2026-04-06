"use client"

import { useSession, signOut } from "next-auth/react"
import { LogOut, Sun, Moon, Sparkles } from "lucide-react" 
import Link from "next/link" 
import { motion } from "framer-motion"
import { THEMES } from "@/lib/themes" // wait, themes are in pages... 
