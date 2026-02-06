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
 * Renders markdown content with NEUN design system typography.
 * Uses Pretendard Variable font (same as site) with proper hierarchy.
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
        className={`jd-prose ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  return (
    <div className={`jd-prose ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Section headings (h2) - NEUN green, bold, with spacing
          h2: ({ children }) => (
            <h2 className="text-[15px] font-bold text-neun-primary mt-10 mb-4 first:mt-0 tracking-tight">
              {children}
            </h2>
          ),

          // Sub-section headings (h3) - Slightly muted green
          h3: ({ children }) => (
            <h3 className="text-[14px] font-semibold text-neun-primary/90 mt-8 mb-3">
              {children}
            </h3>
          ),

          // Minor headings (h4) - Used for timeline items like "In your first 30 days"
          h4: ({ children }) => (
            <h4 className="text-[13px] font-semibold text-a24-text dark:text-a24-dark-text mt-6 mb-2">
              {children}
            </h4>
          ),

          // Paragraphs - Comfortable line height, proper spacing
          p: ({ children }) => (
            <p className="text-[13px] text-a24-muted dark:text-a24-dark-muted leading-[1.75] mb-4 last:mb-0">
              {children}
            </p>
          ),

          // Unordered lists - Clean spacing
          ul: ({ children }) => (
            <ul className="my-4 space-y-2.5 pl-0">
              {children}
            </ul>
          ),

          // Ordered lists
          ol: ({ children }) => (
            <ol className="my-4 space-y-2.5 pl-4 list-decimal text-[13px] text-a24-muted dark:text-a24-dark-muted leading-[1.75]">
              {children}
            </ol>
          ),

          // List items - Proper indentation with green bullet
          li: ({ children }) => (
            <li className="text-[13px] text-a24-muted dark:text-a24-dark-muted leading-[1.75] flex items-start gap-3 pl-1">
              <span className="text-neun-primary text-[10px] mt-[7px] flex-shrink-0">●</span>
              <span className="flex-1">{children}</span>
            </li>
          ),

          // Bold text - Darker than body for emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-a24-text dark:text-a24-dark-text">
              {children}
            </strong>
          ),

          // Italic
          em: ({ children }) => (
            <em className="italic">
              {children}
            </em>
          ),

          // Links - NEUN green
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

          // Inline code
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

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-neun-primary pl-4 py-2 my-4 bg-neun-primary/5 dark:bg-neun-primary/10 text-[13px]">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="my-8 border-a24-border dark:border-a24-dark-border" />
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
