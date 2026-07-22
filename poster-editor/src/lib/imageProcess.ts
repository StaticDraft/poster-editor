/**
 * Image processing utilities: Smart Background Removal (Cutout), Beauty Filters, and Mosaic
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
