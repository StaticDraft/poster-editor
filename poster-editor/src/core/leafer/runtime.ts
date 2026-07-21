import { Rect, Ellipse, Text, Star, Image, Path } from 'leafer-ui'
import { generateQRCodeSVG, generateBarcodeDataUrl } from '@/lib/qrcode'
import type { EditorNode } from '@/store/useEditorStore'

type LeaferNode = any

interface RuntimeOptions {
  editable: boolean
  draggable: boolean
}

const PATH_FALLBACK = 'M0 0 L100 0 L100 100 L0 100 Z'

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
]

function pickVisualProps(source: Record<string, any> = {}) {
  const picked: Record<string, any> = {}

  VISUAL_PROP_KEYS.forEach((key) => {
    if (source[key] !== undefined) picked[key] = source[key]
  })

  if (source.bold !== undefined) picked.fontWeight = source.bold ? 'bold' : 'normal'
  if (source.italic !== undefined) picked.fontStyle = source.italic ? 'italic' : 'normal'
  if (source.underline !== undefined) picked.textDecoration = source.underline ? 'underline' : 'none'

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

  const runtimeProps: Record<string, any> = {
    ...base,
    ...pickVisualProps(props),
    editable: options.editable && !locked,
    draggable: options.draggable && !hidden && !locked && !props?.noMove,
    visible: !hidden,
    hittable: !hidden,
  }

  if (props?.contain) runtimeProps.objectFit = 'contain'
  if (props?.filter && props.filter !== 'none') runtimeProps.filter = props.filter

  if (el.type === 'QRCode') {
    runtimeProps.url = generateQRCodeSVG(el.text || props?.text || 'https://postercraft.app')
  }
  if (el.type === 'Barcode') {
    runtimeProps.url = generateBarcodeDataUrl(el.text || props?.text || '690123456789')
  }

  if (el.type === 'Path') {
    const width = el.width || 100
    const height = el.height || 100
    runtimeProps.path = el.unitPath || PATH_FALLBACK
    runtimeProps.scaleX = (width / 100) * (props?.flipH ? -1 : 1)
    runtimeProps.scaleY = (height / 100) * (props?.flipV ? -1 : 1)
    runtimeProps.width = width
    runtimeProps.height = height
    if (props?.flipH || props?.flipV || animation?.type === 'spin') runtimeProps.around = 'center'
    return runtimeProps
  }

  runtimeProps.scaleX = props?.flipH ? -1 : 1
  runtimeProps.scaleY = props?.flipV ? -1 : 1
  if (props?.flipH || props?.flipV || animation?.type === 'spin') runtimeProps.around = 'center'

  return runtimeProps
}

export function applyAnimation(node: LeaferNode, anim: any, autoplay: boolean) {
  if (node.__animationRef) {
    try { node.__animationRef.stop() } catch {}
    try { node.__animationRef.destroy() } catch {}
    node.__animationRef = null
    node.rotation = 0
    node.opacity = 1
  }

  if (!anim || anim.type === 'none') return

  if (anim.type === 'spin') {
    node.around = 'center'
    node.__animationRef = node.animate({ rotation: 360 }, { duration: anim.duration || 2, loop: true })
  } else if (anim.type === 'breathe') {
    node.__animationRef = node.animate({ opacity: 0.2 }, { duration: anim.duration || 1, loop: true, yoyo: true })
  }

  if (!autoplay && node.__animationRef) {
    setTimeout(() => {
      try { node.__animationRef.pause() } catch {}
    }, 10)
  }
}

export function createLeaferNode(el: EditorNode & Record<string, any>, options: RuntimeOptions) {
  const runtimeProps = buildLeaferNodeProps(el, options)

  switch (el.type) {
    case 'Rect':
      return new Rect(runtimeProps)
    case 'Ellipse':
      return new Ellipse(runtimeProps)
    case 'Text':
      return new Text(runtimeProps)
    case 'Star':
      return new Star(runtimeProps)
    case 'Image':
    case 'QRCode':
    case 'Barcode':
      return new Image(runtimeProps)
    case 'Path':
      return new Path(runtimeProps)
    default:
      return new Rect(runtimeProps)
  }
}

export function syncLeaferNode(node: LeaferNode, el: EditorNode & Record<string, any>, options: RuntimeOptions) {
  const runtimeProps = buildLeaferNodeProps(el, options)
  node.set(runtimeProps)
}

export function isLeaferImageNodeReady(node: LeaferNode, expectedUrl?: string) {
  if (!node || !expectedUrl) return false

  const currentUrl = String(node.url || '')
  if (currentUrl !== expectedUrl) return false

  return Boolean(node.ready || node.image?.ready)
}
