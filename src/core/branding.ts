import { Group, Rect, Text } from 'leafer-ui'
import { useLicenseStore } from '@/store/useLicenseStore'

export const BRAND_NAME = '画成试用版'
export const BRAND_WATERMARK_ID = '__postercraft_watermark__'
export const BRAND_EXPORT_WATERMARK_ID = '__postercraft_export_watermark__'

const WATERMARK_HEIGHT = 56
const WATERMARK_MARGIN = 16

/**
 * 实时刷新画布上已存在的品牌水印可见性（激活/解绑授权后立即生效）
 * @param watermarkGroup 画布上的水印 Group 引用（如果有）
 */
export function updateWatermarkVisibility(watermarkGroup: Group | null | undefined) {
  if (!watermarkGroup || watermarkGroup.destroyed) return
  const shouldShow = useLicenseStore.getState().showWatermark
  watermarkGroup.set({ visible: shouldShow })
}

function getWatermarkWidth(canvasWidth: number) {
  return Math.max(180, Math.min(210, canvasWidth - WATERMARK_MARGIN * 2))
}

export function syncBrandWatermark(watermark: Group, canvasWidth: number, canvasHeight: number) {
  const width = getWatermarkWidth(canvasWidth)
  const height = Math.min(WATERMARK_HEIGHT, Math.max(24, canvasHeight - WATERMARK_MARGIN * 2))
  watermark.set({
    x: WATERMARK_MARGIN,
    y: Math.max(0, canvasHeight - WATERMARK_MARGIN - height),
    width,
    height,
  })

  const background = watermark.children[0]
  const label = watermark.children[1]
  background?.set({ width, height })
  label?.set({
    x: 12,
    y: 12,
    width: Math.max(40, width - 24),
    height: Math.max(24, height - 24),
  })
}

export function createBrandWatermark(canvasWidth: number, canvasHeight: number) {
  const showWatermark = useLicenseStore.getState().showWatermark
  const watermark = new Group({
    id: BRAND_WATERMARK_ID,
    zIndex: 1000000,
    editable: false,
    draggable: false,
    hittable: false,
    visible: showWatermark,
  })

  watermark.add(new Rect({
    id: `${BRAND_WATERMARK_ID}_background`,
    x: 0,
    y: 0,
    width: 210,
    height: WATERMARK_HEIGHT,
    cornerRadius: 6,
    fill: 'rgba(0, 0, 0, 0.42)',
    editable: false,
    draggable: false,
    hittable: false,
  }))
  watermark.add(new Text({
    id: `${BRAND_WATERMARK_ID}_label`,
    x: 12,
    y: 12,
    width: 186,
    height: 32,
    text: BRAND_NAME,
    fill: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    verticalAlign: 'middle',
    origin: { x: 0, y: 0 },
    editable: false,
    draggable: false,
    hittable: false,
  }))

  syncBrandWatermark(watermark, canvasWidth, canvasHeight)
  return watermark
}

export function createExportWatermark(canvasWidth: number, canvasHeight: number) {
  const showWatermark = useLicenseStore.getState().showWatermark
  const watermark = new Group({
    id: BRAND_EXPORT_WATERMARK_ID,
    zIndex: 1000000,
    editable: false,
    draggable: false,
    hittable: false,
    visible: showWatermark,
  })

  const baseTileWidth = 250
  const baseTileHeight = 145
  const baseTextWidth = 220
  const baseTextHeight = 34
  const rotation = -25
  const maxWatermarkCount = 120
  const edgePadding = Math.ceil(Math.hypot(baseTextWidth, baseTextHeight))
  const baseColumnCount = Math.ceil((canvasWidth + edgePadding * 2) / baseTileWidth)
  const baseRowCount = Math.ceil((canvasHeight + edgePadding * 2) / baseTileHeight)
  const densityScale = Math.max(1, Math.sqrt((baseColumnCount * baseRowCount) / maxWatermarkCount))
  const tileWidth = baseTileWidth * densityScale
  const tileHeight = baseTileHeight * densityScale
  const textWidth = baseTextWidth * densityScale
  const textHeight = baseTextHeight * densityScale
  const padding = Math.ceil(Math.hypot(textWidth, textHeight))
  let index = 0

  for (let y = -padding; y < canvasHeight + padding; y += tileHeight) {
    const rowOffset = (Math.floor((y + padding) / tileHeight) % 2) * (tileWidth / 2)
    for (let x = -padding + rowOffset; x < canvasWidth + padding; x += tileWidth) {
      watermark.add(new Text({
        id: `${BRAND_EXPORT_WATERMARK_ID}_${index++}`,
        x,
        y,
        width: textWidth,
        height: textHeight,
        text: BRAND_NAME,
        fill: 'rgba(255, 255, 255, 0.28)',
        fontSize: 20 * densityScale,
        fontWeight: '700',
        textAlign: 'center',
        rotation,
        origin: { x: 0.5, y: 0.5 },
        editable: false,
        draggable: false,
        hittable: false,
      }))
    }
  }

  return watermark
}
