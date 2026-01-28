'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function CustomCursor() {
  const [hover, setHover] = useState(false)
  const [click, setClick] = useState(false)
  const [isTouch, setIsTouch] = useState(true)

  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)

  const x = useSpring(mouseX, { stiffness: 800, damping: 35 })
  const y = useSpring(mouseY, { stiffness: 800, damping: 35 })

  useEffect(() => {
    setIsTouch(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  useEffect(() => {
    if (isTouch) return

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    const onDown = () => setClick(true)
    const onUp = () => setClick(false)

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t?.closest?.('a,button,[role="button"],input,textarea,select,label,[data-hover]')) {
        setHover(true)
      }
    }
    const onOut = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t?.closest?.('a,button,[role="button"],input,textarea,select,label,[data-hover]')) {
        setHover(false)
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
    }
  }, [isTouch, mouseX, mouseY])

  if (isTouch) return null

  const size = click ? 6 : hover ? 40 : 8

  return (
    <motion.div
      className="fixed pointer-events-none z-[99999]"
      style={{
        left: x,
        top: y,
        x: '-50%',
        y: '-50%',
      }}
    >
      <motion.div
        animate={{ width: size, height: size }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`rounded-full transition-colors duration-200 ${
          hover
            ? 'border-[1.5px] border-[#1a1a1a] dark:border-[#e5e5e5]'
            : 'bg-[#1a1a1a] dark:bg-[#e5e5e5]'
        }`}
      />
    </motion.div>
  )
}
