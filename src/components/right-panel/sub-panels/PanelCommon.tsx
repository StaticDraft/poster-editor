import React from 'react'

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2 gap-2 overflow-hidden w-full">
      <span className="text-[11px] text-editor-text-label shrink-0 min-w-[65px] max-w-[110px] leading-tight pr-1 truncate" title={label}>
        {label}
      </span>
      <div className="flex-1 flex justify-end min-w-0 overflow-hidden">{children}</div>
    </div>
  )
}

export function NumInput({ value, onChange, w = 'w-20' }: { value: number; onChange: (v: number) => void; w?: string }) {
  return (
    <input
      type="number"
      value={Math.round(value * 100) / 100}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`${w} h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 text-right focus:outline-none focus:border-blue-500`}
    />
  )
}

export function ToggleCheck({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-blue-500 w-3.5 h-3.5" />
      <span className="text-[11px] text-editor-text-label">{label}</span>
    </label>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] font-bold text-editor-text-dim uppercase tracking-widest mb-2 pb-1 border-b border-border">{title}</div>
      {children}
    </div>
  )
}
