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
  Heading2,
  Upload,
  Loader2,
  X,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { toast } from 'sonner'

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
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createSupabaseBrowserClient()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
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
          class: 'max-w-full h-auto my-4 rounded',
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
    },
  })

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

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
      toast.error('Only image files allowed! 🦫')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large! Max 5MB 📦')
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
      toast.success('Image uploaded! GM fren ☀️')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed... NGMI 😢')
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

  if (!editor) {
    return (
      <div className="border border-a24-border dark:border-a24-dark-border min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-a24-muted" />
      </div>
    )
  }

  return (
    <div
      className="border border-a24-border dark:border-a24-dark-border"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface">
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

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-a24-border dark:bg-a24-dark-border' : ''}`}
          title="Heading"
        >
          <Heading2 className="w-4 h-4" />
        </button>
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
                  className="w-6 h-6 border border-a24-border dark:border-a24-dark-border hover:scale-110 transition-transform"
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
            className={`p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors ${editor.isActive('link') ? 'bg-a24-border dark:bg-a24-dark-border' : ''}`}
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border z-50 flex gap-2">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="px-2 py-1 text-sm border border-a24-border dark:border-a24-dark-border bg-transparent w-56"
                onKeyDown={(e) => e.key === 'Enter' && handleLink()}
              />
              <button
                type="button"
                onClick={handleLink}
                className="px-2 py-1 text-xs bg-purple-600 text-white hover:bg-purple-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowLinkInput(false)}
                className="px-1 py-1 text-a24-muted hover:text-a24-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className="p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          {showImageInput && (
            <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border z-50 w-72 space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Image URL"
                  className="flex-1 px-2 py-1 text-sm border border-a24-border dark:border-a24-dark-border bg-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handleImage()}
                />
                <button
                  type="button"
                  onClick={handleImage}
                  className="px-2 py-1 text-xs bg-purple-600 text-white hover:bg-purple-700"
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
                className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-a24-border hover:border-purple-500 text-sm text-a24-muted hover:text-a24-text transition-colors"
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

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowVideoInput(!showVideoInput)}
            className="p-2 hover:bg-a24-border dark:hover:bg-a24-dark-border transition-colors"
            title="Insert YouTube Video"
          >
            <Video className="w-4 h-4" />
          </button>
          {showVideoInput && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-a24-dark-surface border border-a24-border dark:border-a24-dark-border z-50 flex gap-2">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="px-2 py-1 text-sm border border-a24-border dark:border-a24-dark-border bg-transparent w-64"
                onKeyDown={(e) => e.key === 'Enter' && handleVideo()}
              />
              <button
                type="button"
                onClick={handleVideo}
                className="px-2 py-1 text-xs bg-purple-600 text-white hover:bg-purple-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowVideoInput(false)}
                className="px-1 py-1 text-a24-muted hover:text-a24-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      <style jsx global>{`
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
