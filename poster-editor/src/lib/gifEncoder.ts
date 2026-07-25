/**
 * Lightweight pure Client-side GIF 89a Encoder
 * Converts array of Canvas ImageData frames into an animated GIF Blob.
 */

export interface GifFrameOptions {
  delayMs: number
}

/** Quantize RGBA pixels to 256-color RGB palette with NeuQuant/Uniform reduction */
function quantizeFrame(imgData: ImageData): { palette: number[]; indexedPixels: Uint8Array } {
  const pixels = imgData.data
  const numPixels = imgData.width * imgData.height
  const palette: number[] = []
  const colorMap = new Map<number, number>()
  const indexedPixels = new Uint8Array(numPixels)

  for (let i = 0; i < numPixels; i++) {
    const r = pixels[i * 4]
    const g = pixels[i * 4 + 1]
    const b = pixels[i * 4 + 2]
    // Quantize 8-bit to 5-bit for fast palette indexing (32x32x32 = 32768 colors mapped to 256)
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)

    let idx = colorMap.get(key)
    if (idx === undefined) {
      if (palette.length < 256 * 3) {
        idx = palette.length / 3
        palette.push(r, g, b)
        colorMap.set(key, idx)
      } else {
        idx = 0 // fallback nearest palette slot
      }
    }
    indexedPixels[i] = idx
  }

  // Pad palette to exactly 256 colors (768 bytes)
  while (palette.length < 768) {
    palette.push(0, 0, 0)
  }

  return { palette, indexedPixels }
}

/** Simple GIF LZW Data Compressor */
function compressLZW(indexedPixels: Uint8Array, minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize
  const eofCode = clearCode + 1

  const out: number[] = []
  let codeSize = minCodeSize + 1
  let nextCode = eofCode + 1
  const dictionary = new Map<string, number>()

  const resetDict = () => {
    dictionary.clear()
    codeSize = minCodeSize + 1
    nextCode = eofCode + 1
  }

  let bitBuffer = 0
  let bitCount = 0

  const writeCode = (code: number) => {
    bitBuffer |= code << bitCount
    bitCount += codeSize
    while (bitCount >= 8) {
      out.push(bitBuffer & 0xff)
      bitBuffer >>= 8
      bitCount -= 8
    }
  }

  writeCode(clearCode)

  let prefix = String.fromCharCode(indexedPixels[0])
  for (let i = 1; i < indexedPixels.length; i++) {
    const k = String.fromCharCode(indexedPixels[i])
    const pk = prefix + k
    if (dictionary.has(pk)) {
      prefix = pk
    } else {
      writeCode(prefix.length === 1 ? prefix.charCodeAt(0) : dictionary.get(prefix)!)
      if (nextCode < 4096) {
        dictionary.set(pk, nextCode++)
        if (nextCode === (1 << codeSize) + 1 && codeSize < 12) {
          codeSize++
        }
      } else {
        writeCode(clearCode)
        resetDict()
      }
      prefix = k
    }
  }

  writeCode(prefix.length === 1 ? prefix.charCodeAt(0) : dictionary.get(prefix)!)
  writeCode(eofCode)

  if (bitCount > 0) {
    out.push(bitBuffer & 0xff)
  }

  return out
}

/** Pack bytes into GIF sub-blocks (max 255 bytes per sub-block) */
function packSubBlocks(compressed: number[]): number[] {
  const blocks: number[] = []
  let pos = 0
  while (pos < compressed.length) {
    const chunkSize = Math.min(255, compressed.length - pos)
    blocks.push(chunkSize)
    for (let i = 0; i < chunkSize; i++) {
      blocks.push(compressed[pos + i])
    }
    pos += chunkSize
  }
  blocks.push(0) // Block terminator
  return blocks
}

/** Create animated GIF 89a Blob from array of ImageData frames */
export function createAnimatedGifBlob(
  frames: ImageData[],
  width: number,
  height: number,
  delayMs: number = 100,
): Blob {
  const bytes: number[] = []

  // 1. Header: GIF89a
  bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61)

  // 2. Logical Screen Descriptor
  bytes.push(width & 0xff, (width >> 8) & 0xff)
  bytes.push(height & 0xff, (height >> 8) & 0xff)
  // GCT Flag: 0x80 (GCT follows), Color Res: 0x70 (8 bits), Sort: 0x00, GCT Size: 0x07 (256 colors = 2^(7+1))
  bytes.push(0xf7, 0x00, 0x00)

  // Quantize first frame to build Global Color Table
  const { palette, indexedPixels: firstFrameIndexed } = quantizeFrame(frames[0])
  for (let i = 0; i < 768; i++) {
    bytes.push(palette[i] || 0)
  }

  // 3. Application Extension (Netscape 2.0 Loop Block for Infinite Looping)
  bytes.push(0x21, 0xff, 0x0b) // Extension header
  const netscape = [0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30] // NETSCAPE2.0
  netscape.forEach(b => bytes.push(b))
  bytes.push(0x03, 0x01, 0x00, 0x00, 0x00) // Loop count = 0 (infinite)

  // 4. Encode each frame
  const centiSeconds = Math.round(delayMs / 10)

  frames.forEach((frame, idx) => {
    // Graphic Control Extension
    bytes.push(0x21, 0xf9, 0x04) // Block header
    bytes.push(0x04) // Disposal method: 1 (do not dispose), no transparent color
    bytes.push(centiSeconds & 0xff, (centiSeconds >> 8) & 0xff) // Delay time in 1/100ths sec
    bytes.push(0x00) // Transparent color index
    bytes.push(0x00) // Block terminator

    // Image Descriptor
    bytes.push(0x2c) // Image separator
    bytes.push(0x00, 0x00) // Left position = 0
    bytes.push(0x00, 0x00) // Top position = 0
    bytes.push(width & 0xff, (width >> 8) & 0xff)
    bytes.push(height & 0xff, (height >> 8) & 0xff)
    bytes.push(0x00) // Local color table flag = 0 (use global palette)

    // LZW Minimum Code Size
    const minCodeSize = 8
    bytes.push(minCodeSize)

    const indexed = idx === 0 ? firstFrameIndexed : quantizeFrame(frame).indexedPixels
    const compressed = compressLZW(indexed, minCodeSize)
    const packed = packSubBlocks(compressed)

    packed.forEach(b => bytes.push(b))
  })

  // 5. Trailer
  bytes.push(0x3b)

  return new Blob([new Uint8Array(bytes)], { type: 'image/gif' })
}
