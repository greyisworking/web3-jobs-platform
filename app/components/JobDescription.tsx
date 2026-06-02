'use client'

import { useMemo } from 'react'
import { sanitizeJobDescription } from '@/lib/sanitize-description'

interface JobDescriptionProps {
  content: string | null | undefined
  className?: string
}

/** Simple Markdown → HTML for job descriptions (headers, bullets, bold, italic, links) */
function markdownToHtml(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr>')
    // Bullet lists: consecutive lines starting with -
    .replace(/^- (.+)$/gm, '<li>$1</li>')
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>)(?:\n(?=<li>))?/g, '$1')
  html = html.replace(/((?:<li>[^]*?<\/li>\n?)+)/g, '<ul>$1</ul>')
  // Paragraphs: double newlines
  html = html.replace(/\n\n+/g, '</p><p>')
  html = '<p>' + html + '</p>'
  // Clean empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '')
  html = html.replace(/<p>\s*(<h[23]>)/g, '$1')
  html = html.replace(/(<\/h[23]>)\s*<\/p>/g, '$1')
  html = html.replace(/<p>\s*(<ul>)/g, '$1')
  html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1')
  html = html.replace(/<p>\s*(<hr>)\s*<\/p>/g, '$1')
  return html
}

function isMarkdown(text: string): boolean {
  return /^##\s/m.test(text) || /^\- /m.test(text) || /\*\*.+\*\*/m.test(text)
}

export default function JobDescription({ content, className = '' }: JobDescriptionProps) {
  const sanitizedHtml = useMemo(() => {
    if (!content) return ''
    const trimmed = content.trim()
    if (!trimmed) return ''

    // If content has Markdown markers, convert to HTML first
    if (isMarkdown(trimmed)) {
      const html = markdownToHtml(trimmed)
      return sanitizeJobDescription(html)
    }

    // Otherwise use existing HTML sanitization
    return sanitizeJobDescription(trimmed)
  }, [content])

  if (!sanitizedHtml) return null

  return (
    <div
      className={`job-description ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
