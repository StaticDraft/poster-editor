/**
 * Image processing utilities: Smart Background Removal (Cutout), Beauty Filters, and Pixelated Mosaic
 */

export async function removeImageBackground(
  imageUrl: string,
  mode: 'white' | 'chroma' | 'auto' = 'white',
  threshold = 35
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas 2D context unavailable'))

        ctx.drawImage(img, 0, 0)
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imgData.data

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          if (mode === 'white' || mode === 'auto') {
            // Remove white / light / pale backgrounds
            if (r > 255 - threshold && g > 255 - threshold && b > 255 - threshold) {
              data[i + 3] = 0 // Transparent alpha
            }
          } else if (mode === 'chroma') {
            // Remove green screen backgrounds
            if (g > 100 && g > r * 1.25 && g > b * 1.25) {
              data[i + 3] = 0
            }
          }
        }

        ctx.putImageData(imgData, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = (e) => reject(new Error('Failed to load image for cutout: ' + String(e)))
    img.src = imageUrl
  })
}

export interface ImageEffectOptions {
  brightness?: number // 100 base
  contrast?: number   // 100 base
  saturate?: number   // 100 base
  blur?: number       // 0 base (mosaic intensity)
  hueRotate?: number  // 0 base
}

export async function applyImageEffects(
  imageUrl: string,
  options: ImageEffectOptions
): Promise<string> {
  const { brightness = 100, contrast = 100, saturate = 100, blur = 0, hueRotate = 0 } = options

  // If all effects are default, return original URL
  if (brightness === 100 && contrast === 100 && saturate === 100 && blur === 0 && hueRotate === 0) {
    return imageUrl
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const w = img.naturalWidth || img.width
        const h = img.naturalHeight || img.height
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(imageUrl)

        // Pixelated Mosaic Algorithm if blur > 0
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
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hueRotate}deg)`
          ctx.drawImage(smallCanvas, 0, 0, smallW, smallH, 0, 0, w, h)
        } else {
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hueRotate}deg)`
          ctx.drawImage(img, 0, 0, w, h)
        }

        resolve(canvas.toDataURL('image/png'))
      } catch (err) {
        console.error('Filter apply error:', err)
        resolve(imageUrl)
      }
    }
    img.onerror = () => resolve(imageUrl)
    img.src = imageUrl
  })
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
