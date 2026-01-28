'use client'

import { X, Trash2, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBookmarks } from '@/hooks/useBookmarks'

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
            className="fixed inset-0 z-50 bg-black/30"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-sub-offwhite dark:bg-sub-dark-bg border-l border-sub-border dark:border-sub-border-dark flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-sub-border dark:border-sub-border-dark">
              <h2 className="text-lg font-heading uppercase tracking-widest text-sub-charcoal dark:text-gray-200">
                SAVED JOBS
              </h2>
              <button
                onClick={onClose}
                className="p-2 border border-sub-border dark:border-sub-border-dark hover:bg-white dark:hover:bg-sub-dark-surface transition-colors"
              >
                <X className="w-5 h-5 text-sub-charcoal dark:text-gray-400" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {bookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-sub-muted dark:text-gray-500">
                  <p className="text-base">저장된 공고가 없습니다</p>
                  <p className="text-sm mt-1">하트를 눌러 공고를 저장하세요</p>
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
                      className="flex items-start gap-3 p-4 bg-white dark:bg-sub-dark-surface border border-sub-border dark:border-sub-border-dark"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sub-charcoal dark:text-gray-200 truncate text-sm">
                          {item.title}
                        </h3>
                        <p className="text-xs text-sub-muted dark:text-gray-400 mt-0.5">
                          {item.company}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-sub-muted dark:text-gray-500">
                            {new Date(item.savedAt).toLocaleDateString('ko-KR')}
                          </span>
                          {item.verified && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] text-sub-hotpink">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          )}
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
                        className="flex-shrink-0 p-2 border border-sub-border dark:border-sub-border-dark text-sub-muted hover:text-sub-hotpink hover:border-sub-hotpink transition-colors"
                        aria-label="북마크 제거"
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
              <div className="p-4 text-center text-sm text-sub-muted dark:text-gray-400 border-t border-sub-border dark:border-sub-border-dark">
                {bookmarks.length}개 저장됨
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
