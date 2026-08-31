import { describe, it, expect } from 'vitest'
import { generateLicenseKey, verifyLicenseKey } from './license'

describe('License Engine', () => {
  const testSN = 'SN-1A2B-3C4D-5E6F'

  it('should generate valid license key for permanent license', () => {
    const key = generateLicenseKey(testSN, '20991231')
    expect(key).toMatch(/^LIC-[A-Z0-9]{4}-[A-Z0-9]{4}-20991231$/)

    const verifyRes = verifyLicenseKey(testSN, key)
    expect(verifyRes.valid).toBe(true)
    expect(verifyRes.isPermanent).toBe(true)
  })

  it('should verify license expiry date correctly', () => {
    const validFutureKey = generateLicenseKey(testSN, '20301231')
    const verifyFuture = verifyLicenseKey(testSN, validFutureKey)
    expect(verifyFuture.valid).toBe(true)

    const expiredKey = generateLicenseKey(testSN, '20200101')
    const verifyExpired = verifyLicenseKey(testSN, expiredKey)
    expect(verifyExpired.valid).toBe(false)
    expect(verifyExpired.messageKey).toBe('license.expired')
  })

  it('should reject invalid or mismatched SN keys', () => {
    const keyOtherSN = generateLicenseKey('SN-9999-9999-9999', '20991231')
    const verifyRes = verifyLicenseKey(testSN, keyOtherSN)
    expect(verifyRes.valid).toBe(false)
    expect(verifyRes.messageKey).toBe('license.mismatchSN')
  })
})
