'use client'

import { useEffect, useRef } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function PageTransition() {
  const pathname = usePathname()
  const controls = useAnimationControls()
  const isFirst = useRef(true)
  const prevPath = useRef(pathname)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    controls.start({
      y: ['-100%', '0%', '0%', '100%'],
      transition: {
        duration: 0.7,
        times: [0, 0.35, 0.5, 1],
        ease: [0.22, 1, 0.36, 1],
      },
    })
  }, [pathname, controls])

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) return null

  return (
    <motion.div
      className="fixed inset-0 z-[9998] bg-a24-bg dark:bg-a24-dark-bg pointer-events-none"
      initial={{ y: '-100%' }}
      animate={controls}
    />
  )
}
