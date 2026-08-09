import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '@/store/useEditorStore'
import { AppearanceSubPanel } from './sub-panels/AppearanceSubPanel'
import { AnimationSubPanel } from './sub-panels/AnimationSubPanel'
import { ComponentPropsSubPanel } from './sub-panels/ComponentPropsSubPanel'

const TABS = ['appearance', 'animation'] as const
type TabType = typeof TABS[number]

export function ConfigPanel() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<TabType>('appearance')
  const activeIds = useEditorStore((s) => s.activeIds)
  const elements = useEditorStore((s) => s.elements)

  const activeNode = activeIds.length >= 1 ? elements.find((el) => el.id === activeIds[0]) : null

  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

  if (!activeNode) {
    return (
      <div className="flex-1 flex items-center justify-center text-editor-text-dim text-xs text-center p-4">
        {activeIds.length > 1
          ? tr('config.multiSelect', `已选中 ${activeIds.length} 个元素`)
          : tr('config.selectHint', '点击画布中的元素以配置其外观样式属性')}
      </div>
    )
  }

  const getNodeTypeName = (type: string) => {
    if (type === 'Text') return tr('config.nodeType.text', '文字图元')
    if (type === 'Image') return tr('config.nodeType.image', '图片图元')
    if (type === 'Mosaic') return tr('config.nodeType.mosaic', '马赛克遮罩')
    if (type === 'QRCode' || type === 'Barcode') return tr('config.nodeType.code', '条码图元')
    return tr('config.nodeType.shape', '几何图形')
  }

  return (
    <div className="flex flex-col h-full text-editor-text w-full max-w-full overflow-x-hidden">
      {/* Node name + type badge */}
      <div className="px-4 py-2.5 border-b border-editor-darker flex items-center justify-between shrink-0">
        <span className="text-xs font-bold text-editor-text truncate">{getNodeTypeName(activeNode.type)}</span>
        <span className="text-[10px] bg-blue-600/30 text-blue-400 rounded px-2 py-0.5 font-mono">
          {activeNode.id.slice(0, 10)}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-editor-darker shrink-0">
        {TABS.map((t2) => (
          <button
            key={t2}
            onClick={() => setTab(t2)}
            className={`flex-1 py-2 text-[11px] font-bold transition-colors ${
              tab === t2 ? 'border-b-2 border-blue-500 text-blue-500' : 'text-editor-text-label hover:text-editor-text'
            }`}
          >
            {t(`config.tabs.${t2}`)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full">
        {tab === 'appearance' && <AppearanceSubPanel node={activeNode} />}
        {tab === 'animation' && <AnimationSubPanel node={activeNode} />}
        <ComponentPropsSubPanel node={activeNode} />
      </div>
    </div>
  )
}
