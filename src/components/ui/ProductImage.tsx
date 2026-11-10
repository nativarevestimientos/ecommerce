"use client"

import React, { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
// Reemplazamos Next/Image por img estándar para evitar cache y forzar actualización inmediata
import { PLACEHOLDER_IMAGE } from '@/lib/constants'

export interface ProductImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  variant?: 'carousel' | 'shop' | 'search' | 'list'
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  variant = 'carousel'
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [imgSrc, setImgSrc] = useState(src || PLACEHOLDER_IMAGE)

  const handleError = () => {
    if (!error) {
      console.error('Error al cargar imagen:', imgSrc)
      setError(true)
      setImgSrc(PLACEHOLDER_IMAGE)
    }
  }

  const getPaddingClass = () => {
    switch (variant) {
      case 'shop':
        return 'p-0'
      case 'search':
        return 'p-0'
      case 'list':
        return 'p-0'
      default:
        return 'p-2'
    }
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <Skeleton className="absolute inset-0" />
      )}
      {/* img nativa para evitar cache de Next/Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={alt}
        width={width || 295}
        height={height || 298}
        className={`object-contain ${getPaddingClass()} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  )
} 
