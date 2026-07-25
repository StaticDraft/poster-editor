import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Search, ChevronDown, Star, CheckCircle, X, Sparkles, Type } from 'lucide-react'
import { FONT_LIST, FONT_CATEGORIES, type FontEntry } from '@/core/fonts/fontList'
import { loadFont } from '@/core/leafer/runtime'
import { useEditorStore } from '@/store/useEditorStore'

const RECENT_FONTS_KEY = 'poster_recent_fonts'
const MAX_RECENT = 6

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
  const [previewText, setPreviewText] = useState('设计狂欢夜 Design Party')
  const searchRef = useRef<HTMLInputElement>(null)

  const activeIds = useEditorStore(s => s.activeIds)
  const elements = useEditorStore(s => s.elements)

  const tr = (key: string, fallback: string) => {
    const val = t(key)
    return val === key ? fallback : val
  }

  // Auto-fill preview text with selected text element content if available
  useEffect(() => {
    if (activeIds.length === 1) {
      const node = elements.find(e => e.id === activeIds[0])
      if (node?.type === 'Text' && node.text) {
        setPreviewText(node.text)
      }
    }
  }, [activeIds, elements, isOpen])

  // Lazy-load font CSS for preview
  const ensureFontLoaded = (family: string) => {
    if (loadedFonts.has(family)) return
    loadFont(family)
    setLoadedFonts(prev => new Set(prev).add(family))
  }

  // Preload all fonts when modal opens for smooth live preview rendering
  useEffect(() => {
    if (!isOpen) return
    FONT_LIST.forEach(f => ensureFontLoaded(f.family))
  }, [isOpen])

  // Keyboard escape key listener
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in-0">
      {/* Modal Dialog Container */}
      <div
        className="relative w-full max-w-4xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                {tr('font.title', '字体库与文字工坊')}
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {tr('font.subtitle', '实时预览字体效果，一键套用到选中的海报文案。')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search, Filter & Live Text Input Bar */}
        <div className="p-4 border-b border-border bg-muted/10 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2 bg-background border border-border rounded-lg px-3 h-9 focus-within:border-blue-500 transition-colors">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tr('font.searchPlaceholder', '搜索字体名称...')}
                className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="text-xs text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              )}
            </div>

            {/* Custom Live Preview Text Input */}
            <div className="flex-1 flex items-center gap-2 bg-background border border-border rounded-lg px-3 h-9 focus-within:border-blue-500 transition-colors">
              <span className="text-[11px] font-bold text-muted-foreground shrink-0">预览:</span>
              <input
                type="text"
                value={previewText}
                onChange={e => setPreviewText(e.target.value)}
                placeholder={tr('font.previewPlaceholder', '输入自定义预览文案...')}
                className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground font-medium"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar pt-1">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1 rounded-md text-xs font-semibold shrink-0 transition-colors ${
                activeCategory === null
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tr('font.category.all', '全部')} ({FONT_LIST.length})
            </button>
            {FONT_CATEGORIES.map(cat => {
              const count = FONT_LIST.filter(f => f.category === cat.key).length
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold shrink-0 transition-colors ${
                    activeCategory === cat.key
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {tr(cat.labelKey, cat.fallback)} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Font List / Grid Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Recently Used Fonts Section */}
          {!search && !activeCategory && recentFonts.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{tr('font.recent', '最近使用')}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {recentFonts.map(font => {
                  const isSelected = value === font.family
                  return (
                    <button
                      key={`recent-${font.family}`}
                      type="button"
                      onClick={() => handleSelect(font)}
                      className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all group ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                          : 'border-border/80 bg-card hover:border-blue-400 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full mb-1">
                        <span className="text-xs font-bold text-foreground truncate">{font.displayName}</span>
                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                      </div>
                      <div
                        className="text-base font-semibold text-foreground/90 truncate py-1"
                        style={{ fontFamily: font.family }}
                      >
                        {previewText || font.sampleText || font.displayName}
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="border-b border-border/60 my-3" />
            </div>
          )}

          {/* Main Font Grid */}
          {filteredFonts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs font-medium">
              {tr('font.noMatch', '没有找到匹配的字体')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredFonts.map(font => {
                const isSelected = value === font.family
                return (
                  <button
                    key={font.family}
                    type="button"
                    onClick={() => handleSelect(font)}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all group relative overflow-hidden ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30 shadow-md'
                        : 'border-border/70 bg-card/60 hover:bg-card hover:border-blue-400 hover:shadow-md'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-2 w-full mb-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-foreground group-hover:text-blue-400 transition-colors truncate">
                          {font.displayName}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 font-mono truncate">
                          ({font.family})
                        </span>
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />}
                    </div>

                    {/* Live Font Typography Preview */}
                    <div
                      className="text-lg font-bold text-foreground/90 py-2 truncate leading-normal"
                      style={{ fontFamily: font.family }}
                    >
                      {previewText || font.sampleText || font.displayName}
                    </div>

                    {/* Footer category badge */}
                    <div className="mt-2 flex items-center justify-between pt-2 border-t border-border/30 text-[10px] text-muted-foreground">
                      <span className="bg-muted px-2 py-0.5 rounded text-[9px] font-medium uppercase">
                        {font.category}
                      </span>
                      <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                        选择应用 →
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className="w-full">
      {/* Trigger Button in Property Panel */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full h-8 bg-editor-deep hover:bg-editor-surface border border-border text-editor-text text-xs rounded px-2.5 flex items-center justify-between focus:outline-none focus:border-blue-500 transition-colors shadow-xs"
      >
        <span className="truncate font-semibold" style={{ fontFamily: value }}>
          {currentFont?.displayName || value}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1 opacity-70" />
      </button>

      {/* Centered Screen Modal Dialog */}
      {modalContent && createPortal(modalContent, document.body)}
    </div>
  )
}
