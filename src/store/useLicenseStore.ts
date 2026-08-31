import { create } from 'zustand'
import { getMachineSN, verifyLicenseKey } from '@/lib/license'

const LICENSE_STORAGE_KEY = 'poster_editor_license_key'

export interface LicenseState {
  machineSN: string
  licenseKey: string
  isLicensed: boolean
  expiryDate: string
  isPermanent: boolean
  isModalOpen: boolean
  isLoading: boolean
  initLicense: () => Promise<void>
  activateLicense: (key: string) => { success: boolean; messageKey: string; fallbackMessage: string }
  deactivateLicense: () => void
  openModal: () => void
  closeModal: () => void
}

export const useLicenseStore = create<LicenseState>((set, get) => ({
  machineSN: '获取中...',
  licenseKey: '',
  isLicensed: false,
  expiryDate: '',
  isPermanent: false,
  isModalOpen: false,
  isLoading: true,

  initLicense: async () => {
    set({ isLoading: true })
    try {
      const sn = await getMachineSN()
      const savedKey = typeof window !== 'undefined' ? window.localStorage.getItem(LICENSE_STORAGE_KEY) || '' : ''

      if (savedKey) {
        const verifyRes = verifyLicenseKey(sn, savedKey)
        if (verifyRes.valid) {
          set({
            machineSN: sn,
            licenseKey: savedKey,
            isLicensed: true,
            expiryDate: verifyRes.expiryDate,
            isPermanent: verifyRes.isPermanent,
            isLoading: false,
          })
          return
        }
      }

      set({
        machineSN: sn,
        licenseKey: savedKey,
        isLicensed: false,
        expiryDate: '',
        isPermanent: false,
        isLoading: false,
      })
    } catch (err) {
      console.error('Failed to initialize license:', err)
      set({ isLoading: false })
    }
  },

  activateLicense: (key: string) => {
    const { machineSN } = get()
    const result = verifyLicenseKey(machineSN, key)

    if (result.valid) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LICENSE_STORAGE_KEY, key.trim().toUpperCase())
      }
      set({
        licenseKey: key.trim().toUpperCase(),
        isLicensed: true,
        expiryDate: result.expiryDate,
        isPermanent: result.isPermanent,
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
      isLicensed: false,
      expiryDate: '',
      isPermanent: false,
    })
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}))
