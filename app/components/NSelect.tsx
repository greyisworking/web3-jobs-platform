'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

interface NSelectOption {
  value: string
  label: string
}

interface NSelectProps {
  value: string
  onChange: (value: string) => void
  options: NSelectOption[]
  placeholder?: string
  label?: string
  className?: string
}

export default function NSelect({ value, onChange, options, placeholder = 'All', label, className = '' }: NSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <span className="block text-[10px] uppercase tracking-[0.2em] text-a24-muted dark:text-a24-dark-muted mb-1">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          w-full flex items-center justify-between gap-2
          px-2.5 py-1.5 text-sm rounded-md
          border transition-colors duration-150 cursor-pointer
          ${open
            ? 'border-neun-success/40 ring-1 ring-neun-success/20'
            : 'border-a24-border dark:border-a24-dark-border hover:border-a24-muted/40 dark:hover:border-a24-dark-muted/40'
          }
          bg-a24-surface dark:bg-a24-dark-surface
          text-a24-text dark:text-a24-dark-text
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${!selected ? 'text-a24-muted dark:text-a24-dark-muted' : ''}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-a24-muted dark:text-a24-dark-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="
              absolute z-50 mt-1 w-full
              max-h-60 overflow-auto
              rounded-md border border-a24-border dark:border-a24-dark-border
              bg-a24-surface dark:bg-a24-dark-surface
              shadow-lg shadow-black/20
              py-1
            "
          >
            {options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={`
                    flex items-center justify-between gap-2
                    px-2.5 py-1.5 text-sm cursor-pointer
                    transition-colors duration-100
                    ${isSelected
                      ? 'text-neun-success bg-neun-success/5'
                      : 'text-a24-text dark:text-a24-dark-text hover:bg-a24-bg/50 dark:hover:bg-a24-dark-bg/50'
                    }
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-neun-success" />}
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
