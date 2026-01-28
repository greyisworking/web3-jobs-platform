'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function PageTransition() {
  const pathname = usePathname()
  const isFirst = useRef(true)
  const prevPath = useRef(pathname)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    // Quick fade transition
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 200)
    return () => clearTimeout(timer)
  }, [pathname])

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) return null

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          className="fixed inset-0 z-[9998] bg-a24-bg dark:bg-a24-dark-bg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />
      )}
    </AnimatePresence>
  )
}
