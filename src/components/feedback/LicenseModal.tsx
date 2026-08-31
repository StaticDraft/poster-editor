import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Copy, KeyRound, Sparkles, X, Lock, CheckCircle2, AlertCircle, Wrench, Clock, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLicenseStore } from '@/store/useLicenseStore'
import { useFeedback } from '@/lib/feedback'
import { generateLicenseKey, getOffsetDateYYYYMMDD } from '@/lib/license'

const SELLER_DEFAULT_PIN = '888888'

export function LicenseModal() {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const {
    machineSN,
    licenseKey,
    isLicensed,
    isTrial,
    expiryDate,
    isPermanent,
    isModalOpen,
    isLoading,
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
  const [targetIsTrial, setTargetIsTrial] = useState(true)
  const [targetExpire, setTargetExpire] = useState(getOffsetDateYYYYMMDD(7)) // 默认 7 天试用
  const [generatedKey, setGeneratedKey] = useState('')

  useEffect(() => {
    if (machineSN && !targetSN) {
      setTargetSN(machineSN)
    }
  }, [machineSN, targetSN])

  // 如果未激活/已到期，强制全屏强锁遮罩（无法关闭/无法绕过）
  const isMandatoryLocked = !isLicensed
  const shouldShow = !isLoading && (isMandatoryLocked || isModalOpen)

  if (!shouldShow) return null

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

  const handlePresetExpire = (days: number | null, isTrialKey: boolean) => {
    setTargetIsTrial(isTrialKey)
    if (days === null) {
      setTargetExpire('20991231')
    } else {
      setTargetExpire(getOffsetDateYYYYMMDD(days))
    }
  }

  const handleGenerateKey = () => {
    if (!targetSN.trim()) return
    const key = generateLicenseKey(targetSN.trim(), targetExpire.trim() || '20991231', targetIsTrial)
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
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in-0">
      <div className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          !isLicensed
            ? 'bg-rose-500/10 border-rose-500/30'
            : isTrial
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
              !isLicensed
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : isTrial
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {!isLicensed ? <Lock className="w-5 h-5" /> : isTrial ? <Clock className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 select-none">
                {!isLicensed ? tr('license.mandatoryLockTitle', '🔒 软件尚未激活，请先输入授权激活码') : tr('license.title', '🛡️ 软件授权与硬件激活中心')}
                {isLicensed && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    isTrial
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {isTrial ? tr('license.badgeTrial', '试用版授权 (带水印)') : tr('license.badgePro', 'PRO 商业授权')}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {!isLicensed
                  ? tr('license.mandatoryLockDesc', '为确保正版使用，请输入卖家发送给您的授权码解锁编辑器。')
                  : `${tr('license.status', '授权状态')}: ${isPermanent ? tr('license.permanent', '永久商业授权 (无水印)') : `${expiryDate} (到期)`}`}
              </p>
            </div>
          </div>

          {/* 只有已激活的用户才显示关闭按钮，未激活状态下属于强锁定 */}
          {isLicensed && (
            <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={closeModal}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Unlicensed Warning Notification */}
          {!isLicensed && (
            <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 flex items-start gap-2.5 text-xs text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-bold">软件已受离线硬件锁保护</p>
                <p className="text-[11px] opacity-90">请复制下方的【机器码 (SN)】发送给闲鱼卖家获取激活码。</p>
              </div>
            </div>
          )}

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

          {/* Status Details / Key Input */}
          {isLicensed ? (
            <div className={`p-4 rounded-lg border space-y-3 ${
              isTrial
                ? 'border-amber-500/30 bg-amber-500/10'
                : 'border-emerald-500/30 bg-emerald-500/10'
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${isTrial ? 'text-amber-400' : 'text-emerald-400'}`} />
                <span className={isTrial ? 'text-amber-400' : 'text-emerald-400'}>
                  {isTrial
                    ? tr('license.trialActivated', '试用卡密激活成功！已解锁编辑器功能。')
                    : tr('license.proActivated', '正式商业授权激活成功！已解锁 PRO 全功能，水印已消除。')}
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground pl-6">
                {isTrial
                  ? tr('license.trialNotice', '⚠️ 当前为【试用卡密】，海报导出保留水印。升级为【正式卡密】可永久无水印导出。')
                  : tr('license.proNotice', '✨ 当前为【正式商业授权】，已解锁全部 PRO 功能，导出高清无水印海报。')}
              </p>

              <div className="text-xs text-muted-foreground space-y-1 pl-6 font-mono">
                <div>已绑定卡密: <span className="text-foreground font-semibold">{licenseKey}</span></div>
                <div>授权到期日: <span className={`font-bold ${isTrial ? 'text-amber-400' : 'text-emerald-400'}`}>{isPermanent ? tr('license.permanent', '永久商业授权') : expiryDate}</span></div>
              </div>

              <div className="pt-1 flex justify-end">
                <Button variant="ghost" size="sm" onClick={deactivateLicense} className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7">
                  {tr('license.deactivate', '解除当前授权')}
                </Button>
              </div>
            </div>
          ) : null}

          {/* Activation Input (Always visible if unlicensed or when upgrading) */}
          {(!isLicensed || isTrial) && (
            <div className="space-y-3 p-3.5 rounded-lg border border-border bg-card">
              <label className="text-xs font-bold text-foreground block">
                {tr('license.enterKey', '输入授权激活码')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  placeholder={tr('license.keyPlaceholder', '例: LIC-PRO-XXXX-20991231 或 LIC-TRL-XXXX-20260930')}
                  className="flex-1 h-9 bg-background border border-border rounded-lg px-3 text-xs font-mono text-foreground focus:border-indigo-500 outline-none uppercase"
                />
                <Button
                  onClick={handleActivate}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 h-9 gap-1.5 shadow-md shrink-0"
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
                      卖家算号模式 (可生成【试用卡密】与【正式卡密】)
                    </div>

                    {/* Key Type Selection */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground block font-semibold">{tr('license.keyTypeSelect', '生成卡密类型')}</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTargetIsTrial(true)
                            setTargetExpire(getOffsetDateYYYYMMDD(7))
                          }}
                          className={`px-3 py-1.5 rounded border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                            targetIsTrial
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                              : 'bg-background border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {tr('license.keyTypeTrial', '试用卡密 (带水印)')}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTargetIsTrial(false)
                            setTargetExpire('20991231')
                          }}
                          className={`px-3 py-1.5 rounded border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                            !targetIsTrial
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                              : 'bg-background border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {tr('license.keyTypePro', '正式卡密 (无水印)')}
                        </button>
                      </div>
                    </div>

                    {/* Expiration Preset Shortcuts */}
                    {targetIsTrial && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground block font-semibold">试用时长预设</label>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => handlePresetExpire(3, true)} className="h-6 text-[10px] flex-1">
                            {tr('license.preset3Days', '3天试用')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handlePresetExpire(7, true)} className="h-6 text-[10px] flex-1">
                            {tr('license.preset7Days', '7天试用')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handlePresetExpire(30, true)} className="h-6 text-[10px] flex-1">
                            {tr('license.preset30Days', '30天试用')}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5 font-semibold">{tr('license.targetSN', '买家电脑机器码 (SN)')}</label>
                        <input
                          type="text"
                          value={targetSN}
                          onChange={e => setTargetSN(e.target.value)}
                          placeholder="SN-XXXX-XXXX-XXXX-XXXX"
                          className="w-full h-7 bg-background border border-border rounded px-2 text-xs font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5 font-semibold">{tr('license.expireYYYYMMDD', '有效截止日期 (YYYYMMDD)')}</label>
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
                      <Button size="sm" onClick={handleGenerateKey} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-1 w-full">
                        ⚡ {tr('license.genKeyBtn', '生成算号激活码')}
                      </Button>
                    </div>

                    {generatedKey && (
                      <div className="p-2 bg-background border border-indigo-500/40 rounded flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400 select-all truncate">{generatedKey}</span>
                        <Button size="sm" variant="ghost" onClick={handleCopyGeneratedKey} className="h-6 text-[10px] gap-1 text-indigo-400 shrink-0">
                          <Copy className="w-3 h-3" />
                          {tr('license.copyKey', '复制激活码')}
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
            支持硬件离线算法，无网络环境即可稳定授权。
          </span>
          {isLicensed && (
            <Button variant="outline" size="sm" onClick={closeModal} className="text-xs">
              {tr('common.close', '关闭')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
