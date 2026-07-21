// IndexedDB Browser Database for User Asset Management & Compressed Thumbnails

export interface UserAsset {
  id: string
  name: string
  url: string // Original high-res image
  thumbnailUrl: string // Compressed thumbnail for fast gallery rendering
  width: number
  height: number
  createdAt: number
}

const DB_NAME = 'PosterCraft_AssetDB'
const DB_VERSION = 1
const STORE_NAME = 'user_assets'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (e: any) => {
      const db = e.target.result as IDBDatabase
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }

    request.onsuccess = (e: any) => resolve(e.target.result)
    request.onerror = (e) => reject(e)
  })
}

/**
 * Generates a compressed JPEG/WebP thumbnail from an image file using Canvas API
 */
export function createCompressedThumbnail(file: File, maxDimension = 160, quality = 0.75): Promise<{ fullUrl: string; thumbnailUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const fullUrl = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        const origW = img.width || 200
        const origH = img.height || 200

        // Calculate scaled thumbnail dimensions
        let thumbW = origW
        let thumbH = origH
        if (thumbW > thumbH) {
          if (thumbW > maxDimension) {
            thumbH = Math.round((thumbH * maxDimension) / thumbW)
            thumbW = maxDimension
          }
        } else {
          if (thumbH > maxDimension) {
            thumbW = Math.round((thumbW * maxDimension) / thumbH)
            thumbH = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, thumbW)
        canvas.height = Math.max(1, thumbH)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const thumbnailUrl = canvas.toDataURL('image/jpeg', quality)
          resolve({ fullUrl, thumbnailUrl, width: origW, height: origH })
        } else {
          resolve({ fullUrl, thumbnailUrl: fullUrl, width: origW, height: origH })
        }
      }
      img.onerror = (err) => reject(err)
      img.src = fullUrl
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

export async function saveUserAsset(file: File): Promise<UserAsset> {
  const { fullUrl, thumbnailUrl, width, height } = await createCompressedThumbnail(file)
  const db = await openDB()
  const asset: UserAsset = {
    id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name,
    url: fullUrl,
    thumbnailUrl,
    width,
    height,
    createdAt: Date.now(),
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.add(asset)
    request.onsuccess = () => resolve(asset)
    request.onerror = (e) => reject(e)
  })
}

export async function getUserAssets(): Promise<UserAsset[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('createdAt')
    const request = index.openCursor(null, 'prev') // Newest first
    const assets: UserAsset[] = []

    request.onsuccess = (e: any) => {
      const cursor = e.target.result
      if (cursor) {
        assets.push(cursor.value)
        cursor.continue()
      } else {
        resolve(assets)
      }
    }
    request.onerror = (e) => reject(e)
  })
}

export async function getUserAssetsPaged(page = 1, pageSize = 12): Promise<{ items: UserAsset[]; total: number; hasMore: boolean }> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('createdAt')

    const countReq = store.count()
    countReq.onsuccess = () => {
      const total = countReq.result
      const offset = (page - 1) * pageSize
      const items: UserAsset[] = []
      let hasAdvanced = false

      if (total === 0) {
        resolve({ items: [], total: 0, hasMore: false })
        return
      }

      const cursorReq = index.openCursor(null, 'prev') // newest first
      cursorReq.onsuccess = (e: any) => {
        const cursor = e.target.result
        if (!cursor) {
          resolve({ items, total, hasMore: page * pageSize < total })
          return
        }

        if (offset > 0 && !hasAdvanced) {
          hasAdvanced = true
          cursor.advance(offset)
          return
        }

        items.push(cursor.value)
        if (items.length < pageSize) {
          cursor.continue()
        } else {
          resolve({ items, total, hasMore: offset + items.length < total })
        }
      }
      cursorReq.onerror = (err) => reject(err)
    }
    countReq.onerror = (err) => reject(err)
  })
}

export async function deleteUserAsset(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = (e) => reject(e)
  })
}
