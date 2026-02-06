'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Markdown Renderer for Job Descriptions
 *
 * Renders markdown content with custom styling that matches the A24 design system.
 * Supports:
 * - Headers (## Section)
 * - Lists (- item)
 * - Bold (**text**)
 * - Italic (*text*)
 * - Links
 * - Code blocks
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null

  // Check if content looks like markdown or HTML
  const isMarkdown = /^#{1,6}\s|^\s*[-*]\s|^\d+\.\s|\*\*[^*]+\*\*/m.test(content)
  const hasHtml = /<[a-z][^>]*>/i.test(content)

  // If it has HTML and doesn't look like markdown, render as HTML (legacy)
  if (hasHtml && !isMarkdown) {
    return (
      <div
        className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
        style={{ fontFamily: 'inherit' }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
      style={{ fontFamily: 'inherit' }}
    >
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Custom heading styles - h2 uses NEUN green for section headings
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-neun-primary mt-8 mb-4 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold text-neun-primary mt-8 mb-3 first:mt-0 pb-2 border-b border-neun-primary/20">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-neun-primary/80 mt-5 mb-2">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-medium text-a24-text dark:text-a24-dark-text mt-4 mb-2">
            {children}
          </h4>
        ),

        // Paragraph styles
        p: ({ children }) => (
          <p className="text-sm text-a24-text dark:text-a24-dark-text leading-relaxed mb-4 last:mb-0">
            {children}
          </p>
        ),

        // List styles
        ul: ({ children }) => (
          <ul className="list-none space-y-2 my-4 pl-0">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-2 my-4 pl-0 text-sm text-a24-text dark:text-a24-dark-text">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-a24-text dark:text-a24-dark-text flex items-start gap-2">
            <span className="text-neun-primary mt-1 flex-shrink-0">•</span>
            <span className="flex-1">{children}</span>
          </li>
        ),

        // Inline styles
        strong: ({ children }) => (
          <strong className="font-semibold text-a24-text dark:text-a24-dark-text">
            {children}
          </strong>
        ),
        em: ({ children }) => (
          <em className="italic text-a24-text dark:text-a24-dark-text">
            {children}
          </em>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neun-primary hover:text-neun-primary-hover underline decoration-neun-primary/30 hover:decoration-neun-primary transition-colors"
          >
            {children}
          </a>
        ),

        // Code
        code: ({ className, children }) => {
          const isInline = !className
          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 bg-a24-surface dark:bg-a24-dark-surface text-neun-primary text-xs rounded font-mono">
                {children}
              </code>
            )
          }
          return (
            <code className={`${className} block p-4 bg-a24-surface dark:bg-a24-dark-surface rounded text-xs font-mono overflow-x-auto`}>
              {children}
            </code>
          )
        },

        // Blockquote (for highlighted content like salary)
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-neun-primary pl-4 py-2 my-4 bg-neun-primary/5 dark:bg-neun-primary/10">
            {children}
          </blockquote>
        ),

        // Horizontal rule
        hr: () => (
          <hr className="my-6 border-a24-border dark:border-a24-dark-border" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  )
}

/**
 * Simple version that just cleans and renders
 */
export function SimpleMarkdownRenderer({ content }: { content: string }) {
  return <MarkdownRenderer content={content} />
}
