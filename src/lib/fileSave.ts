export interface SaveFileOptions {
  filename: string
  data: string // base64 data URI (for images) or plain text / JSON string
  mimeType?: string
  filters?: Array<{ name: string; extensions: string[] }>
}

/**
 * Universal file save utility.
 * Uses native Electron 'showSaveDialog' and direct disk writing when running inside Electron desktop app.
 * Falls back to standard browser Blob dynamic link download when running in browser.
 */
export async function saveFileNativeOrBrowser(options: SaveFileOptions): Promise<boolean> {
  const { filename, data, mimeType = 'application/octet-stream', filters } = options
  const electronAPI = (window as any).electronAPI

  if (electronAPI?.saveFile) {
    try {
      const isBase64 = data.startsWith('data:')
      const res = await electronAPI.saveFile({
        defaultPath: filename,
        filters: filters || [
          { name: 'Export File', extensions: [filename.split('.').pop() || '*'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        base64Data: isBase64 ? data : undefined,
        textData: !isBase64 ? data : undefined,
      })
      return !res?.canceled
    } catch (err) {
      console.error('Native Electron save failed, falling back to browser download:', err)
    }
  }

  // Browser Fallback
  try {
    let blob: Blob
    if (data.startsWith('data:')) {
      const parts = data.split(';base64,')
      const contentType = parts[0].replace('data:', '') || mimeType
      const raw = window.atob(parts[1])
      const uInt8Array = new Uint8Array(raw.length)
      for (let i = 0; i < raw.length; ++i) {
        uInt8Array[i] = raw.charCodeAt(i)
      }
      blob = new Blob([uInt8Array], { type: contentType })
    } else {
      blob = new Blob([data], { type: mimeType })
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return true
  } catch (err) {
    console.error('Browser save failed:', err)
    return false
  }
}
