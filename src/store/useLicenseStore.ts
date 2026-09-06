import { create } from 'zustand'
import { getMachineSN, verifyLicenseKey, isElectronApp, type LicenseType } from '@/lib/license'

const LICENSE_STORAGE_KEY = 'poster_editor_license_key'

export interface LicenseState {
  machineSN: string
  licenseKey: string
  licenseType: LicenseType
  isLicensed: boolean
  isTrial: boolean
  isPermanent: boolean
  showWatermark: boolean
  expiryDate: string
  isModalOpen: boolean
  isLoading: boolean
  initLicense: () => Promise<void>
  activateLicense: (key: string) => { success: boolean; messageKey: string; fallbackMessage: string }
  deactivateLicense: () => void
  openModal: () => void
  closeModal: () => void
}

const isDesktop = typeof window !== 'undefined' ? isElectronApp() : false

export const useLicenseStore = create<LicenseState>((set, get) => ({
  machineSN: isDesktop ? '获取中...' : 'WEB-FREE',
  licenseKey: '',
  licenseType: isDesktop ? 'UNAUTHORIZED' : 'PRO',
  isLicensed: !isDesktop, // 网页端直接默认授权通过
  isTrial: false,
  isPermanent: !isDesktop,
  showWatermark: isDesktop, // 网页端默认无水印
  expiryDate: isDesktop ? '' : '20991231',
  isModalOpen: false,
  isLoading: isDesktop, // 网页端无需等待授权检测

  initLicense: async () => {
    // 1. 纯网页端 (Web)：完全免授权，无需卡密，无水印，不锁定
    if (!isElectronApp()) {
      set({
        machineSN: 'WEB-FREE',
        licenseKey: '',
        licenseType: 'PRO',
        isLicensed: true,
        isTrial: false,
        isPermanent: true,
        showWatermark: false,
        expiryDate: '20991231',
        isModalOpen: false,
        isLoading: false,
      })
      return
    }

    // 2. 桌面客户端 (Electron / exe)：必须校验硬件一机一码授权
    set({ isLoading: true })
    try {
      const sn = await getMachineSN()
      const savedKey = typeof window !== 'undefined' ? window.localStorage.getItem(LICENSE_STORAGE_KEY) || '' : ''

      if (savedKey) {
        const verifyRes = verifyLicenseKey(sn, savedKey)
        if (verifyRes.valid) {
          const isTrial = verifyRes.isTrial
          const isPro = verifyRes.licenseType === 'PRO'
          set({
            machineSN: sn,
            licenseKey: savedKey,
            licenseType: verifyRes.licenseType,
            isLicensed: true,
            isTrial,
            isPermanent: verifyRes.isPermanent,
            showWatermark: !isPro, // 只有 PRO 正式商业授权才移除水印，试用版保留水印
            expiryDate: verifyRes.expiryDate,
            isModalOpen: false,
            isLoading: false,
          })
          return
        }
      }

      // 未激活或授权已到期：强行弹出弹窗锁死界面
      set({
        machineSN: sn,
        licenseKey: savedKey,
        licenseType: 'UNAUTHORIZED',
        isLicensed: false,
        isTrial: false,
        isPermanent: false,
        showWatermark: true,
        expiryDate: '',
        isModalOpen: true, // 强制弹窗
        isLoading: false,
      })
    } catch (err) {
      console.error('Failed to initialize license:', err)
      set({ isLoading: false, isModalOpen: true })
    }
  },

  activateLicense: (key: string) => {
    const { machineSN } = get()
    const result = verifyLicenseKey(machineSN, key)

    if (result.valid) {
      const cleanKey = key.trim().toUpperCase()
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LICENSE_STORAGE_KEY, cleanKey)
      }
      const isPro = result.licenseType === 'PRO'
      set({
        licenseKey: cleanKey,
        licenseType: result.licenseType,
        isLicensed: true,
        isTrial: result.isTrial,
        isPermanent: result.isPermanent,
        showWatermark: !isPro, // 正式版无水印，试用版保留水印
        expiryDate: result.expiryDate,
        isModalOpen: false, // 校验通过后关闭全屏强锁
      })
      return { success: true, messageKey: result.messageKey, fallbackMessage: result.fallbackMessage }
    } else {
      return { success: false, messageKey: result.messageKey, fallbackMessage: result.fallbackMessage }
    }
  },

  deactivateLicense: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LICENSE_STORAGE_KEY)
    }
    set({
      licenseKey: '',
      licenseType: 'UNAUTHORIZED',
      isLicensed: false,
      isTrial: false,
      isPermanent: false,
      showWatermark: true,
      expiryDate: '',
      isModalOpen: true, // 解绑后重新开启全屏强锁
    })
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => {
    // 只有在已成功激活 (Trial 或 PRO) 的情况下，才允许关闭弹窗；未激活时禁止关闭
    if (get().isLicensed) {
      set({ isModalOpen: false })
    }
  },
}))
