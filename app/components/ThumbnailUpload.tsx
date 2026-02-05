'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'

interface ThumbnailUploadProps {
  value: string
  onChange: (url: string) => void
}

export default function ThumbnailUpload({ value, onChange }: ThumbnailUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createSupabaseBrowserClient()

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files allowed!')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large! Max 5MB')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `thumbnails/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      onChange(publicUrl)
      toast.success('Thumbnail uploaded!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed...')
    } finally {
      setUploading(false)
    }
  }, [onChange, supabase.storage])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    e.target.value = ''
  }, [handleUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleUpload(file)
    }
  }, [handleUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  if (value) {
    return (
      <div className="relative aspect-video bg-a24-surface overflow-hidden group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Thumbnail preview"
          className="w-full h-full object-cover"
        />
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 text-white transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        disabled={uploading}
        className={`w-full aspect-video flex flex-col items-center justify-center gap-3 border-2 border-dashed transition-colors cursor-pointer ${
          dragOver
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-a24-border hover:border-gray-500 bg-a24-surface/50'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-a24-muted animate-spin" />
            <span className="text-sm text-a24-muted">Uploading...</span>
          </>
        ) : (
          <>
            <ImageIcon className="w-8 h-8 text-a24-muted" />
            <div className="text-center">
              <span className="text-sm text-a24-muted">
                Drop an image or click to upload
              </span>
              <p className="text-xs text-a24-muted/60 mt-1">
                Max 5MB
              </p>
            </div>
          </>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
