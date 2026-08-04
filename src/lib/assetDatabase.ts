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
export const DEFAULT_FOLDER_ID = 'folder-default'
export const PRESET_POSTER_FOLDER_ID = 'folder-preset-poster-hd'

export const PRESET_POSTER_HD_IMAGES = [
  { id: 'img-hd-qingming-bg', folderId: PRESET_POSTER_FOLDER_ID, name: '清明 · 春绿竹风', url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=90&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=400', width: 800, height: 1200, createdAt: 1000 },
  { id: 'img-hd-qingming-hero', folderId: PRESET_POSTER_FOLDER_ID, name: '清明 · 踏青风光', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=90&w=1600', thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400', width: 600, height: 480, createdAt: 2000 },
  { id: 'img-hd-yuanxiao-bg', folderId: PRESET_POSTER_FOLDER_ID, name: '元宵 · 红灯笼海报', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=90&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=400', width: 800, height: 1200, createdAt: 3000 },
  { id: 'img-hd-yuanxiao-hero', folderId: PRESET_POSTER_FOLDER_ID, name: '元宵 · 吉祥汤圆', url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=90&w=1600', thumbnailUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=400', width: 600, height: 480, createdAt: 4000 },
  { id: 'img-hd-midautumn-bg', folderId: PRESET_POSTER_FOLDER_ID, name: '中秋 · 金色明月', url: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=90&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=400', width: 800, height: 1200, createdAt: 5000 },
  { id: 'img-hd-midautumn-hero', folderId: PRESET_POSTER_FOLDER_ID, name: '中秋 · 月饼大图', url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=90&w=1600', thumbnailUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=80&w=400', width: 600, height: 480, createdAt: 6000 },
  { id: 'img-hd-cny-bg', folderId: PRESET_POSTER_FOLDER_ID, name: '新春 · 烫金祥龙', url: 'https://images.unsplash.com/photo-1548625361-185121c27c62?q=90&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1548625361-185121c27c62?q=80&w=400', width: 800, height: 1200, createdAt: 7000 },
  { id: 'img-hd-children-bg', folderId: PRESET_POSTER_FOLDER_ID, name: '六一 · 彩虹天空', url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=90&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=400', width: 800, height: 1200, createdAt: 8000 },
  { id: 'img-hd-children-hero', folderId: PRESET_POSTER_FOLDER_ID, name: '六一 · 童趣礼盒', url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=90&w=1600', thumbnailUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=400', width: 600, height: 480, createdAt: 9000 },
  { id: 'img-hd-valentine-bg', folderId: PRESET_POSTER_FOLDER_ID, name: '情人节 · 玫瑰花瓣', url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=90&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400', width: 800, height: 1200, createdAt: 10000 },
  { id: 'img-hd-valentine-hero', folderId: PRESET_POSTER_FOLDER_ID, name: '情人节 · 定情鲜花', url: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?q=90&w=1600', thumbnailUrl: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?q=80&w=400', width: 600, height: 480, createdAt: 11000 },
  { id: 'img-hd-double11-bg', folderId: PRESET_POSTER_FOLDER_ID, name: '双11 · 霓虹光轨', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=90&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400', width: 800, height: 1200, createdAt: 12000 },
  { id: 'img-hd-double11-hero', folderId: PRESET_POSTER_FOLDER_ID, name: '双11 · 奢品美妆礼盒', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=90&w=1600', thumbnailUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400', width: 600, height: 480, createdAt: 13000 },
  { id: 'img-hd-sneaker-hero', folderId: PRESET_POSTER_FOLDER_ID, name: '618 · 爆款潮流球鞋', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=90&w=1600', thumbnailUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400', width: 600, height: 480, createdAt: 14000 },
  { id: 'img-hd-cyberpunk-bg', folderId: PRESET_POSTER_FOLDER_ID, name: '新品 · 赛博夜景背景', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=90&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=400', width: 800, height: 1200, createdAt: 15000 },
  { id: 'img-hd-headphone-hero', folderId: PRESET_POSTER_FOLDER_ID, name: '新品 · 无线概念耳机', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=90&w=1600', thumbnailUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400', width: 600, height: 480, createdAt: 16000 },
  { id: 'img-hd-tea-bg', folderId: PRESET_POSTER_FOLDER_ID, name: '国潮 · 水墨禅茶', url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=90&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=400', width: 800, height: 1200, createdAt: 17000 },
  { id: 'img-hd-teapot-hero', folderId: PRESET_POSTER_FOLDER_ID, name: '国潮 · 紫砂茶器', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=90&w=1600', thumbnailUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=400', width: 600, height: 480, createdAt: 18000 },
  { id: 'img-hd-temple-bg', folderId: PRESET_POSTER_FOLDER_ID, name: '国潮 · 宫殿原图', url: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=90&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=400', width: 800, height: 1200, createdAt: 19000 },
  { id: 'img-hd-porcelain-hero', folderId: PRESET_POSTER_FOLDER_ID, name: '国潮 · 青花瓷器', url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=90&w=1600', thumbnailUrl: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=400', width: 600, height: 480, createdAt: 20000 },
  { id: 'img-hd-studio-bg', folderId: PRESET_POSTER_FOLDER_ID, name: '招聘 · 工作室办公台', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=90&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=400', width: 800, height: 1200, createdAt: 21000 },
  { id: 'img-hd-designer-hero', folderId: PRESET_POSTER_FOLDER_ID, name: '招聘 · 设计师工作区', url: 'https://images.unsplash.com/photo-1542744094-3a31b272c490?q=90&w=1600', thumbnailUrl: 'https://images.unsplash.com/photo-1542744094-3a31b272c490?q=80&w=400', width: 680, height: 420, createdAt: 22000 },
  { id: 'img-hd-server-bg', folderId: PRESET_POSTER_FOLDER_ID, name: '招聘 · 极客科技机房', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=90&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400', width: 800, height: 1200, createdAt: 23000 },
  { id: 'img-hd-team-hero', folderId: PRESET_POSTER_FOLDER_ID, name: '招聘 · 研发团队合影', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=90&w=1600', thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=400', width: 680, height: 420, createdAt: 24000 },
  { id: 'img-hd-bbq-bg', folderId: PRESET_POSTER_FOLDER_ID, name: '美食 · 深夜食堂夜市', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=90&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=400', width: 800, height: 1200, createdAt: 25000 },
  { id: 'img-hd-bbq-hero', folderId: PRESET_POSTER_FOLDER_ID, name: '美食 · 炭火烧烤串烧', url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=90&w=1600', thumbnailUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=400', width: 640, height: 480, createdAt: 26000 },
  { id: 'img-hd-beach-bg', folderId: PRESET_POSTER_FOLDER_ID, name: '美食 · 阳光棕榈海滩', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=90&w=2000', thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400', width: 800, height: 1200, createdAt: 27000 },
  { id: 'img-hd-drink-hero', folderId: PRESET_POSTER_FOLDER_ID, name: '美食 · 特调夏日冰饮', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=90&w=1600', thumbnailUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=400', width: 640, height: 480, createdAt: 28000 },
]

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
      // Ensure default folders & preset assets exist
      try {
        const tx = db.transaction([STORE_FOLDERS, STORE_ASSETS], 'readwrite')
        const folderStore = tx.objectStore(STORE_FOLDERS)
        const assetStore = tx.objectStore(STORE_ASSETS)

        folderStore.get(DEFAULT_FOLDER_ID).onsuccess = (ev: any) => {
          if (!ev.target.result) {
            folderStore.add({
              id: DEFAULT_FOLDER_ID,
              name: '默认素材分类',
              createdAt: Date.now(),
            })
          }
        }

        folderStore.get(PRESET_POSTER_FOLDER_ID).onsuccess = (ev: any) => {
          if (!ev.target.result) {
            folderStore.add({
              id: PRESET_POSTER_FOLDER_ID,
              name: '海报摄影高清原画集',
              createdAt: Date.now() + 1,
            })
            PRESET_POSTER_HD_IMAGES.forEach((item) => {
              assetStore.put(item)
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

export async function renameAssetFolder(folderId: string, name: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FOLDERS, 'readwrite')
    const store = tx.objectStore(STORE_FOLDERS)
    const req = store.get(folderId)
    req.onsuccess = (e: any) => {
      const folder = e.target.result as AssetFolder | undefined
      if (folder) {
        folder.name = name.trim()
        store.put(folder)
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

export async function renameUserAsset(id: string, name: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ASSETS, 'readwrite')
    const store = tx.objectStore(STORE_ASSETS)
    const request = store.get(id)
    request.onsuccess = () => {
      const asset = request.result as UserAsset | undefined
      if (!asset) {
        reject(new Error('Asset not found'))
        return
      }
      const updateRequest = store.put({ ...asset, name: name.trim() })
      updateRequest.onsuccess = () => resolve()
      updateRequest.onerror = (event) => reject(event)
    }
    request.onerror = (event) => reject(event)
  })
}
