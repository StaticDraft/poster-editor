import React from 'react'
import { useTranslation } from 'react-i18next'

export function parseColorWithAlpha(colorStr: string): { hex: string; alpha: number } {
  if (!colorStr || typeof colorStr !== 'string') return { hex: '#3b82f6', alpha: 1 }
  const s = colorStr.trim()
  if (s.startsWith('rgba') || s.startsWith('rgb')) {
    const match = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/)
    if (match) {
      const r = Math.min(255, parseInt(match[1], 10))
      const g = Math.min(255, parseInt(match[2], 10))
      const b = Math.min(255, parseInt(match[3], 10))
      const a = match[4] !== undefined ? parseFloat(match[4]) : 1
      const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
      return { hex, alpha: Math.round(a * 100) / 100 }
    }
  }
  if (s.startsWith('#') && s.length === 9) { // #RRGGBBAA
    const hex = s.slice(0, 7)
    const a = parseInt(s.slice(7), 16) / 255
    return { hex, alpha: Math.round(a * 100) / 100 }
  }
  if (s.startsWith('#') && s.length === 7) {
    return { hex: s, alpha: 1 }
  }
  if (s.startsWith('#') && s.length === 4) {
    const r = s[1] + s[1]
    const g = s[2] + s[2]
    const b = s[3] + s[3]
    return { hex: `#${r}${g}${b}`, alpha: 1 }
  }
  return { hex: '#3b82f6', alpha: 1 }
}

export function hexToRgba(hex: string, alpha: number): string {
  if (alpha >= 1) return hex
  let c = (hex || '#000000').replace('#', '')
  if (c.length === 3) c = c.split('').map(x => x + x).join('')
  const r = parseInt(c.substring(0, 2), 16) || 0
  const g = parseInt(c.substring(2, 4), 16) || 0
  const b = parseInt(c.substring(4, 6), 16) || 0
  return `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 100) / 100})`
}

interface ColorPickerWithAlphaProps {
  value: string
  onChange: (newColor: string) => void
  showLabel?: boolean
  className?: string
}

export function ColorPickerWithAlpha({ value, onChange, showLabel = true, className = '' }: ColorPickerWithAlphaProps) {
  const { t } = useTranslation()
  const { hex, alpha } = parseColorWithAlpha(value)

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value
    onChange(hexToRgba(newHex, alpha))
  }

  const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAlpha = parseFloat(e.target.value)
    onChange(hexToRgba(hex, newAlpha))
  }

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={handleHexChange}
          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent shrink-0"
        />
        {showLabel && (
          <span className="text-xs text-editor-text-label font-mono uppercase truncate flex-1">
            {value}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-editor-text-dim shrink-0">{t('config.appearance.opacity')}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={alpha}
          onChange={handleAlphaChange}
          className="flex-1 h-1.5 accent-blue-500 bg-editor-deep rounded cursor-pointer"
        />
        <span className="text-[10px] font-mono text-editor-text w-8 text-right shrink-0">
          {Math.round(alpha * 100)}%
        </span>
      </div>
    </div>
  )
}
