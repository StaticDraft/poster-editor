import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Copy, KeyRound, Sparkles, X, Lock, CheckCircle2, AlertCircle, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLicenseStore } from '@/store/useLicenseStore'
import { useFeedback } from '@/lib/feedback'
import { generateLicenseKey } from '@/lib/license'

const SELLER_DEFAULT_PIN = '888888'

export function LicenseModal() {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const {
    machineSN,
    licenseKey,
    isLicensed,
    expiryDate,
    isPermanent,
    isModalOpen,
    closeModal,
    activateLicense,
    deactivateLicense,
  } = useLicenseStore()

  const [inputKey, setInputKey] = useState('')
  const [showSellerTool, setShowSellerTool] = useState(false)
  const [sellerPinInput, setSellerPinInput] = useState('')
  const [sellerUnlocked, setSellerUnlocked] = useState(false)

  // Seller generator inputs
  const [targetSN, setTargetSN] = useState('')
  const [targetExpire, setTargetExpire] = useState('20991231')
  const [generatedKey, setGeneratedKey] = useState('')

  useEffect(() => {
    if (machineSN && !targetSN) {
      setTargetSN(machineSN)
    }
  }, [machineSN, targetSN])

  if (!isModalOpen) return null

  const tr = (key: string, fallback: string) => {
    const val = t(key)
    return val === key ? fallback : val
  }

  const handleCopySN = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(machineSN)
      feedback.notify({
        title: tr('license.snCopied', '机器码已成功复制到剪贴板！'),
        tone: 'success',
      })
    }
  }

  const handleActivate = () => {
    if (!inputKey.trim()) {
      feedback.notify({
        title: tr('license.invalidEmpty', '请输入有效的授权激活码'),
        tone: 'warning',
      })
      return
    }

    const res = activateLicense(inputKey)
    if (res.success) {
      feedback.notify({
        title: tr(res.messageKey, res.fallbackMessage),
        tone: 'success',
      })
      setInputKey('')
    } else {
      feedback.notify({
        title: tr(res.messageKey, res.fallbackMessage),
        tone: 'error',
      })
    }
  }

  const handleUnlockSeller = () => {
    if (sellerPinInput.trim() === SELLER_DEFAULT_PIN) {
      setSellerUnlocked(true)
      feedback.notify({
        title: tr('license.sellerUnlockSuccess', '算号工具解锁成功！'),
        tone: 'success',
      })
    } else {
      feedback.notify({
        title: tr('license.sellerPINError', 'PIN 码错误 (默认: 888888)'),
        tone: 'error',
      })
    }
  }

  const handleGenerateKey = () => {
    if (!targetSN.trim()) return
    const key = generateLicenseKey(targetSN.trim(), targetExpire.trim() || '20991231')
    setGeneratedKey(key)
  }

  const handleCopyGeneratedKey = () => {
    if (navigator.clipboard && generatedKey) {
      navigator.clipboard.writeText(generatedKey)
      feedback.notify({
        title: '生成的授权码已复制到剪贴板！',
        tone: 'success',
      })
    }
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in-0">
      <div className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
              isLicensed
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 select-none">
                {tr('license.title', '🛡️ 软件授权与硬件激活中心')}
                {isLicensed && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {tr('license.badgeLicensed', 'PRO 商业授权')}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {isLicensed
                  ? `${tr('license.status', '授权状态')}: ${isPermanent ? tr('license.permanent', '永久商业授权') : expiryDate}`
                  : tr('license.badgeUnlicensed', '当前电脑尚未激活商业授权（试用状态）')}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={closeModal}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Machine SN Display Box */}
          <div className="p-3.5 rounded-lg border border-border bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                {tr('license.machineSN', '当前电脑机器码 (SN)')}
              </span>
              <Button size="sm" variant="outline" onClick={handleCopySN} className="h-6 text-[11px] gap-1 px-2">
                <Copy className="w-3 h-3" />
                {tr('license.copySN', '复制机器码')}
              </Button>
            </div>
            <div className="font-mono text-sm font-bold text-indigo-400 bg-background px-3 py-2 rounded border border-border tracking-wider text-center select-all">
              {machineSN}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {tr('license.snDesc', '此 SN 基于您的电脑硬件 BIOS/系统信息生成，唯一绑定当前设备。')}
            </p>
          </div>

          {/* Activation State or Input */}
          {isLicensed ? (
            <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{tr('license.verifySuccess', '授权激活成功！已解锁 PRO 全功能。')}</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pl-6">
                <div>已绑定激活码: <span className="font-mono text-foreground font-semibold">{licenseKey}</span></div>
                <div>授权有效期: <span className="text-emerald-400 font-bold">{isPermanent ? tr('license.permanent', '永久商业授权') : expiryDate}</span></div>
              </div>
              <div className="pt-1 flex justify-end">
                <Button variant="ghost" size="sm" onClick={deactivateLicense} className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7">
                  {tr('license.deactivate', '解除当前授权')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-xs font-bold text-foreground block">
                {tr('license.enterKey', '输入授权激活码')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  placeholder={tr('license.keyPlaceholder', '例: LIC-XXXX-XXXX-20991231')}
                  className="flex-1 h-9 bg-background border border-border rounded-lg px-3 text-xs font-mono text-foreground focus:border-indigo-500 outline-none uppercase"
                />
                <Button
                  onClick={handleActivate}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 h-9 gap-1.5 shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {tr('license.activateBtn', '🚀 立即验证激活')}
                </Button>
              </div>
            </div>
          )}

          {/* Seller Generator Toggle Drawer */}
          <div className="pt-2 border-t border-border">
            <button
              onClick={() => setShowSellerTool(!showSellerTool)}
              className="text-[11px] text-muted-foreground hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <Wrench className="w-3 h-3" />
              {tr('license.sellerTools', '闲鱼卖家算号器工具 (Seller Key Generator)')}
            </button>

            {showSellerTool && (
              <div className="mt-3 p-3.5 rounded-lg border border-indigo-500/30 bg-indigo-950/20 space-y-3 animate-in fade-in-0">
                {!sellerUnlocked ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      {tr('license.sellerPINPrompt', '输入卖家验证 PIN 码解锁算号器 (默认: 888888)')}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={sellerPinInput}
                        onChange={e => setSellerPinInput(e.target.value)}
                        placeholder="PIN 码 (如: 888888)"
                        className="flex-1 h-7 bg-background border border-border rounded px-2 text-xs outline-none"
                      />
                      <Button size="sm" onClick={handleUnlockSeller} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white">
                        解锁算号器
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      卖家算号模式 (生成任意买家的专属激活码)
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5 font-semibold">买家电脑机器码 (SN)</label>
                        <input
                          type="text"
                          value={targetSN}
                          onChange={e => setTargetSN(e.target.value)}
                          placeholder="SN-XXXX-XXXX-XXXX-XXXX"
                          className="w-full h-7 bg-background border border-border rounded px-2 text-xs font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5 font-semibold">到期时间 (YYYYMMDD)</label>
                        <input
                          type="text"
                          value={targetExpire}
                          onChange={e => setTargetExpire(e.target.value)}
                          placeholder="20991231 (永久)"
                          className="w-full h-7 bg-background border border-border rounded px-2 text-xs font-mono outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleGenerateKey} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-1">
                        ⚡ 生成算号激活码
                      </Button>
                    </div>

                    {generatedKey && (
                      <div className="p-2 bg-background border border-indigo-500/40 rounded flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-emerald-400 select-all">{generatedKey}</span>
                        <Button size="sm" variant="ghost" onClick={handleCopyGeneratedKey} className="h-6 text-[10px] gap-1 text-indigo-400">
                          <Copy className="w-3 h-3" />
                          复制发送给买家
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            支持硬件绑定离线激活，无网络即可稳定运行。
          </span>
          <Button variant="outline" size="sm" onClick={closeModal} className="text-xs">
            {tr('common.close', '关闭')}
          </Button>
        </div>
      </div>
    </div>
  )
}
