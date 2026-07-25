type ResultHandler = (item: any, mimeType: string, quality?: number) => string | undefined

const exportResolvers: ResultHandler[] = [
  // 1. Direct boolean flag (Leafer saveAs automatically saved to disk)
  (item) => (item === true ? 'saved' : undefined),

  // 2. Data URL string
  (item) => (typeof item === 'string' ? item : undefined),

  // 3. Blob object
  (item) => (typeof Blob !== 'undefined' && item instanceof Blob ? URL.createObjectURL(item) : undefined),

  // 4. HTMLCanvasElement or Canvas-like object
  (item, mimeType, quality) => {
    if (typeof HTMLCanvasElement !== 'undefined' && item instanceof HTMLCanvasElement) {
      return item.toDataURL(mimeType, quality)
    }
    if (typeof item?.toDataURL === 'function') {
      return item.toDataURL(mimeType, quality)
    }
    return undefined
  },

  // 5. Object with view / canvas property
  (item, mimeType, quality) => {
    const target = item?.view || item?.canvas
    if (!target) return undefined
    if (typeof HTMLCanvasElement !== 'undefined' && target instanceof HTMLCanvasElement) {
      return target.toDataURL(mimeType, quality)
    }
    if (typeof target.toDataURL === 'function') {
      return target.toDataURL(mimeType, quality)
    }
    return undefined
  },
]

export function resolveExportDataUrl(exportResult: any, mimeType: string, quality?: number): string {
  if (!exportResult) return ''

  const item = exportResult.data !== undefined ? exportResult.data : exportResult
  if (!item && item !== true) {
    return exportResult.url && typeof exportResult.url === 'string' ? exportResult.url : ''
  }

  for (const resolver of exportResolvers) {
    const result = resolver(item, mimeType, quality)
    if (result !== undefined) {
      return result
    }
  }

  if (exportResult.url && typeof exportResult.url === 'string') {
    return exportResult.url
  }

  return ''
}
