import type { EditorNode } from '@/store/useEditorStore'
import { enhanceElementProps, instantiateLeaferNode } from './factories/ElementFactory'
import { executeAnimationStrategy } from './factories/AnimationRegistry'

// Global Polyfill: Protect Leafer UI's __updateRenderSpread against missing getSpread on Shadow objects
if (typeof (Object.prototype as any).getSpread !== 'function') {
  Object.defineProperty(Object.prototype, 'getSpread', {
    value: function (this: any) {
      return this.spread || this.blur || 0
    },
    configurable: true,
    writable: true,
  })
}

type LeaferNode = any

interface RuntimeOptions {
  editable: boolean
  draggable: boolean
}

export function bgColorToFill(bgColor: any): any {
  if (!bgColor) return '#ffffff'
  if (typeof bgColor === 'string') return bgColor
  if (typeof bgColor === 'object') {
    if (bgColor.type === 'image' && bgColor.url) {
      return { type: 'image', url: bgColor.url, mode: bgColor.mode || 'cover' }
    }
    if ((bgColor.type === 'linear' || bgColor.type === 'radial') && Array.isArray(bgColor.stops)) {
      const dirMap: Record<string, string> = {
        'top': 'to bottom', 'bottom': 'to top',
        'left': 'to right', 'right': 'to left',
        'top-left': 'to bottom right', 'center': 'to bottom',
      }
      if (bgColor.type === 'radial') {
        return {
          type: 'radial',
          stops: bgColor.stops.map((c: string, i: number, arr: string[]) => ({
            offset: i / Math.max(1, arr.length - 1),
            color: c,
          })),
        }
      }
      return {
        type: 'linear',
        from: dirMap[bgColor.from] || 'to bottom',
        stops: bgColor.stops.map((c: string, i: number, arr: string[]) => ({
          offset: i / Math.max(1, arr.length - 1),
          color: c,
        })),
      }
    }
  }
  return '#ffffff'
}

const VISUAL_PROP_KEYS = [
  'stroke',
  'strokeWidth',
  'cornerRadius',
  'shadow',
  'shadowColor',
  'shadowBlur',
  'shadowX',
  'shadowY',
  'fontSize',
  'fontFamily',
  'textAlign',
  'letterSpacing',
  'lineHeight',
  'filter',
  'mode',
  'contain',
]

export function parseShadow(source: Record<string, any> = {}): string | undefined {
  if (!source) return undefined
  const shadowVal = source.shadow
  if (shadowVal && typeof shadowVal === 'string') return shadowVal
  if (typeof shadowVal === 'object' && shadowVal !== null) {
    const x = shadowVal.x || 0
    const y = shadowVal.y || 4
    const blur = shadowVal.blur || 8
    const color = shadowVal.color || 'rgba(0, 0, 0, 0.25)'
    return `${x}px ${y}px ${blur}px ${color}`
  }
  const shadowColor = source.shadowColor || source.shadowcolor
  const shadowBlur = source.shadowBlur || source.shadowblur
  const shadowX = source.shadowX || source.shadowx
  const shadowY = source.shadowY || source.shadowy
  if (shadowColor || shadowBlur || shadowX || shadowY) {
    const x = shadowX || 0
    const y = shadowY || 4
    const blur = shadowBlur || 8
    const color = shadowColor || 'rgba(0, 0, 0, 0.25)'
    return `${x}px ${y}px ${blur}px ${color}`
  }
  return undefined
}

function pickVisualProps(source: Record<string, any> = {}) {
  const picked: Record<string, any> = {}

  VISUAL_PROP_KEYS.forEach((key) => {
    if (source[key] !== undefined) picked[key] = source[key]
  })

  if (source.bold !== undefined) picked.fontWeight = source.bold ? 'bold' : 'normal'
  if (source.italic !== undefined) picked.fontStyle = source.italic ? 'italic' : 'normal'
  if (source.underline !== undefined) picked.textDecoration = source.underline ? 'underline' : 'none'

  const shadowStr = parseShadow(source)
  if (shadowStr) {
    picked.shadow = shadowStr
  } else {
    delete picked.shadow
  }

  return picked
}

const LOADED_FONTS = new Set<string>()

export function loadFont(fontFamily: string) {
  if (!fontFamily || LOADED_FONTS.has(fontFamily)) return
  LOADED_FONTS.add(fontFamily)

  const fontName = fontFamily.trim()
  const linkId = `font-link-${fontName.toLowerCase().replace(/\s+/g, '-')}`
  if (document.getElementById(linkId)) return

  const link = document.createElement('link')
  link.id = linkId
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}&display=swap`
  document.head.appendChild(link)
}

export function buildLeaferNodeProps(el: EditorNode & Record<string, any>, options: RuntimeOptions) {
  const { animation, hidden, locked, props } = el
  if (props?.fontFamily) {
    loadFont(props.fontFamily)
  }
  const base: Record<string, any> = { ...el }
  delete base.animation
  delete base.hidden
  delete base.locked
  delete base.props
  delete base.name
  delete base.nameKey
  delete base.shadow
  delete base.shadowColor
  delete base.shadowBlur
  delete base.shadowX
  delete base.shadowY

  const runtimeProps: Record<string, any> = {
    ...base,
    ...pickVisualProps(props),
    editable: options.editable && !locked,
    draggable: options.draggable && !hidden && !locked && !props?.noMove,
    visible: !hidden,
    hittable: !hidden,
  }

  // Ensure shadow is sanitized to CSS string format
  const sanitizedShadow = parseShadow(props) || parseShadow(el)
  if (sanitizedShadow) {
    runtimeProps.shadow = sanitizedShadow
  } else {
    delete runtimeProps.shadow
  }

  if (props?.contain !== undefined || props?.mode) {
    runtimeProps.mode = props?.contain ? 'contain' : (props?.mode || 'cover')
  }

  enhanceElementProps(el, runtimeProps)

  if (el.type !== 'Path') {
    runtimeProps.scaleX = props?.flipH ? -1 : 1
    runtimeProps.scaleY = props?.flipV ? -1 : 1
  }
  if (props?.flipH || props?.flipV || animation?.type === 'spin') runtimeProps.around = 'center'

  return runtimeProps
}

export function applyAnimation(node: LeaferNode, anim: any, autoplay: boolean) {
  executeAnimationStrategy(node, anim, autoplay)
}

export function createLeaferNode(el: EditorNode & Record<string, any>, options: RuntimeOptions) {
  const runtimeProps = buildLeaferNodeProps(el, options)
  return instantiateLeaferNode(el.type, runtimeProps)
}

export function syncLeaferNode(node: LeaferNode, el: EditorNode & Record<string, any>, options: RuntimeOptions) {
  const runtimeProps = buildLeaferNodeProps(el, options)
  if (!runtimeProps.shadow && node.shadow) {
    node.shadow = undefined
  }
  node.set(runtimeProps)
}

export function isLeaferImageNodeReady(node: LeaferNode, expectedUrl?: string) {
  if (!node || !expectedUrl) return false

  const currentUrl = String(node.url || '')
  if (currentUrl !== expectedUrl) return false

  return Boolean(node.ready || node.image?.ready)
}
