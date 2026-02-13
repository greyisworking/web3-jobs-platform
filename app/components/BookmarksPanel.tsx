'use client'

import { X, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBookmarks } from '@/hooks/useBookmarks'
import Pixelbara from './Pixelbara'

interface BookmarksPanelProps {
  open: boolean
  onClose: () => void
}

export default function BookmarksPanel({ open, onClose }: BookmarksPanelProps) {
  const { bookmarks, toggle } = useBookmarks()

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/20"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-a24-bg dark:bg-a24-dark-bg border-l border-a24-border dark:border-a24-dark-border flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-a24-border dark:border-a24-dark-border">
              <h2 className="text-sm font-light uppercase tracking-[0.35em] text-a24-text dark:text-a24-dark-text">
                Saved
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-a24-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
                aria-label="Close bookmarks panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {bookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-a24-muted dark:text-a24-dark-muted">
                  <Pixelbara pose="bookmarks" size={80} className="mb-4 opacity-60" />
                  <p className="text-base font-medium">bestie... nothing saved yet</p>
                  <p className="text-sm mt-1 opacity-60">lowkey gonna forget these jobs fr</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {bookmarks.map((item) => (
                    <motion.div
                      key={item.jobId}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-start gap-3 p-4 border border-a24-border dark:border-a24-dark-border bg-a24-surface dark:bg-a24-dark-surface"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-a24-text dark:text-a24-dark-text truncate text-sm">
                          {item.title}
                        </h3>
                        <p className="text-xs text-a24-muted dark:text-a24-dark-muted mt-0.5">
                          {item.company}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-a24-muted dark:text-a24-dark-muted">
                            {new Date(item.savedAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          toggle({
                            id: item.jobId,
                            title: item.title,
                            company: item.company,
                          })
                        }
                        className="flex-shrink-0 p-2 text-a24-muted hover:text-a24-accent transition-colors"
                        aria-label="Remove bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {bookmarks.length > 0 && (
              <div className="p-4 text-center text-xs text-a24-muted dark:text-a24-dark-muted border-t border-a24-border dark:border-a24-dark-border uppercase tracking-wider">
                {bookmarks.length} saved
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
