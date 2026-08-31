/**
 * 软件授权加密与硬件 SN 校验引擎
 */

const LICENSE_SECRET_SALT = 'POSTER_CRAFT_LICENSE_SALT_2026_LEAF'
const WEB_SN_STORAGE_KEY = 'poster_editor_web_sn'

/**
 * 简单字符串哈希算法 (FNV-1a 延伸 32位 16进制)
 */
function hashString(str: string): string {
  let h1 = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h1 ^= str.charCodeAt(i)
    h1 = Math.imul(h1, 0x01000193)
  }
  const hex = (h1 >>> 0).toString(16).toUpperCase().padStart(8, '0')
  
  // 第二轮混合翻转
  let h2 = 0x12345678
  for (let i = str.length - 1; i >= 0; i--) {
    h2 ^= str.charCodeAt(i)
    h2 = Math.imul(h2, 0x050c5d17)
  }
  const hex2 = (h2 >>> 0).toString(16).toUpperCase().padStart(8, '0')

  return (hex + hex2).slice(0, 12)
}

/**
 * 获取硬件 SN / 机器码
 */
export async function getMachineSN(): Promise<string> {
  // 1. Electron 桌面环境 IPC
  if (typeof window !== 'undefined' && window.electronAPI?.getMachineCode) {
    try {
      const sn = await window.electronAPI.getMachineCode()
      if (sn && typeof sn === 'string' && sn.length > 5) {
        return sn
      }
    } catch (_err) {
      console.warn('Failed to fetch Electron machine code:', _err)
    }
  }

  // 2. 纯 Web 浏览器环境退避指纹
  if (typeof window !== 'undefined' && window.localStorage) {
    const existing = window.localStorage.getItem(WEB_SN_STORAGE_KEY)
    if (existing) return existing

    const userAgent = navigator.userAgent || ''
    const screenRes = `${window.screen.width}x${window.screen.height}`
    const lang = navigator.language || ''
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    const raw = `${userAgent}-${screenRes}-${lang}-${randomId}`
    const hash = hashString(raw).toUpperCase().slice(0, 12)

    const webSn = `WEB-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`
    window.localStorage.setItem(WEB_SN_STORAGE_KEY, webSn)
    return webSn
  }

  return 'SN-POSTER-DEFAULT-0000'
}

/**
 * 校验规则接口
 */
export interface LicenseVerifyResult {
  valid: boolean
  expiryDate: string
  isPermanent: boolean
  messageKey: string
  fallbackMessage: string
}

/**
 * 根据机器码与过期时间 (YYYYMMDD) 生成标准激活码
 * 格式: LIC-XXXX-XXXX-YYYYMMDD
 */
export function generateLicenseKey(sn: string, expireDateYYYYMMDD: string = '20991231'): string {
  const cleanSn = sn.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  const payload = `${cleanSn}:${expireDateYYYYMMDD}:${LICENSE_SECRET_SALT}`
  const signature = hashString(payload).toUpperCase().slice(0, 8)
  const part1 = signature.slice(0, 4)
  const part2 = signature.slice(4, 8)
  return `LIC-${part1}-${part2}-${expireDateYYYYMMDD}`
}

/**
 * 校验激活码合法性
 */
export function verifyLicenseKey(sn: string, licenseKey: string): LicenseVerifyResult {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return {
      valid: false,
      expiryDate: '',
      isPermanent: false,
      messageKey: 'license.invalidEmpty',
      fallbackMessage: '请输入有效的授权激活码',
    }
  }

  const cleanKey = licenseKey.trim().toUpperCase()
  const match = /^LIC-([A-Z0-9]{4})-([A-Z0-9]{4})-(\d{8})$/.exec(cleanKey)
  if (!match) {
    return {
      valid: false,
      expiryDate: '',
      isPermanent: false,
      messageKey: 'license.invalidFormat',
      fallbackMessage: '授权激活码格式不正确 (例: LIC-XXXX-XXXX-20991231)',
    }
  }

  const [, _part1, _part2, expireDateYYYYMMDD] = match
  const expectedKey = generateLicenseKey(sn, expireDateYYYYMMDD)

  if (expectedKey !== cleanKey) {
    return {
      valid: false,
      expiryDate: '',
      isPermanent: false,
      messageKey: 'license.mismatchSN',
      fallbackMessage: '该授权码与当前电脑硬件 SN 不匹配',
    }
  }

  // 校验时间是否过期
  const year = parseInt(expireDateYYYYMMDD.slice(0, 4), 10)
  const month = parseInt(expireDateYYYYMMDD.slice(4, 6), 10) - 1
  const day = parseInt(expireDateYYYYMMDD.slice(6, 8), 10)
  const expireDateObj = new Date(year, month, day, 23, 59, 59)

  const isPermanent = year >= 2090
  const formattedExpireStr = isPermanent ? '永久商业授权' : `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  if (new Date() > expireDateObj) {
    return {
      valid: false,
      expiryDate: formattedExpireStr,
      isPermanent: false,
      messageKey: 'license.expired',
      fallbackMessage: `该授权已于 ${formattedExpireStr} 到期`,
    }
  }

  return {
    valid: true,
    expiryDate: formattedExpireStr,
    isPermanent,
    messageKey: 'license.verifySuccess',
    fallbackMessage: '授权激活成功！已解锁 PRO 全功能。',
  }
}
