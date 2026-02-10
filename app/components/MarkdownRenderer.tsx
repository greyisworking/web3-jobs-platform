'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Pre-process content to normalize it for markdown rendering
 */
function preprocessContent(content: string): string {
  let processed = content

  // 1. Convert <br/> and <br> tags to newlines
  processed = processed.replace(/<br\s*\/?>/gi, '\n')

  // 2. Convert ● bullet points to markdown list items
  //    Handle: "● Item" or "●Item" at start of line
  processed = processed.replace(/^[●•]\s*/gm, '- ')
  //    Handle: inline bullets after newline
  processed = processed.replace(/\n[●•]\s*/g, '\n- ')

  // 3. Convert numbered items like "1.Item" to "1. Item"
  processed = processed.replace(/^(\d+\.)(?=[A-Za-z])/gm, '$1 ')

  // 4. Strip remaining HTML tags but preserve their content
  //    (except for already-converted br tags)
  processed = processed.replace(/<\/?(?:p|div|span|strong|b|em|i|u)[^>]*>/gi, '')

  // 5. Normalize multiple newlines
  processed = processed.replace(/\n{3,}/g, '\n\n')

  // 6. Fix words that got broken by line breaks (e.g., "compen\nsation" -> "compensation")
  //    Look for lowercase letter + newline + lowercase letter (word continuation)
  processed = processed.replace(/([a-z])\n([a-z])/g, '$1$2')

  // 7. Clean up extra whitespace
  processed = processed.replace(/[ \t]+\n/g, '\n')
  processed = processed.trim()

  return processed
}

/**
 * Markdown Renderer for Job Descriptions
 *
 * Renders markdown content with NEUN design system typography.
 * Uses Pretendard Variable font (same as site) with proper hierarchy.
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null

  // Pre-process content to normalize HTML and bullet points
  const processedContent = preprocessContent(content)

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
        {processedContent}
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
