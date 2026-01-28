'use client'

import { useCallback, useState } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Link,
  Quote,
  Image,
  Video,
  Palette,
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const COLORS = [
  '#1A1A1A', '#6B7280', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899',
]

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showImageInput, setShowImageInput] = useState(false)
  const [showVideoInput, setShowVideoInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
  }, [])

  const handleBold = () => execCommand('bold')
  const handleItalic = () => execCommand('italic')
  const handleUnderline = () => execCommand('underline')
  const handleQuote = () => execCommand('formatBlock', 'blockquote')

  const handleColor = (color: string) => {
    execCommand('foreColor', color)
    setShowColorPicker(false)
  }

  const handleLink = () => {
    if (linkUrl) {
      execCommand('createLink', linkUrl)
      setLinkUrl('')
    }
    setShowLinkInput(false)
  }

  const handleImage = () => {
    if (imageUrl) {
      execCommand('insertImage', imageUrl)
      setImageUrl('')
    }
    setShowImageInput(false)
  }

  const handleVideo = () => {
    if (videoUrl) {
      // Insert video iframe
      const iframe = `<div class="video-wrapper"><iframe src="${videoUrl.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe></div>`
      execCommand('insertHTML', iframe)
      setVideoUrl('')
    }
    setShowVideoInput(false)
  }

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onChange(e.currentTarget.innerHTML)
  }

  return (
    <div className="border border-a24-border dark:border-a24-dark-border">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface">
        <button
          type="button"
          onClick={handleBold}
          className="p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleItalic}
          className="p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleUnderline}
          className="p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-a24-border dark:bg-a24-dark-border mx-1" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors"
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border z-50 grid grid-cols-3 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColor(color)}
                  className="w-6 h-6 border border-a24-border dark:border-a24-dark-border"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-a24-border dark:bg-a24-dark-border mx-1" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLinkInput(!showLinkInput)}
            className="p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors"
            title="Insert Link"
          >
            <Link className="w-4 h-4" />
          </button>
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border z-50 flex gap-2">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://"
                className="px-2 py-1 text-sm border border-a24-border dark:border-a24-dark-border bg-transparent w-48"
              />
              <button
                type="button"
                onClick={handleLink}
                className="px-2 py-1 text-xs bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg"
              >
                Insert
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleQuote}
          className="p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors"
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-a24-border dark:bg-a24-dark-border mx-1" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className="p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors"
            title="Insert Image"
            aria-label="Insert Image"
          >
            <Image className="w-4 h-4" />
          </button>
          {showImageInput && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border z-50 flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL"
                className="px-2 py-1 text-sm border border-a24-border dark:border-a24-dark-border bg-transparent w-48"
              />
              <button
                type="button"
                onClick={handleImage}
                className="px-2 py-1 text-xs bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg"
              >
                Insert
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowVideoInput(!showVideoInput)}
            className="p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors"
            title="Insert Video"
          >
            <Video className="w-4 h-4" />
          </button>
          {showVideoInput && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border z-50 flex gap-2">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="YouTube URL"
                className="px-2 py-1 text-sm border border-a24-border dark:border-a24-dark-border bg-transparent w-48"
              />
              <button
                type="button"
                onClick={handleVideo}
                className="px-2 py-1 text-xs bg-a24-text dark:bg-a24-dark-text text-white dark:text-a24-dark-bg"
              >
                Insert
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div
        contentEditable
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder || 'Write your article...'}
        className="min-h-[400px] p-4 bg-a24-bg dark:bg-a24-dark-bg text-a24-text dark:text-a24-dark-text focus:outline-none prose prose-sm dark:prose-invert max-w-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-a24-muted [&:empty]:before:dark:text-a24-dark-muted"
      />

      <style jsx global>{`
        .video-wrapper {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          margin: 1rem 0;
        }
        .video-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        [contenteditable] blockquote {
          border-left: 3px solid #6B7280;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6B7280;
          font-style: italic;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  )
}
