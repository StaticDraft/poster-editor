import { describe, it, expect } from 'vitest'
import { generateLicenseKey, verifyLicenseKey, getOffsetDateYYYYMMDD } from './license'

describe('Dual Tier License Engine', () => {
  const testSN = 'SN-5CD9351M6T'

  it('should generate and verify valid PRO permanent license key', () => {
    const key = generateLicenseKey(testSN, '20991231', false)
    expect(key).toMatch(/^LIC-PRO-[A-Z0-9]{8}-20991231$/)

    const res = verifyLicenseKey(testSN, key)
    expect(res.valid).toBe(true)
    expect(res.licenseType).toBe('PRO')
    expect(res.isTrial).toBe(false)
    expect(res.isPermanent).toBe(true)
  })

  it('should generate and verify valid Trial license key with expiry date', () => {
    const future7Days = getOffsetDateYYYYMMDD(7)
    const trialKey = generateLicenseKey(testSN, future7Days, true)
    expect(trialKey).toMatch(/^LIC-TRL-[A-Z0-9]{8}-\d{8}$/)

    const res = verifyLicenseKey(testSN, trialKey)
    expect(res.valid).toBe(true)
    expect(res.licenseType).toBe('TRIAL')
    expect(res.isTrial).toBe(true)
    expect(res.isPermanent).toBe(false)
  })

  it('should reject expired trial key', () => {
    const expiredTrialKey = generateLicenseKey(testSN, '20200101', true)
    const res = verifyLicenseKey(testSN, expiredTrialKey)
    expect(res.valid).toBe(false)
    expect(res.licenseType).toBe('UNAUTHORIZED')
    expect(res.messageKey).toBe('license.expired')
  })

  it('should reject mismatched SN key', () => {
    const proKeyOtherSN = generateLicenseKey('SN-OTHER-DEVICE', '20991231', false)
    const res = verifyLicenseKey(testSN, proKeyOtherSN)
    expect(res.valid).toBe(false)
    expect(res.messageKey).toBe('license.mismatchSN')
  })
})
