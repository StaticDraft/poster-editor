/**
 * Image processing utilities: Smart Background Removal (Cutout), Pure Pixel Beauty Filters, and Pixelated Mosaic
 */

export function loadImageWithCorsFallback(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => {
      // Fallback 1: Try fetch to Blob URL to bypass CORS taint on Canvas
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob)
          const img2 = new Image()
          img2.onload = () => resolve(img2)
          img2.onerror = (e) => reject(e)
          img2.src = blobUrl
        })
        .catch(() => {
          // Fallback 2: Try without crossOrigin
          const img3 = new Image()
          img3.onload = () => resolve(img3)
          img3.onerror = (e) => reject(e)
          img3.src = url
        })
    }
    img.src = url
  })
}

export async function removeImageBackground(
  imageUrl: string,
  mode: 'white' | 'chroma' | 'auto' = 'white',
  threshold = 35
): Promise<string> {
  const img = await loadImageWithCorsFallback(imageUrl)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  ctx.drawImage(img, 0, 0)
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imgData.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    if (mode === 'white' || mode === 'auto') {
      if (r > 255 - threshold && g > 255 - threshold && b > 255 - threshold) {
        data[i + 3] = 0 // Transparent alpha
      }
    } else if (mode === 'chroma') {
      if (g > 100 && g > r * 1.25 && g > b * 1.25) {
        data[i + 3] = 0
      }
    }
  }

  ctx.putImageData(imgData, 0, 0)
  return canvas.toDataURL('image/png')
}

export interface ImageEffectOptions {
  presetId?: string
  brightness?: number // 100 base
  contrast?: number   // 100 base
  saturate?: number   // 100 base
  blur?: number       // 0 base (mosaic intensity)
}

export function applyPixelFilter(
  data: Uint8ClampedArray,
  presetId?: string,
  brightness = 100,
  contrast = 100,
  saturate = 100
) {
  const b = brightness / 100
  const c = contrast / 100
  const s = saturate / 100

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let bCol = data[i + 2]

    if (presetId === 'high-contrast') { // 🏁 动感黑白
      let gray = 0.299 * r + 0.587 * g + 0.114 * bCol
      gray = (gray - 128) * 1.35 + 128
      r = g = bCol = Math.max(0, Math.min(255, gray))
    } else if (presetId === 'beauty-soft') { // 🌸 柔光美颜
      r = Math.min(255, r * 1.14 + 12)
      g = Math.min(255, g * 1.08 + 8)
      bCol = Math.min(255, bCol * 1.05 + 5)
    } else if (presetId === 'warm-sun') { // 🌅 日系暖调
      r = Math.min(255, r * 1.18 + 15)
      g = Math.min(255, g * 1.10 + 10)
      bCol = Math.max(0, bCol * 0.90 - 8)
    } else if (presetId === 'cyberpunk') { // 🌌 赛博霓虹
      r = Math.min(255, r * 1.20 + 20)
      g = Math.max(0, g * 0.85 - 10)
      bCol = Math.min(255, bCol * 1.30 + 25)
    } else if (presetId === 'retro-film') { // 🎬 复古电影
      r = Math.min(255, r * 1.12 + 10)
      g = Math.min(255, g * 1.04 + 5)
      bCol = Math.max(0, bCol * 0.82 - 12)
    }

    // Saturation adjustment
    if (s !== 1 && presetId !== 'high-contrast') {
      const gray = 0.299 * r + 0.587 * g + 0.114 * bCol
      r = Math.max(0, Math.min(255, gray + (r - gray) * s))
      g = Math.max(0, Math.min(255, gray + (g - gray) * s))
      bCol = Math.max(0, Math.min(255, gray + (bCol - gray) * s))
    }

    // Brightness & Contrast curves
    if (b !== 1) {
      r = Math.min(255, Math.max(0, r * b))
      g = Math.min(255, Math.max(0, g * b))
      bCol = Math.min(255, Math.max(0, bCol * b))
    }
    if (c !== 1) {
      r = Math.min(255, Math.max(0, (r - 128) * c + 128))
      g = Math.min(255, Math.max(0, (g - 128) * c + 128))
      bCol = Math.min(255, Math.max(0, (bCol - 128) * c + 128))
    }

    data[i] = r
    data[i + 1] = g
    data[i + 2] = bCol
  }
}

export async function applyImageEffects(
  imageUrl: string,
  options: ImageEffectOptions
): Promise<string> {
  const { presetId, brightness = 100, contrast = 100, saturate = 100, blur = 0 } = options

  // If all effects are default and no preset, return original URL
  if ((!presetId || presetId === 'original') && brightness === 100 && contrast === 100 && saturate === 100 && blur === 0) {
    return imageUrl
  }

  const img = await loadImageWithCorsFallback(imageUrl)
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return imageUrl

  // Step 1: Pixelated Mosaic Algorithm if blur > 0
  if (blur > 0) {
    const pixelSize = Math.max(4, Math.round(blur * 1.6))
    const smallW = Math.max(1, Math.floor(w / pixelSize))
    const smallH = Math.max(1, Math.floor(h / pixelSize))

    const smallCanvas = document.createElement('canvas')
    smallCanvas.width = smallW
    smallCanvas.height = smallH
    const smallCtx = smallCanvas.getContext('2d')!
    smallCtx.imageSmoothingEnabled = false
    smallCtx.drawImage(img, 0, 0, smallW, smallH)

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(smallCanvas, 0, 0, smallW, smallH, 0, 0, w, h)
  } else {
    ctx.drawImage(img, 0, 0, w, h)
  }

  // Step 2: Pure Pixel Transformation for Beauty Filter presets
  const imgData = ctx.getImageData(0, 0, w, h)
  applyPixelFilter(imgData.data, presetId, brightness, contrast, saturate)
  ctx.putImageData(imgData, 0, 0)

  return canvas.toDataURL('image/png')
}

export interface ImageFilterPreset {
  id: string
  name: string
  brightness: number // 100 base
  contrast: number   // 100 base
  saturate: number   // 100 base
  blur: number       // 0 base (mosaic)
}

export const BEAUTY_PRESETS: ImageFilterPreset[] = [
  { id: 'original', name: '↺ 原图', brightness: 100, contrast: 100, saturate: 100, blur: 0 },
  { id: 'beauty-soft', name: '🌸 柔光美颜', brightness: 112, contrast: 95, saturate: 115, blur: 0 },
  { id: 'warm-sun', name: '🌅 日系暖调', brightness: 108, contrast: 105, saturate: 125, blur: 0 },
  { id: 'cyberpunk', name: '🌌 赛博霓虹', brightness: 105, contrast: 130, saturate: 160, blur: 0 },
  { id: 'retro-film', name: '🎬 复古电影', brightness: 95, contrast: 110, saturate: 80, blur: 0 },
  { id: 'high-contrast', name: '🏁 动感黑白', brightness: 105, contrast: 140, saturate: 0, blur: 0 },
]
