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
          {/* 오버레이 배경 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* 슬라이드 패널 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-web3-midnight border-l border-white/20 shadow-2xl flex flex-col"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                저장된 공고
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* 목록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {bookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <p className="text-lg">저장된 공고가 없습니다</p>
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
                      className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.company}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(item.savedAt).toLocaleDateString('ko-KR')}
                          </span>
                          {item.verified && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 제거 버튼 */}
                      <button
                        onClick={() =>
                          toggle({
                            id: item.jobId,
                            title: item.title,
                            company: item.company,
                          })
                        }
                        className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        aria-label="북마크 제거"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* 푸터 */}
            {bookmarks.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-white/10 text-center text-sm text-gray-500 dark:text-gray-400">
                {bookmarks.length}개 저장됨
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
