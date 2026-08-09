import { useTranslation } from 'react-i18next'
import { useEditorStore } from '@/store/useEditorStore'
import { FontManager } from '../FontManager'
import { Row, NumInput, ToggleCheck, Section } from './PanelCommon'

export function ComponentPropsSubPanel({ node }: { node: any }) {
  const { t } = useTranslation()
  const updateNode = useEditorStore((s) => s.updateNode)
  const p = node.props || {}
  const u = (k: string, v: any) => updateNode(node.id, { props: { ...p, [k]: v } })

  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

  if (node.type === 'Text') {
    return (
      <div className="p-3 border-t border-border mt-2">
        <Section title={tr('config.component.textStyle', '高级文字版式')}>
          <Row label={tr('config.component.fontSize', '文字字号')}>
            <NumInput value={p.fontSize || 16} onChange={(v) => u('fontSize', v)} />
          </Row>
          <Row label={tr('config.component.fontFamily', '字体包')}>
            <FontManager value={p.fontFamily || 'Inter'} onChange={(v) => u('fontFamily', v)} />
          </Row>
          <Row label={tr('config.component.textAlign', '对齐分布')}>
            <select
              value={p.textAlign || 'left'}
              onChange={(e) => u('textAlign', e.target.value)}
              className="flex-1 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 focus:outline-none bg-card"
            >
              <option value="left">{tr('config.component.alignLeft', '左对齐')}</option>
              <option value="center">{tr('config.component.alignCenter', '水平居中对齐')}</option>
              <option value="right">{tr('config.component.alignRight', '右对齐')}</option>
            </select>
          </Row>
          <Row label={tr('config.component.letterSpacing', '字距调整')}>
            <input
              type="text"
              value={p.letterSpacing || '0px'}
              onChange={(e) => u('letterSpacing', e.target.value)}
              className="w-20 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 text-right focus:outline-none"
            />
          </Row>
          <Row label={tr('config.component.lineHeight', '行高大小')}>
            <input
              type="text"
              value={p.lineHeight || '1.2'}
              onChange={(e) => u('lineHeight', e.target.value)}
              className="w-20 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 text-right focus:outline-none"
            />
          </Row>
          <div className="flex flex-wrap gap-2 mt-3">
            <ToggleCheck checked={!!p.bold} onChange={(v) => u('bold', v)} label={tr('config.component.bold', '加粗')} />
            <ToggleCheck checked={!!p.italic} onChange={(v) => u('italic', v)} label={tr('config.component.italic', '斜体')} />
            <ToggleCheck checked={!!p.underline} onChange={(v) => u('underline', v)} label={tr('config.component.underline', '下划线')} />
          </div>
        </Section>
      </div>
    )
  }

  if (node.type === 'QRCode' || node.type === 'Barcode') {
    const labelText =
      node.type === 'QRCode'
        ? tr('config.component.qrText', '二维码跳转内容/网址')
        : tr('config.component.barcodeText', '条形码编码数字')
    const defaultText = node.type === 'QRCode' ? 'https://postercraft.app' : '690123456789'
    return (
      <div className="p-3 border-t border-border mt-2">
        <Section
          title={
            node.type === 'QRCode'
              ? tr('config.component.qrConfig', '二维码动态配置')
              : tr('config.component.barcodeConfig', '条形码动态配置')
          }
        >
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] text-editor-text-dim">{labelText}</div>
            <textarea
              rows={3}
              value={node.text || defaultText}
              onChange={(e) => updateNode(node.id, { text: e.target.value })}
              className="w-full bg-editor-deep border border-border text-editor-text text-xs rounded p-2 focus:outline-none focus:border-blue-500 font-mono resize-none"
              placeholder={tr('config.component.placeholderData', '请输入数据...')}
            />
            <div className="text-[10px] text-emerald-400 font-bold">
              {tr('config.component.realtimeCodeHint', '✨ 修改上方文本后，画布中的码图形将实时重新生成')}
            </div>
          </div>
        </Section>
      </div>
    )
  }

  if (node.type === 'Image') {
    return (
      <div className="p-3 border-t border-border mt-2">
        <Section title={tr('config.component.imagePropsAndFilters', '图片属性与滤镜')}>
          <Row label={tr('config.component.fillMode', '填充模式')}>
            <select
              value={p.contain ? 'contain' : 'cover'}
              onChange={(e) => u('contain', e.target.value === 'contain')}
              className="flex-1 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 focus:outline-none bg-card"
            >
              <option value="cover">{tr('config.component.cover', '裁剪填充 (Cover)')}</option>
              <option value="contain">{tr('config.component.contain', '等比完整 (Contain)')}</option>
            </select>
          </Row>
          <Row label={tr('config.component.filterEffect', '滤镜特效')}>
            <select
              value={p.filter || 'none'}
              onChange={(e) => u('filter', e.target.value)}
              className="flex-1 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 focus:outline-none bg-card"
            >
              <option value="none">{tr('config.component.filterNone', '原图无滤镜')}</option>
              <option value="grayscale(100%)">{tr('config.component.filterGrayscale', '黑白怀旧')}</option>
              <option value="sepia(80%)">{tr('config.component.filterSepia', '暖调复古')}</option>
              <option value="blur(4px)">{tr('config.component.filterBlur', '模糊马赛克')}</option>
              <option value="brightness(130%)">{tr('config.component.filterBrightness', '高光提亮')}</option>
              <option value="contrast(150%)">{tr('config.component.filterContrast', '高对比胶片')}</option>
            </select>
          </Row>
        </Section>
      </div>
    )
  }

  return null
}
