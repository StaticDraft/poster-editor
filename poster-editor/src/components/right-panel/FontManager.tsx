import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Search, ChevronDown, Star, Check } from 'lucide-react'
import { FONT_LIST, FONT_CATEGORIES, type FontEntry } from '@/core/fonts/fontList'
import { loadFont } from '@/core/leafer/runtime'

const RECENT_FONTS_KEY = 'poster_recent_fonts'
const MAX_RECENT = 5

function getRecentFonts(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_FONTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function addRecentFont(family: string) {
  const recent = getRecentFonts().filter(f => f !== family)
  recent.unshift(family)
  localStorage.setItem(RECENT_FONTS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

interface FontManagerProps {
  value: string
  onChange: (family: string) => void
}

export function FontManager({ value, onChange }: FontManagerProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set())
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 260 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const tr = (key: string, fallback: string) => {
    const val = t(key)
    return val === key ? fallback : val
  }

  // Position the dropdown relative to the trigger button
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const dropdownWidth = 260
    // Position below the trigger, aligned to the right edge of the trigger
    let left = rect.right - dropdownWidth
    if (left < 8) left = 8
    setDropdownPos({
      top: rect.bottom + 4,
      left,
      width: dropdownWidth,
    })
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Focus search when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50)
    } else {
      setSearch('')
      setActiveCategory(null)
    }
  }, [isOpen])

  // Lazy-load font CSS for preview
  const ensureFontLoaded = (family: string) => {
    if (loadedFonts.has(family)) return
    loadFont(family)
    setLoadedFonts(prev => new Set(prev).add(family))
  }

  // Load visible fonts for preview
  useEffect(() => {
    if (!isOpen) return
    const toLoad = FONT_LIST.slice(0, 12)
    toLoad.forEach(f => ensureFontLoaded(f.family))
  }, [isOpen])

  const recentFamilies = useMemo(() => getRecentFonts(), [isOpen])
  const recentFonts = useMemo(
    () => recentFamilies.map(f => FONT_LIST.find(ff => ff.family === f)).filter(Boolean) as FontEntry[],
    [recentFamilies],
  )

  const filteredFonts = useMemo(() => {
    let list = FONT_LIST
    if (activeCategory) {
      list = list.filter(f => f.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        f => f.family.toLowerCase().includes(q) || f.displayName.toLowerCase().includes(q),
      )
    }
    return list
  }, [activeCategory, search])

  const handleSelect = (font: FontEntry) => {
    ensureFontLoaded(font.family)
    addRecentFont(font.family)
    onChange(font.family)
    setIsOpen(false)
  }

  const currentFont = FONT_LIST.find(f => f.family === value)

  const dropdown = isOpen ? createPortal(
    <div
      ref={dropdownRef}
      className="fixed bg-card border border-border rounded-lg shadow-2xl overflow-hidden"
      style={{
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 9999,
      }}
    >
      {/* Search bar */}
      <div className="p-2 border-b border-border">
        <div className="flex items-center gap-1.5 bg-editor-deep rounded-md px-2 h-7">
          <Search className="w-3 h-3 text-editor-text-dim shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tr('font.searchPlaceholder', '搜索字体...')}
            className="flex-1 bg-transparent text-xs text-editor-text outline-none placeholder:text-editor-text-dim"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-0.5 px-2 py-1.5 border-b border-border overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveCategory(null)}
          className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
            activeCategory === null
              ? 'bg-blue-600 text-white'
              : 'text-editor-text-label hover:text-editor-text hover:bg-editor-surface'
          }`}
        >
          {tr('font.category.all', '全部')}
        </button>
        {FONT_CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              activeCategory === cat.key
                ? 'bg-blue-600 text-white'
                : 'text-editor-text-label hover:text-editor-text hover:bg-editor-surface'
            }`}
          >
            {tr(cat.labelKey, cat.fallback)}
          </button>
        ))}
      </div>

      {/* Font list */}
      <div className="max-h-[320px] overflow-y-auto">
        {/* Recent fonts */}
        {!search && !activeCategory && recentFonts.length > 0 && (
          <div>
            <div className="px-3 py-1.5 text-[9px] font-bold text-editor-text-dim uppercase tracking-wider flex items-center gap-1">
              <Star className="w-2.5 h-2.5" />
              {tr('font.recent', '最近使用')}
            </div>
            {recentFonts.map(font => (
              <FontRow
                key={`recent-${font.family}`}
                font={font}
                isSelected={value === font.family}
                onSelect={handleSelect}
                onHover={ensureFontLoaded}
              />
            ))}
            <div className="mx-3 border-b border-border" />
          </div>
        )}

        {/* All fonts (grouped or flat) */}
        {!activeCategory && !search ? (
          FONT_CATEGORIES.map(cat => {
            const fonts = FONT_LIST.filter(f => f.category === cat.key)
            if (fonts.length === 0) return null
            return (
              <div key={cat.key}>
                <div className="px-3 py-1.5 text-[9px] font-bold text-editor-text-dim uppercase tracking-wider">
                  {tr(cat.labelKey, cat.fallback)}
                </div>
                {fonts.map(font => (
                  <FontRow
                    key={font.family}
                    font={font}
                    isSelected={value === font.family}
                    onSelect={handleSelect}
                    onHover={ensureFontLoaded}
                  />
                ))}
              </div>
            )
          })
        ) : (
          filteredFonts.length === 0 ? (
            <div className="text-center text-editor-text-dim text-xs py-8">
              {tr('font.noResults', '没有找到匹配的字体')}
            </div>
          ) : (
            filteredFonts.map(font => (
              <FontRow
                key={font.family}
                font={font}
                isSelected={value === font.family}
                onSelect={handleSelect}
                onHover={ensureFontLoaded}
              />
            ))
          )
        )}
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full h-8 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 hover:border-blue-500/50 transition-colors focus:outline-none"
      >
        <span
          className="flex-1 text-left truncate"
          style={{ fontFamily: value }}
        >
          {currentFont?.displayName || value}
        </span>
        <ChevronDown className={`w-3 h-3 text-editor-text-dim transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdown}
    </div>
  )
}

function FontRow({
  font,
  isSelected,
  onSelect,
  onHover,
}: {
  font: FontEntry
  isSelected: boolean
  onSelect: (font: FontEntry) => void
  onHover: (family: string) => void
}) {
  return (
    <button
      onClick={() => onSelect(font)}
      onMouseEnter={() => onHover(font.family)}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
        isSelected
          ? 'bg-blue-600/20 text-blue-400'
          : 'hover:bg-editor-surface text-editor-text'
      }`}
    >
      <span
        className="flex-1 text-sm truncate"
        style={{ fontFamily: font.family }}
      >
        {font.sampleText || font.displayName}
      </span>
      <span className="text-[9px] text-editor-text-dim shrink-0">
        {font.displayName !== font.family ? font.family : ''}
      </span>
      {isSelected && <Check className="w-3 h-3 text-blue-400 shrink-0" />}
    </button>
  )
}
