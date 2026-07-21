// IndexedDB Browser Database for User Asset Folders & Asset Management

export interface AssetFolder {
  id: string
  name: string
  createdAt: number
}

export interface UserAsset {
  id: string
  folderId: string
  name: string
  url: string // Original high-res image
  thumbnailUrl: string // Compressed thumbnail for fast gallery rendering
  width: number
  height: number
  createdAt: number
}

const DB_NAME = 'PosterCraft_AssetDB'
const DB_VERSION = 2
const STORE_ASSETS = 'user_assets'
const STORE_FOLDERS = 'asset_folders'
const DEFAULT_FOLDER_ID = 'folder-default'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (e: any) => {
      const db = e.target.result as IDBDatabase
      if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
        const folderStore = db.createObjectStore(STORE_FOLDERS, { keyPath: 'id' })
        folderStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        const assetStore = db.createObjectStore(STORE_ASSETS, { keyPath: 'id' })
        assetStore.createIndex('createdAt', 'createdAt', { unique: false })
        assetStore.createIndex('folderId', 'folderId', { unique: false })
      } else {
        const transaction = e.target.transaction
        const assetStore = transaction.objectStore(STORE_ASSETS)
        if (!assetStore.indexNames.contains('folderId')) {
          assetStore.createIndex('folderId', 'folderId', { unique: false })
        }
      }
    }

    request.onsuccess = async (e: any) => {
      const db = e.target.result as IDBDatabase
      // Ensure default folder exists
      try {
        const tx = db.transaction(STORE_FOLDERS, 'readwrite')
        const store = tx.objectStore(STORE_FOLDERS)
        const getReq = store.get(DEFAULT_FOLDER_ID)
        getReq.onsuccess = () => {
          if (!getReq.result) {
            store.add({
              id: DEFAULT_FOLDER_ID,
              name: '默认素材分类',
              createdAt: Date.now(),
            })
          }
        }
      } catch {}
      resolve(db)
    }
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

// ── Folder Directory CRUD ──

export async function getAssetFolders(): Promise<AssetFolder[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FOLDERS, 'readonly')
    const store = tx.objectStore(STORE_FOLDERS)
    const index = store.index('createdAt')
    const request = index.getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = (e) => reject(e)
  })
}

export async function createAssetFolder(name: string): Promise<AssetFolder> {
  const db = await openDB()
  const folder: AssetFolder = {
    id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || '新建素材目录',
    createdAt: Date.now(),
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FOLDERS, 'readwrite')
    const store = tx.objectStore(STORE_FOLDERS)
    const request = store.add(folder)
    request.onsuccess = () => resolve(folder)
    request.onerror = (e) => reject(e)
  })
}

export async function deleteAssetFolder(folderId: string): Promise<void> {
  if (folderId === DEFAULT_FOLDER_ID) return // Cannot delete default folder
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_FOLDERS, STORE_ASSETS], 'readwrite')
    const folderStore = tx.objectStore(STORE_FOLDERS)
    folderStore.delete(folderId)

    // Delete all assets in this folder
    const assetStore = tx.objectStore(STORE_ASSETS)
    const index = assetStore.index('folderId')
    const req = index.openCursor(IDBKeyRange.only(folderId))
    req.onsuccess = (e: any) => {
      const cursor = e.target.result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = (e) => reject(e)
  })
}

// ── Asset CRUD with Folder & Pagination ──

export async function saveUserAsset(file: File, folderId = DEFAULT_FOLDER_ID): Promise<UserAsset> {
  const { fullUrl, thumbnailUrl, width, height } = await createCompressedThumbnail(file)
  const db = await openDB()
  const asset: UserAsset = {
    id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    folderId: folderId || DEFAULT_FOLDER_ID,
    name: file.name,
    url: fullUrl,
    thumbnailUrl,
    width,
    height,
    createdAt: Date.now(),
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ASSETS, 'readwrite')
    const store = tx.objectStore(STORE_ASSETS)
    const request = store.add(asset)
    request.onsuccess = () => resolve(asset)
    request.onerror = (e) => reject(e)
  })
}

export async function getUserAssetsPaged(folderId?: string, page = 1, pageSize = 8): Promise<{ items: UserAsset[]; total: number; hasMore: boolean }> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ASSETS, 'readonly')
    const store = tx.objectStore(STORE_ASSETS)

    let req: IDBRequest
    if (folderId) {
      const index = store.index('folderId')
      req = index.getAll(IDBKeyRange.only(folderId))
    } else {
      req = store.getAll()
    }

    req.onsuccess = () => {
      const all: UserAsset[] = (req.result || []).sort((a: UserAsset, b: UserAsset) => b.createdAt - a.createdAt)
      const total = all.length
      const offset = (page - 1) * pageSize
      const items = all.slice(offset, offset + pageSize)
      resolve({ items, total, hasMore: offset + items.length < total })
    }
    req.onerror = (e) => reject(e)
  })
}

export async function deleteUserAsset(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ASSETS, 'readwrite')
    const store = tx.objectStore(STORE_ASSETS)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = (e) => reject(e)
  })
}
