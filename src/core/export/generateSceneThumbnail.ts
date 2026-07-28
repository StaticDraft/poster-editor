import { Leafer } from 'leafer-ui'
import '@leafer-in/export'
import type { CanvasConfig, EditorNode } from '@/store/useEditorStore'
import { bgColorToFill, createLeaferNode } from '@/core/leafer/runtime'
import { resolveExportDataUrl } from './ExportResultAdapter'

/** Max long-side pixel length for thumbnails. */
const THUMBNAIL_MAX_LONG_SIDE = 320

/** JPEG compression quality for thumbnails. */
const THUMBNAIL_JPEG_QUALITY = 0.7

/** Delay (ms) after Leafer viewReady to allow images to decode and paint. */
const POST_READY_DELAY_MS = 500

/**
 * Preloads all image URLs from elements into the browser's in-memory cache.
 * Returns a promise that resolves when every image has loaded (or timed out).
 */
function preloadImages(elements: EditorNode[], timeoutMs = 5000): Promise<void> {
  const urls = new Set<string>()
  elements.forEach((el) => {
    if (el.url) urls.add(el.url)
    if (el.props?.url) urls.add(el.props.url)
  })

  if (urls.size === 0) return Promise.resolve()

  return new Promise<void>((resolve) => {
    let loaded = 0
    const total = urls.size
    const done = () => {
      loaded++
      if (loaded >= total) { clearTimeout(timer); resolve() }
    }
    const timer = setTimeout(resolve, timeoutMs)

    urls.forEach((url) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = done
      img.onerror = done
      img.src = url
    })
  })
}

/**
 * Generates a scene thumbnail using an offscreen Leafer instance,
 * matching the exact render pipeline used by the main editor.
 *
 * Flow:
 * 1. Preload all image URLs into browser cache
 * 2. Create an offscreen Leafer at reduced pixelRatio
 * 3. Add all visible element nodes
 * 4. Wait for viewReady + POST_READY_DELAY_MS for images to decode
 * 5. Export the Leafer scene through its own render pipeline
 * 6. Clean up and return the JPEG data URL
 */
export async function generateSceneThumbnail(
  canvasConfig: CanvasConfig,
  elements: EditorNode[],
): Promise<string | null> {
  const { width: posterW, height: posterH, bgColor } = canvasConfig
  const visibleElements = elements.filter((el) => !el.hidden)
  if (!visibleElements.length) return null

  // Step 1: Ensure all images are in browser cache before creating Leafer nodes
  await preloadImages(visibleElements, 5000)

  const maxSide = Math.max(posterW, posterH)
  const thumbScale = Math.min(1, THUMBNAIL_MAX_LONG_SIDE / maxSide)

  // Step 2: Create hidden offscreen container
  const container = document.createElement('div')
  container.style.cssText =
    `position:fixed;left:-999999px;top:-999999px;` +
    `width:${posterW}px;height:${posterH}px;overflow:hidden;z-index:-99999;`
  document.body.appendChild(container)

  let offscreenLeafer: Leafer | null = null
  let dataUrl: string | null = null

  try {
    offscreenLeafer = new Leafer({
      view: container,
      width: posterW,
      height: posterH,
      fill: bgColorToFill(bgColor),
      pixelRatio: thumbScale,
    })

    // Step 3: Add all element nodes (same factory as main editor)
    visibleElements.forEach((el, index) => {
      try {
        const node = createLeaferNode(
          { ...el, zIndex: index },
          { editable: false, draggable: false },
        )
        node.zIndex = index
        offscreenLeafer?.add(node)
      } catch {
        // Silently skip nodes that fail to instantiate
      }
    })

    // Step 4: Wait for Leafer to finish layout + images to decode on canvas
    await new Promise<void>((resolve) => {
      if (!offscreenLeafer) return resolve()
      if ((offscreenLeafer as any).viewReady) {
        setTimeout(resolve, POST_READY_DELAY_MS)
      } else {
        offscreenLeafer.waitViewReady(() => setTimeout(resolve, POST_READY_DELAY_MS))
      }
    })

    // Step 5: Use Leafer's export renderer. This waits for completed resources
    // and renders the same node tree instead of reading a possibly incomplete
    // or cross-origin-tainted display canvas.
    try {
      const exportResult = await offscreenLeafer.export('jpg', {
        screenshot: true,
        pixelRatio: thumbScale,
        quality: THUMBNAIL_JPEG_QUALITY,
      })
      dataUrl = resolveExportDataUrl(exportResult, 'image/jpeg', THUMBNAIL_JPEG_QUALITY) || null
    } catch {
      // A remote image without CORS can taint raster export. Try the same
      // Leafer scene as SVG so the browser can display it without canvas readback.
      dataUrl = null
    }

    if (!dataUrl) {
      const svgResult = await offscreenLeafer.export('svg')
      const svg = typeof svgResult === 'string'
        ? svgResult
        : typeof (svgResult as any)?.data === 'string'
          ? (svgResult as any).data
          : ''
      if (svg.trim().startsWith('<svg')) {
        dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
      }
    }
  } catch (err) {
    console.warn('[generateSceneThumbnail] Render failed:', err)
  } finally {
    if (offscreenLeafer) {
      try { offscreenLeafer.destroy() } catch { /* ignore */ }
    }
    try { document.body.removeChild(container) } catch { /* ignore */ }
  }

  return dataUrl
}
