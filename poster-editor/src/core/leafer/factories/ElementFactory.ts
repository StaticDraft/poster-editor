import { Rect, Ellipse, Text, Star, Image, Path } from 'leafer-ui'
import { generateQRCodeSVG, generateBarcodeDataUrl } from '@/lib/qrcode'
import { generateMosaicPatternDataUrl } from '@/lib/imageProcess'
import type { EditorNode } from '@/store/useEditorStore'

const PATH_FALLBACK = 'M0 0 L100 0 L100 100 L0 100 Z'

export interface RuntimeOptions {
  editable: boolean
  draggable: boolean
}

export type NodeFactoryFn = (props: Record<string, any>) => any
export type PropEnhancerFn = (el: EditorNode & Record<string, any>, runtimeProps: Record<string, any>) => void

interface ElementStrategy {
  create: NodeFactoryFn
  enhanceProps?: PropEnhancerFn
}

const defaultStrategy: ElementStrategy = {
  create: (props) => new Rect(props),
}

const elementStrategies: Record<string, ElementStrategy> = {
  Rect: {
    create: (props) => new Rect(props),
  },
  Ellipse: {
    create: (props) => new Ellipse(props),
  },
  Text: {
    create: (props) => new Text(props),
  },
  Star: {
    create: (props) => new Star(props),
  },
  Image: {
    create: (props) => new Image(props),
  },
  QRCode: {
    create: (props) => new Image(props),
    enhanceProps: (el, props) => {
      props.url = generateQRCodeSVG(el.text || el.props?.text || 'https://postercraft.app')
    },
  },
  Barcode: {
    create: (props) => new Image(props),
    enhanceProps: (el, props) => {
      props.url = generateBarcodeDataUrl(el.text || el.props?.text || '690123456789')
    },
  },
  Mosaic: {
    create: (props) => new Image(props),
    enhanceProps: (el, props) => {
      const w = el.width || 180
      const h = el.height || 120
      const pSize = el.props?.pixelSize || 12
      props.url = generateMosaicPatternDataUrl(w, h, pSize)
    },
  },
  Path: {
    create: (props) => new Path(props),
    enhanceProps: (el, props) => {
      const width = el.width || 100
      const height = el.height || 100
      props.path = el.unitPath || PATH_FALLBACK
      props.scaleX = (width / 100) * (el.props?.flipH ? -1 : 1)
      props.scaleY = (height / 100) * (el.props?.flipV ? -1 : 1)
      props.width = width
      props.height = height
    },
  },
}

export function enhanceElementProps(el: EditorNode & Record<string, any>, runtimeProps: Record<string, any>) {
  const strategy = elementStrategies[el.type]
  if (strategy?.enhanceProps) {
    strategy.enhanceProps(el, runtimeProps)
  }
}

export function instantiateLeaferNode(type: string, props: Record<string, any>) {
  const strategy = elementStrategies[type] || defaultStrategy
  return strategy.create(props)
}
