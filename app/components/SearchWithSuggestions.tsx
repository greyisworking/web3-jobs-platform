'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Clock, TrendingUp, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const RECENT_KEY = 'recent-searches'
const MAX_RECENT = 10
const TRENDING_TAGS = ['Rust', 'Solidity', 'React', 'Remote']

interface SearchWithSuggestionsProps {
  onSearch: (query: string) => void
  jobs?: { title: string; company: string }[]
}

function loadRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecent(items: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, MAX_RECENT)))
}

export default function SearchWithSuggestions({
  onSearch,
  jobs = [],
}: SearchWithSuggestionsProps) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [popular, setPopular] = useState<{ query: string; count: number }[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setRecent(loadRecent())
    fetch('/api/search-log?popular=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.popular) setPopular(data.popular)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const autocomplete = query.length >= 2
    ? Array.from(
        new Set(
          jobs
            .flatMap((j) => [j.title, j.company])
            .filter((s) => s?.toLowerCase().includes(query.toLowerCase()))
        )
      ).slice(0, 5)
    : []

  const allSuggestions: { type: 'recent' | 'popular' | 'autocomplete'; text: string }[] = []

  if (!query) {
    recent.slice(0, 5).forEach((r) => allSuggestions.push({ type: 'recent', text: r }))
    popular.slice(0, 5).forEach((p) => allSuggestions.push({ type: 'popular', text: p.query }))
  } else {
    autocomplete.forEach((a) => allSuggestions.push({ type: 'autocomplete', text: a }))
  }

  const showDropdown = focused && allSuggestions.length > 0

  const submitSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) return

      onSearch(trimmed)
      setFocused(false)

      const updated = [trimmed, ...recent.filter((r) => r !== trimmed)].slice(0, MAX_RECENT)
      setRecent(updated)
      saveRecent(updated)

      fetch('/api/search-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      }).catch(() => {})
    },
    [onSearch, recent]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setActiveIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearch(value)
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, allSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && allSuggestions[activeIndex]) {
        const selected = allSuggestions[activeIndex].text
        setQuery(selected)
        submitSearch(selected)
      } else {
        submitSearch(query)
      }
    } else if (e.key === 'Escape') {
      setFocused(false)
      inputRef.current?.blur()
    }
  }

  const removeRecent = (item: string) => {
    const updated = recent.filter((r) => r !== item)
    setRecent(updated)
    saveRecent(updated)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sub-muted" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search jobs, companies, skills..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-2.5 border border-sub-border dark:border-sub-border-dark bg-white dark:bg-sub-dark-surface text-sub-charcoal dark:text-gray-200 focus:ring-2 focus:ring-sub-hotpink focus:border-sub-hotpink outline-none transition-colors text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              onSearch('')
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sub-muted hover:text-sub-charcoal"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Trending tags */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className="text-[11px] text-sub-muted dark:text-gray-400 uppercase tracking-wider">Trending:</span>
        {TRENDING_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => {
              setQuery(tag)
              submitSearch(tag)
            }}
            className="text-[11px] px-2.5 py-1 border border-sub-hotpink/30 text-sub-hotpink hover:bg-sub-hotpink/10 transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-sub-dark-surface border border-sub-border dark:border-sub-border-dark overflow-hidden z-50"
          >
            {allSuggestions.map((item, i) => {
              const isActive = i === activeIndex
              const Icon = item.type === 'recent' ? Clock : item.type === 'popular' ? TrendingUp : Search

              return (
                <button
                  key={`${item.type}-${item.text}`}
                  onClick={() => {
                    setQuery(item.text)
                    submitSearch(item.text)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                    isActive
                      ? 'bg-sub-hotpink/10 text-sub-hotpink'
                      : 'text-sub-charcoal dark:text-gray-300 hover:bg-sub-offwhite dark:hover:bg-sub-dark-bg'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0 text-sub-muted" />
                  <span className="flex-1 truncate">{item.text}</span>
                  {item.type === 'recent' && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        removeRecent(item.text)
                      }}
                      className="text-sub-muted hover:text-sub-hotpink cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
