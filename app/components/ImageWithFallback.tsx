'use client'

import { useState } from 'react'
import Image, { ImageProps } from 'next/image'

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallback?: React.ReactNode
}

/**
 * Image component with built-in error handling and fallback
 * Falls back to provided fallback element or hides on error
 */
export default function ImageWithFallback({
  fallback,
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return fallback ? <>{fallback}</> : null
  }

  return (
    <Image
      alt={alt}
      onError={() => setHasError(true)}
      {...props}
    />
  )
}
