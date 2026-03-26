"use client"

import Image from 'next/image'
import { useState } from 'react'
import { BookOpen } from 'lucide-react'

interface OptimizedBookCoverProps {
  src?: string | null
  alt: string
  className?: string
  priority?: boolean
  fill?: boolean
  width?: number
  height?: number
}

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f1f5f9" offset="20%" />
      <stop stop-color="#e2e8f0" offset="50%" />
      <stop stop-color="#f1f5f9" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f1f5f9" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

export function OptimizedBookCover({
  src,
  alt,
  className = '',
  priority = false,
  fill = false,
  width,
  height,
}: OptimizedBookCoverProps) {
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 ${className}`}>
        <BookOpen className="w-1/3 h-1/3 text-slate-400 opacity-50" strokeWidth={1.5} />
      </div>
    )
  }

  if (typeof src === 'string' && src.startsWith('data:image/')) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`}
        onError={() => setError(true)}
      />
    )
  }

  const imageProps = fill
    ? { fill: true }
    : { width: width || 300, height: height || 450 }

  return (
    <>
      <Image
        {...imageProps}
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`}
        onError={() => setError(true)}
        onLoadingComplete={() => setIsLoading(false)}
        priority={priority}
        placeholder="blur"
        blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(width || 300, height || 450))}`}
        quality={85}
        style={{ objectFit: 'cover' }}
      />
    </>
  )
}
