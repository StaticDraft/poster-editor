import { useEditorStore } from '@/store/useEditorStore'

export function MiniMap() {
  const elements = useEditorStore(s => s.elements)

  return (
    <div className="absolute bottom-6 right-6 w-48 h-32 bg-background/80 backdrop-blur border border-border shadow-2xl rounded-lg overflow-hidden z-40">
      <div className="relative w-full h-full scale-[0.08] origin-top-left">
        {elements.map(el => (
          <div
            key={el.id}
            className="absolute border-[10px] border-primary/50 shadow-sm"
            style={{
              left: el.x,
              top: el.y,
              width: el.width || 100,
              height: el.height || 100,
              backgroundColor: typeof el.fill === 'string' ? el.fill : (el.fill && (el.fill as any).stops?.[0]) || 'rgba(255,255,255,0.2)',
              borderRadius: el.type === 'Ellipse' ? '50%' : 0,
            }}
          />
        ))}
      </div>
      <div className="absolute bottom-1 right-2 text-[9px] font-mono text-muted-foreground font-bold">
        MINIMAP
      </div>
    </div>
  )
}
