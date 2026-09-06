/**
 * 软件授权加密与硬件 SN 校验引擎 (支持试用卡密 / 正式卡密)
 */

const LICENSE_SECRET_SALT = 'POSTER_CRAFT_LICENSE_SALT_2026_LEAF'
const WEB_SN_STORAGE_KEY = 'poster_editor_web_sn'

export type LicenseType = 'UNAUTHORIZED' | 'TRIAL' | 'PRO'

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

  let h2 = 0x12345678
  for (let i = str.length - 1; i >= 0; i--) {
    h2 ^= str.charCodeAt(i)
    h2 = Math.imul(h2, 0x050c5d17)
  }
  const hex2 = (h2 >>> 0).toString(16).toUpperCase().padStart(8, '0')

  return (hex + hex2).slice(0, 12)
}

/**
 * 判断当前是否运行在 Electron 桌面端环境 (.exe)
 */
export function isElectronApp(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(
    window.electronAPI?.isElectron ||
    (window as any).electronAPI ||
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.includes('Electron'))
  )
}

/**
 * 获取硬件 SN / 机器码
 */
export async function getMachineSN(): Promise<string> {
  // 1. Electron 桌面环境 IPC
  if (typeof window !== 'undefined' && window.electronAPI?.getMachineCode) {
    try {
      const sn = await window.electronAPI.getMachineCode()
      if (sn && typeof sn === 'string' && sn.length > 3) {
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
  licenseType: LicenseType
  expiryDate: string
  isTrial: boolean
  isPermanent: boolean
  messageKey: string
  fallbackMessage: string
}

/**
 * 根据机器码、过期时间 (YYYYMMDD) 与卡密类型生成激活码
 * 格式:
 * - 试用卡密: LIC-TRL-XXXX-YYYYMMDD
 * - 正式卡密: LIC-PRO-XXXX-YYYYMMDD (默认 20991231)
 */
export function generateLicenseKey(
  sn: string,
  expireDateYYYYMMDD: string = '20991231',
  isTrial: boolean = false
): string {
  const cleanSn = sn.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  const tag = isTrial ? 'TRL' : 'PRO'
  const payload = `${tag}:${cleanSn}:${expireDateYYYYMMDD}:${LICENSE_SECRET_SALT}`
  const signature = hashString(payload).toUpperCase().slice(0, 8)
  const part1 = signature.slice(0, 4)
  const part2 = signature.slice(4, 8)
  return `LIC-${tag}-${part1}${part2}-${expireDateYYYYMMDD}`
}

/**
 * 根据当前日期加上指定天数计算 YYYYMMDD
 */
export function getOffsetDateYYYYMMDD(days: number): string {
  const target = new Date()
  target.setDate(target.getDate() + days)
  const yyyy = target.getFullYear()
  const mm = String(target.getMonth() + 1).padStart(2, '0')
  const dd = String(target.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

/**
 * 校验激活码合法性 (兼容试用与正式卡密)
 */
export function verifyLicenseKey(sn: string, licenseKey: string): LicenseVerifyResult {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return {
      valid: false,
      licenseType: 'UNAUTHORIZED',
      expiryDate: '',
      isTrial: false,
      isPermanent: false,
      messageKey: 'license.invalidEmpty',
      fallbackMessage: '请输入有效的授权激活码',
    }
  }

  const cleanKey = licenseKey.trim().toUpperCase()
  // 匹配 LIC-TRL-XXXXXXXX-YYYYMMDD 或 LIC-PRO-XXXXXXXX-YYYYMMDD 或旧版 LIC-XXXX-XXXX-YYYYMMDD
  const match = /^LIC-(TRL|PRO|([A-Z0-9]{4}))-([A-Z0-9]{4,8})-(\d{8})$/.exec(cleanKey)
  if (!match) {
    return {
      valid: false,
      licenseType: 'UNAUTHORIZED',
      expiryDate: '',
      isTrial: false,
      isPermanent: false,
      messageKey: 'license.invalidFormat',
      fallbackMessage: '授权激活码格式不正确 (例: LIC-PRO-XXXX-20991231 或 LIC-TRL-XXXX-20260930)',
    }
  }

  const [, typeTag, , , expireDateYYYYMMDD] = match
  const isTrialKey = typeTag === 'TRL'

  // 计算预期匹配的 Key
  let expectedKey = ''
  if (typeTag === 'TRL' || typeTag === 'PRO') {
    expectedKey = generateLicenseKey(sn, expireDateYYYYMMDD, isTrialKey)
  } else {
    // 兼容老版本格式 LIC-PART1-PART2-YYYYMMDD
    const cleanSn = sn.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    const payload = `${cleanSn}:${expireDateYYYYMMDD}:${LICENSE_SECRET_SALT}`
    const signature = hashString(payload).toUpperCase().slice(0, 8)
    const part1 = signature.slice(0, 4)
    const part2 = signature.slice(4, 8)
    expectedKey = `LIC-${part1}-${part2}-${expireDateYYYYMMDD}`
  }

  if (expectedKey !== cleanKey) {
    return {
      valid: false,
      licenseType: 'UNAUTHORIZED',
      expiryDate: '',
      isTrial: false,
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
      licenseType: 'UNAUTHORIZED',
      expiryDate: formattedExpireStr,
      isTrial: isTrialKey,
      isPermanent: false,
      messageKey: 'license.expired',
      fallbackMessage: `该授权已于 ${formattedExpireStr} 到期，请重新激活`,
    }
  }

  const resolvedType: LicenseType = isTrialKey ? 'TRIAL' : 'PRO'

  return {
    valid: true,
    licenseType: resolvedType,
    expiryDate: formattedExpireStr,
    isTrial: isTrialKey,
    isPermanent,
    messageKey: isTrialKey ? 'license.trialActivated' : 'license.proActivated',
    fallbackMessage: isTrialKey
      ? `试用授权激活成功！有效期至 ${formattedExpireStr}（试用版带水印）。`
      : '正式商业授权激活成功！全功能已解锁，水印已去除。',
  }
}
