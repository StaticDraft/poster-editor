export const bgColorToFill = (bgColor: any): any => {
  if (!bgColor) return '#ffffff'
  if (typeof bgColor === 'string') return bgColor
  if (typeof bgColor === 'object') {
    if (bgColor.type === 'image' && bgColor.url) {
      return { type: 'image', url: bgColor.url, mode: bgColor.mode || 'cover' }
    }
    if ((bgColor.type === 'linear' || bgColor.type === 'radial') && Array.isArray(bgColor.stops)) {
      const dirMap: Record<string, string> = {
        top: 'to bottom',
        bottom: 'to top',
        left: 'to right',
        right: 'to left',
        'top-left': 'to bottom right',
        center: 'to bottom',
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
