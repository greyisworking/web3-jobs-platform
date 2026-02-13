'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Placeholder from '@tiptap/extension-placeholder'
import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Quote,
  Image as ImageIcon,
  Video,
  Palette,
  List,
  ListOrdered,
  Type,
  Upload,
  Loader2,
  X,
  ChevronDown,
  Check,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// Color presets - commonly used colors
const COLOR_PRESETS = [
  { hex: '#F8FAFC', label: 'White' },
  { hex: '#22C55E', label: 'Green' },
  { hex: '#3B82F6', label: 'Blue' },
  { hex: '#EF4444', label: 'Red' },
  { hex: '#F59E0B', label: 'Orange' },
  { hex: '#8B5CF6', label: 'Purple' },
  { hex: '#EC4899', label: 'Pink' },
  { hex: '#94A3B8', label: 'Gray' },
]

// Heading options
const HEADING_OPTIONS = [
  { level: 1, label: 'Heading 1', shortLabel: 'H1' },
  { level: 2, label: 'Heading 2', shortLabel: 'H2' },
  { level: 3, label: 'Heading 3', shortLabel: 'H3' },
  { level: 0, label: 'Paragraph', shortLabel: 'P' },
] as const

// Image size presets
const IMAGE_SIZES = [
  { label: 'Small', width: '25%' },
  { label: 'Medium', width: '50%' },
  { label: 'Large', width: '75%' },
  { label: 'Full', width: '100%' },
]

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showImageInput, setShowImageInput] = useState(false)
  const [showVideoInput, setShowVideoInput] = useState(false)
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [customColor, setCustomColor] = useState('#22C55E')
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const linkInputRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLDivElement>(null)
  const videoInputRef = useRef<HTMLDivElement>(null)
  const headingDropdownRef = useRef<HTMLDivElement>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)

  const supabase = createSupabaseBrowserClient()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-purple-400 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image max-w-full h-auto my-4 rounded cursor-pointer',
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'w-full aspect-video my-4',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write your article...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'min-h-[400px] p-4 bg-a24-bg dark:bg-a24-dark-bg text-a24-text dark:text-a24-dark-text focus:outline-none prose prose-sm dark:prose-invert max-w-none',
      },
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement
        if (target.tagName === 'IMG') {
          setSelectedImage(target as HTMLImageElement)
        } else {
          setSelectedImage(null)
        }
        return false
      },
    },
  })

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  // Click outside to close popups
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (colorPickerRef.current && !colorPickerRef.current.contains(target)) {
        setShowColorPicker(false)
      }
      if (linkInputRef.current && !linkInputRef.current.contains(target)) {
        setShowLinkInput(false)
        setLinkUrl('')
      }
      if (imageInputRef.current && !imageInputRef.current.contains(target)) {
        setShowImageInput(false)
        setImageUrl('')
      }
      if (videoInputRef.current && !videoInputRef.current.contains(target)) {
        setShowVideoInput(false)
        setVideoUrl('')
      }
      if (headingDropdownRef.current && !headingDropdownRef.current.contains(target)) {
        setShowHeadingDropdown(false)
      }

      // Deselect image when clicking outside editor
      if (editorContainerRef.current && !editorContainerRef.current.contains(target)) {
        setSelectedImage(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const closeAllPopups = useCallback(() => {
    setShowColorPicker(false)
    setShowLinkInput(false)
    setShowImageInput(false)
    setShowVideoInput(false)
    setShowHeadingDropdown(false)
  }, [])

  const handleLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
      setLinkUrl('')
    }
    setShowLinkInput(false)
  }, [linkUrl, editor])

  const handleImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl('')
    }
    setShowImageInput(false)
  }, [imageUrl, editor])

  const handleVideo = useCallback(() => {
    if (videoUrl && editor) {
      editor.chain().focus().setYoutubeVideo({ src: videoUrl }).run()
      setVideoUrl('')
    }
    setShowVideoInput(false)
  }, [videoUrl, editor])

  const handleImageUpload = useCallback(async (file: File) => {
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
      const filePath = `articles/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      if (editor) {
        editor.chain().focus().setImage({ src: publicUrl }).run()
      }
      toast.success('Image uploaded!')
      // Auto-close image popup after upload
      setShowImageInput(false)
      setImageUrl('')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }, [editor, supabase.storage])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
    e.target.value = ''
  }, [handleImageUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
  }, [handleImageUpload])

  const handleColor = useCallback((color: string) => {
    editor?.chain().focus().setColor(color).run()
    setShowColorPicker(false)
  }, [editor])

  const handleHeading = useCallback((level: number) => {
    if (!editor) return
    if (level === 0) {
      editor.chain().focus().setParagraph().run()
    } else {
      editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()
    }
    setShowHeadingDropdown(false)
  }, [editor])

  const handleImageResize = useCallback((width: string) => {
    if (!selectedImage || !editor) return
    selectedImage.style.width = width
    selectedImage.style.height = 'auto'
    // Update the editor content
    onChange(editor.getHTML())
    setSelectedImage(null)
  }, [selectedImage, editor, onChange])

  const getCurrentHeading = () => {
    if (!editor) return 'P'
    if (editor.isActive('heading', { level: 1 })) return 'H1'
    if (editor.isActive('heading', { level: 2 })) return 'H2'
    if (editor.isActive('heading', { level: 3 })) return 'H3'
    return 'P'
  }

  if (!editor) {
    return (
      <div className="border border-a24-border dark:border-a24-dark-border min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-a24-muted" />
      </div>
    )
  }

  return (
    <div
      ref={editorContainerRef}
      className="border border-a24-border dark:border-a24-dark-border"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface">
        {/* Text Style */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors ${editor.isActive('bold') ? 'bg-a24-border dark:bg-a24-dark-border' : ''}`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors ${editor.isActive('italic') ? 'bg-a24-border dark:bg-a24-dark-border' : ''}`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors ${editor.isActive('underline') ? 'bg-a24-border dark:bg-a24-dark-border' : ''}`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-a24-border dark:bg-a24-dark-border mx-1" />

        {/* Heading Dropdown */}
        <div className="relative" ref={headingDropdownRef}>
          <button
            type="button"
            onClick={() => {
              closeAllPopups()
              setShowHeadingDropdown(!showHeadingDropdown)
            }}
            className="flex items-center gap-1 px-2 py-1.5 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors text-sm font-medium min-w-[60px]"
            title="Text Style"
          >
            <Type className="w-4 h-4" />
            <span>{getCurrentHeading()}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showHeadingDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border z-50 min-w-[140px] shadow-lg">
              {HEADING_OPTIONS.map((option) => (
                <button
                  key={option.level}
                  type="button"
                  onClick={() => handleHeading(option.level)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors"
                >
                  <span className={option.level === 1 ? 'text-xl font-bold' : option.level === 2 ? 'text-lg font-semibold' : option.level === 3 ? 'text-base font-medium' : 'text-sm'}>
                    {option.label}
                  </span>
                  {getCurrentHeading() === option.shortLabel && (
                    <Check className="w-4 h-4 text-purple-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors ${editor.isActive('bulletList') ? 'bg-a24-border dark:bg-a24-dark-border' : ''}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors ${editor.isActive('orderedList') ? 'bg-a24-border dark:bg-a24-dark-border' : ''}`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors ${editor.isActive('blockquote') ? 'bg-a24-border dark:bg-a24-dark-border' : ''}`}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-a24-border dark:bg-a24-dark-border mx-1" />

        {/* Color Picker */}
        <div className="relative" ref={colorPickerRef}>
          <button
            type="button"
            onClick={() => {
              closeAllPopups()
              setShowColorPicker(!showColorPicker)
            }}
            className="p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors"
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border z-50 w-48 shadow-lg">
              <div className="text-xs text-a24-muted mb-2 uppercase tracking-wider">Presets</div>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => handleColor(color.hex)}
                    className="w-8 h-8 border border-a24-border dark:border-a24-dark-border hover:scale-110 transition-transform rounded"
                    style={{ backgroundColor: color.hex }}
                    title={color.label}
                  />
                ))}
              </div>
              <div className="text-xs text-a24-muted mb-2 uppercase tracking-wider">Custom</div>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-10 h-8 border-0 cursor-pointer bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => handleColor(customColor)}
                  className="flex-1 px-2 py-1 text-xs bg-purple-600 text-white hover:bg-purple-700 transition-colors rounded"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-a24-border dark:bg-a24-dark-border mx-1" />

        {/* Link */}
        <div className="relative" ref={linkInputRef}>
          <button
            type="button"
            onClick={() => {
              closeAllPopups()
              setShowLinkInput(!showLinkInput)
            }}
            className={`p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors ${editor.isActive('link') ? 'bg-a24-border dark:bg-a24-dark-border' : ''}`}
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border z-50 shadow-lg">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="px-2 py-1.5 text-sm border border-a24-border dark:border-a24-dark-border bg-transparent w-56 rounded"
                  onKeyDown={(e) => e.key === 'Enter' && handleLink()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleLink}
                  className="px-3 py-1.5 text-xs bg-purple-600 text-white hover:bg-purple-700 rounded"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Image */}
        <div className="relative" ref={imageInputRef}>
          <button
            type="button"
            onClick={() => {
              closeAllPopups()
              setShowImageInput(!showImageInput)
            }}
            className="p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          {showImageInput && (
            <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border z-50 w-72 space-y-3 shadow-lg">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Image URL"
                  className="flex-1 px-2 py-1.5 text-sm border border-a24-border dark:border-a24-dark-border bg-transparent rounded"
                  onKeyDown={(e) => e.key === 'Enter' && handleImage()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleImage}
                  className="px-3 py-1.5 text-xs bg-purple-600 text-white hover:bg-purple-700 rounded"
                >
                  Add
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-a24-border" />
                <span className="text-xs text-a24-muted">or</span>
                <div className="flex-1 h-px bg-a24-border" />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-a24-border hover:border-purple-500 text-sm text-a24-muted hover:text-a24-text transition-colors rounded"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? 'Uploading...' : 'Upload Image'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Video */}
        <div className="relative" ref={videoInputRef}>
          <button
            type="button"
            onClick={() => {
              closeAllPopups()
              setShowVideoInput(!showVideoInput)
            }}
            className="p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors"
            title="Insert YouTube Video"
          >
            <Video className="w-4 h-4" />
          </button>
          {showVideoInput && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border z-50 shadow-lg">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="px-2 py-1.5 text-sm border border-a24-border dark:border-a24-dark-border bg-transparent w-64 rounded"
                  onKeyDown={(e) => e.key === 'Enter' && handleVideo()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleVideo}
                  className="px-3 py-1.5 text-xs bg-purple-600 text-white hover:bg-purple-700 rounded"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Resize Controls */}
      {selectedImage && (
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-600/10 border-b border-purple-500/30">
          <span className="text-xs text-purple-400 uppercase tracking-wider mr-2">Image Size:</span>
          {IMAGE_SIZES.map((size) => (
            <button
              key={size.label}
              type="button"
              onClick={() => handleImageResize(size.width)}
              className="px-3 py-1 text-xs bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 transition-colors rounded"
            >
              {size.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="ml-auto p-1 text-purple-400 hover:text-purple-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} className="font-space" />

      <style jsx global>{`
        .ProseMirror {
          font-family: var(--font-space), sans-serif;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #6B7280;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #8B5CF6;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #9CA3AF;
          font-style: italic;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
          transition: outline 0.15s;
        }
        .ProseMirror img.ProseMirror-selectednode,
        .ProseMirror img:focus {
          outline: 2px solid #8B5CF6;
          outline-offset: 2px;
        }
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 2rem 0 0.75rem;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1.5rem 0 0.5rem;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1.25rem 0 0.5rem;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .ProseMirror li {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  )
}
