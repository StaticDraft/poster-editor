import { useTranslation } from 'react-i18next'
import { useEditorStore } from '@/store/useEditorStore'
import { Row, Section } from './PanelCommon'

export function AnimationSubPanel({ node }: { node: any }) {
  const { t } = useTranslation()
  const updateNode = useEditorStore((s) => s.updateNode)
  const anim = node.animation || {}

  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

  return (
    <div className="p-3">
      <Section title={tr('config.animation.title', '动效状态')}>
        <Row label={tr('config.animation.type', '动画特效')}>
          <select
            value={anim.type || ''}
            onChange={(e) => {
              const val = e.target.value
              updateNode(node.id, {
                animation: val ? { type: val as 'spin' | 'breathe', duration: anim.duration || 2 } : undefined,
              })
            }}
            className="flex-1 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 focus:outline-none bg-card"
          >
            <option value="">{tr('config.animation.none', '静止 (无动画)')}</option>
            <option value="spin">{tr('config.animation.spin', '旋转 (Spin)')}</option>
            <option value="breathe">{tr('config.animation.breathe', '呼吸灯 (Breathe)')}</option>
          </select>
        </Row>
        {anim.type && (
          <Row label={tr('config.animation.duration', '持续周期')}>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="range"
                min="0.2"
                max="10"
                step="0.1"
                value={anim.duration || 2}
                onChange={(e) => updateNode(node.id, { animation: { ...anim, duration: Number(e.target.value) } })}
                className="flex-1 accent-blue-500"
              />
              <span className="text-xs text-editor-text w-8 text-right">{anim.duration || 2}s</span>
            </div>
          </Row>
        )}
      </Section>
    </div>
  )
}
