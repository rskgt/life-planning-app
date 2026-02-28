'use client'

import {
  PiggyBank, TrendingUp, Wallet, TrendingDown, Heart,
  ArrowRight, PiggyBank as PiggyBankIcon, TrendingDown as TrendingDownIcon,
  Briefcase, ChevronDown, Lock, Coins, Timer,
} from 'lucide-react'
import { ReactNode, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Input } from '@/components/ui/Input'
import { useOnboardingStore } from '@/store/useOnboardingStore'
import { calculateNetAnnualIncome, calculateIDeCoTaxBenefit } from '@/lib/calculateSimulation'

// ─── Field ラッパー ──────────────────────────────────────

function Field({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: React.ElementType
  label: string
  hint: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-navy mb-2">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      {children}
      <p className="text-xs text-muted mt-1.5">{hint}</p>
    </div>
  )
}

// ─── 手取り概算バッジ ──────────────────────────────────

function NetIncomeHint({ grossAnnual }: { grossAnnual: string }) {
  const gross = parseFloat(grossAnnual) || 0
  if (gross <= 0) return null
  const net = calculateNetAnnualIncome(gross)
  return (
    <div
      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
      style={{ backgroundColor: '#e6f0ff', color: '#003366' }}
    >
      <ArrowRight className="w-3 h-3 flex-shrink-0" />
      <span>
        手取り年収の概算：約{' '}
        <span className="font-semibold tabular-nums">
          {Math.round(net).toLocaleString()}万円
        </span>
        {' '}（月額 約{' '}
        <span className="font-semibold tabular-nums">
          {Math.round((net / 12) * 10) / 10}万円
        </span>
        ）
      </span>
    </div>
  )
}

// ─── チェックボックスアイコン ─────────────────────────

function CheckboxIcon({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={[
        'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200',
        enabled ? 'bg-navy border-navy' : 'bg-white border-border-base',
      ].join(' ')}
    >
      {enabled && (
        <motion.svg
          className="w-3 h-3 text-white"
          fill="none"
          viewBox="0 0 12 12"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <path
            d="M2 6l3 3 5-5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      )}
    </div>
  )
}

// ─── トグルスイッチ ───────────────────────────────────

function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-2.5 group"
    >
      <div
        className={[
          'relative w-10 h-5.5 rounded-full transition-colors duration-200 flex-shrink-0',
          enabled ? 'bg-navy' : 'bg-border-base',
        ].join(' ')}
        style={{ height: '22px', width: '40px' }}
      >
        <span
          className={[
            'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
            enabled ? 'translate-x-5' : 'translate-x-0.5',
          ].join(' ')}
        />
      </div>
      <span className={`text-sm font-medium ${enabled ? 'text-navy' : 'text-muted'}`}>
        {label}
      </span>
    </button>
  )
}

// ─── 収入維持率スライダー ─────────────────────────────

function RateSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const num = Math.min(100, Math.max(0, parseFloat(value) || 0))
  const pct = num  // 0〜100

  const color =
    num >= 80 ? '#16a34a' :
    num >= 60 ? '#d97706' :
    '#dc2626'

  const trackBg = `linear-gradient(to right, ${color} ${pct}%, #e2e8f0 ${pct}%)`

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{label}</p>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full text-white tabular-nums"
          style={{ backgroundColor: color }}
        >
          {num}%
        </span>
      </div>
      <div className="relative flex items-center h-7">
        <div className="absolute w-full h-1.5 rounded-full" style={{ background: trackBg }} />
        <div
          className="absolute w-4 h-4 rounded-full bg-white shadow-sm pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)`, border: `2px solid ${color}` }}
        />
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={num}
          onChange={(e) => onChange(e.target.value)}
          className="absolute w-full cursor-pointer"
          style={{ opacity: 0, height: '28px' }}
          aria-label={label}
        />
      </div>
      <div className="flex justify-between text-[10px] text-subtle px-0.5">
        <span>10%</span><span>55%</span><span>100%</span>
      </div>
    </div>
  )
}

// ─── 収入カーブ試算バッジ ──────────────────────────────

function IncomeCurvePreview({
  grossAnnual,
  rate1,
  rate2,
}: {
  grossAnnual: string
  rate1: string
  rate2: string
}) {
  const gross = parseFloat(grossAnnual) || 0
  if (gross <= 0) return null
  const base  = calculateNetAnnualIncome(gross)
  const net1  = calculateNetAnnualIncome(gross * (parseFloat(rate1) || 85) / 100)
  const net2  = calculateNetAnnualIncome(gross * (parseFloat(rate2) || 60) / 100)

  const fmt = (v: number) => `約${Math.round(v / 12 * 10) / 10}万円`

  return (
    <div
      className="mt-2 rounded-lg px-3 py-2 space-y-1 text-[11px]"
      style={{ backgroundColor: '#fef9e7' }}
    >
      <p className="font-medium" style={{ color: '#d4af37' }}>収入の推移イメージ</p>
      <div className="flex items-center gap-1.5" style={{ color: '#003366' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
        <span>現在〜減少①前: <span className="font-semibold">{fmt(base)}/月</span></span>
      </div>
      <div className="flex items-center gap-1.5" style={{ color: '#003366' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
        <span>減少①〜②前: <span className="font-semibold">{fmt(net1)}/月</span></span>
      </div>
      <div className="flex items-center gap-1.5" style={{ color: '#003366' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
        <span>減少②〜退職まで: <span className="font-semibold">{fmt(net2)}/月</span></span>
      </div>
    </div>
  )
}

// ─── コンポーネント ──────────────────────────────────────

export function Step2Financial() {
  const { data, setField } = useOnboardingStore()

  // 運用資産内訳アコーディオンの開閉状態
  const [showAssetBreakdown, setShowAssetBreakdown] = useState(() =>
    parseFloat(data.currentDC) > 0 || parseFloat(data.currentNISABalance ?? '') > 0
  )
  // 積立内訳アコーディオン（iDeCo・NISA）の開閉状態
  const [showBreakdown, setShowBreakdown] = useState(() => data.idecoEnabled || data.nisaEnabled)

  // 運用資産内訳の計算
  const dcAmt            = parseFloat(data.currentDC) || 0
  const nisaBalAmt       = parseFloat(data.currentNISABalance ?? '') || 0
  const totalInvAmt      = parseFloat(data.currentInvestments) || 0
  const breakdownSum     = dcAmt + nisaBalAmt
  const breakdownExceeds = totalInvAmt > 0 && breakdownSum > totalInvAmt

  // iDeCo 税メリット計算
  const grossAnnual     = parseFloat(data.annualIncome) || 0
  const idecoAnnual     = (parseFloat(data.idecoMonthlyAmount) || 0) * 12
  const idecoTaxBenefit = calculateIDeCoTaxBenefit(grossAnnual, idecoAnnual)

  return (
    <div className="space-y-7">

      {/* ── 初期資産セクション ── */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
          現在の資産
        </p>
        <div className="space-y-4">
          <Field
            icon={PiggyBankIcon}
            label="現金預金"
            hint="普通預金・定期預金など急な出費に備える現金"
          >
            <Input
              type="number"
              value={data.currentCash}
              onChange={(e) => setField('currentCash', e.target.value)}
              placeholder="100"
              suffix="万円"
              min="0"
            />
          </Field>

          <Field
            icon={TrendingUp}
            label="運用資産（総額）"
            hint="NISA・DC・特定口座など、現在保有する運用資産の合計額"
          >
            <Input
              type="number"
              value={data.currentInvestments}
              onChange={(e) => setField('currentInvestments', e.target.value)}
              placeholder="50"
              suffix="万円"
              min="0"
            />
          </Field>

          {/* ── 運用資産の内訳アコーディオン ── */}
          <div
            className={[
              'rounded-xl border-2 overflow-hidden transition-colors duration-200',
              (dcAmt > 0 || nisaBalAmt > 0) ? 'border-navy' : 'border-border-base',
            ].join(' ')}
          >
            <button
              type="button"
              onClick={() => setShowAssetBreakdown(!showAssetBreakdown)}
              className={[
                'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                showAssetBreakdown ? 'bg-blue-light/40' : 'bg-white hover:bg-background',
              ].join(' ')}
            >
              <ChevronDown
                className={[
                  'w-4 h-4 flex-shrink-0 transition-transform duration-200',
                  showAssetBreakdown ? 'rotate-180' : '',
                  (dcAmt > 0 || nisaBalAmt > 0) ? 'text-navy' : 'text-muted',
                ].join(' ')}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${(dcAmt > 0 || nisaBalAmt > 0) ? 'text-navy' : 'text-muted'}`}>
                  運用資産の内訳を入力（DC・NISA）
                </p>
                <p className="text-[11px] text-subtle mt-0.5">
                  {(dcAmt > 0 || nisaBalAmt > 0)
                    ? [
                        dcAmt > 0      ? `DC ${dcAmt.toLocaleString()}万円` : '',
                        nisaBalAmt > 0 ? `NISA ${nisaBalAmt.toLocaleString()}万円` : '',
                      ].filter(Boolean).join(' ＋ ')
                    : 'DC・NISA残高を運用資産総額の内訳として設定'}
                </p>
              </div>
              {breakdownExceeds && (
                <span className="ml-auto text-xs font-medium text-red-500 whitespace-nowrap">
                  合計超過
                </span>
              )}
            </button>

            <AnimatePresence initial={false}>
              {showAssetBreakdown && (
                <motion.div
                  key="asset-breakdown"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="px-4 pb-4 pt-3 space-y-3 border-t border-border-base bg-white">
                    <div
                      className="px-3 py-2 rounded-lg text-[11px] text-muted leading-relaxed"
                      style={{ backgroundColor: '#fef9e7' }}
                    >
                      <span style={{ color: '#d4af37' }}>ℹ</span>{' '}
                      DC残高とNISA残高の合計が「運用資産（総額）」を超えないようにしてください。DC残高は60歳まで取り崩し対象から自動除外されます。
                    </div>

                    <div>
                      <p className="text-xs text-muted mb-1.5 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        確定拠出年金（DC）残高
                      </p>
                      <Input
                        type="number"
                        value={data.currentDC}
                        onChange={(e) => setField('currentDC', e.target.value)}
                        placeholder="0"
                        suffix="万円"
                        min="0"
                      />
                      <p className="text-[10px] text-subtle mt-1">iDeCoや企業型DC ― 60歳まで引き出し不可</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted mb-1.5 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5" />
                        NISA残高
                      </p>
                      <Input
                        type="number"
                        value={data.currentNISABalance ?? ''}
                        onChange={(e) => setField('currentNISABalance', e.target.value)}
                        placeholder="0"
                        suffix="万円"
                        min="0"
                      />
                      <p className="text-[10px] text-subtle mt-1">非課税で運用・取り崩しが可能な資産</p>
                    </div>

                    {(dcAmt > 0 || nisaBalAmt > 0) && (
                      <div
                        className="rounded-lg px-3 py-2 space-y-1"
                        style={{ backgroundColor: breakdownExceeds ? '#fef2f2' : '#e6f0ff' }}
                      >
                        <div
                          className="flex items-center justify-between text-xs"
                          style={{ color: breakdownExceeds ? '#dc2626' : '#003366' }}
                        >
                          <span>DC + NISA 合計</span>
                          <span className="font-semibold">{breakdownSum.toLocaleString()} 万円</span>
                        </div>
                        <div
                          className="flex items-center justify-between text-xs border-t pt-1"
                          style={{
                            borderColor: breakdownExceeds ? '#fecaca' : '#b3c9e8',
                            color: breakdownExceeds ? '#dc2626' : '#003366',
                          }}
                        >
                          <span className="font-medium">流動性資産（取り崩し可能）</span>
                          <span className="font-bold">
                            {breakdownExceeds
                              ? '計算不可'
                              : `${Math.max(0, totalInvAmt - dcAmt).toLocaleString()} 万円`}
                          </span>
                        </div>
                        {breakdownExceeds && (
                          <p className="text-[10px] text-red-500 pt-0.5">
                            ⚠ 内訳の合計が運用資産（総額）を超えています
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── 収入セクション ── */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
          収入
        </p>
        <div className="space-y-4">
          <Field
            icon={Wallet}
            label="額面の年収（ボーナス込み）"
            hint="源泉徴収票の「支払金額」など、税引き前の年収合計"
          >
            <Input
              type="number"
              value={data.annualIncome}
              onChange={(e) => setField('annualIncome', e.target.value)}
              placeholder="500"
              suffix="万円/年"
              min="0"
            />
            <NetIncomeHint grossAnnual={data.annualIncome} />
          </Field>

          {/* 配偶者の収入（配偶者ありの場合のみ） */}
          {data.hasSpouse && (
            <Field
              icon={Heart}
              label="配偶者の額面年収（ボーナス込み）"
              hint="配偶者の税引き前の年収合計"
            >
              <Input
                type="number"
                value={data.spouseAnnualIncome}
                onChange={(e) => setField('spouseAnnualIncome', e.target.value)}
                placeholder="400"
                suffix="万円/年"
                min="0"
              />
              <NetIncomeHint grossAnnual={data.spouseAnnualIncome} />
            </Field>
          )}

          {/* ── 将来の収入変化（役職定年・再雇用） ── */}
          <div
            className={[
              'rounded-xl border-2 overflow-hidden transition-colors duration-200',
              data.applyIncomeDecline ? 'border-navy' : 'border-border-base',
            ].join(' ')}
          >
            {/* トグルヘッダー */}
            <div
              className={[
                'flex items-center justify-between px-4 py-3.5',
                data.applyIncomeDecline ? 'bg-blue-light/40' : 'bg-white',
              ].join(' ')}
            >
              <div className="flex items-center gap-2 min-w-0">
                <TrendingDownIcon className={`w-4 h-4 flex-shrink-0 ${data.applyIncomeDecline ? 'text-navy' : 'text-muted'}`} />
                <div>
                  <p className={`text-sm font-medium ${data.applyIncomeDecline ? 'text-navy' : 'text-muted'}`}>
                    将来の収入減少を見込む
                  </p>
                  <p className="text-[11px] text-subtle mt-0.5">役職定年・再雇用による段階的減収</p>
                </div>
              </div>
              <Toggle
                enabled={data.applyIncomeDecline}
                onChange={(v) => setField('applyIncomeDecline', v)}
                label=""
              />
            </div>

            <AnimatePresence initial={false}>
              {data.applyIncomeDecline && (
                <motion.div
                  key="income-decline-detail"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="px-4 pb-4 pt-3 space-y-4 border-t border-border-base bg-white">

                    {/* 第1段階 */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white bg-yellow-500">
                          第1段階
                        </span>
                        <p className="text-xs text-muted">役職定年・管理職降格など</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted mb-1.5">減収開始年齢</p>
                          <Input
                            type="number"
                            value={data.incomeDecreaseAge1}
                            onChange={(e) => setField('incomeDecreaseAge1', e.target.value)}
                            placeholder="55"
                            suffix="歳"
                            min="40"
                            max="70"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-muted mb-1.5">収入維持率</p>
                          <RateSlider
                            label=""
                            value={data.incomeDecreaseRate1}
                            onChange={(v) => setField('incomeDecreaseRate1', v)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border-base" />

                    {/* 第2段階 */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white bg-red-500">
                          第2段階
                        </span>
                        <p className="text-xs text-muted">再雇用・嘱託・パートタイムなど</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted mb-1.5">減収開始年齢</p>
                          <Input
                            type="number"
                            value={data.incomeDecreaseAge2}
                            onChange={(e) => setField('incomeDecreaseAge2', e.target.value)}
                            placeholder="60"
                            suffix="歳"
                            min="40"
                            max="75"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-muted mb-1.5">収入維持率</p>
                          <RateSlider
                            label=""
                            value={data.incomeDecreaseRate2}
                            onChange={(v) => setField('incomeDecreaseRate2', v)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 試算プレビュー */}
                    <IncomeCurvePreview
                      grossAnnual={data.annualIncome}
                      rate1={data.incomeDecreaseRate1}
                      rate2={data.incomeDecreaseRate2}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── リタイア後の働き方 ── */}
          <div
            className={[
              'rounded-xl border-2 overflow-hidden transition-colors duration-200',
              data.postRetirementWork ? 'border-navy' : 'border-border-base',
            ].join(' ')}
          >
            {/* トグルヘッダー */}
            <div
              className={[
                'flex items-center justify-between px-4 py-3.5',
                data.postRetirementWork ? 'bg-blue-light/40' : 'bg-white',
              ].join(' ')}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Briefcase className={`w-4 h-4 flex-shrink-0 ${data.postRetirementWork ? 'text-navy' : 'text-muted'}`} />
                <div>
                  <p className={`text-sm font-medium ${data.postRetirementWork ? 'text-navy' : 'text-muted'}`}>
                    リタイア後も働く（パート・嘱託など）
                  </p>
                  <p className="text-[11px] text-subtle mt-0.5">退職後の労働収入をシミュレーションに反映</p>
                </div>
              </div>
              <Toggle
                enabled={data.postRetirementWork}
                onChange={(v) => setField('postRetirementWork', v)}
                label=""
              />
            </div>

            <AnimatePresence initial={false}>
              {data.postRetirementWork && (
                <motion.div
                  key="post-work-detail"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="px-4 pb-4 pt-3 space-y-3 border-t border-border-base bg-white">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted mb-1.5">働く上限年齢</p>
                        <Input
                          type="number"
                          value={data.postRetirementWorkingAge}
                          onChange={(e) => setField('postRetirementWorkingAge', e.target.value)}
                          placeholder="70"
                          suffix="歳"
                          min="60"
                          max="90"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-1.5">月額労働収入</p>
                        <Input
                          type="number"
                          value={data.postRetirementMonthlyIncome}
                          onChange={(e) => setField('postRetirementMonthlyIncome', e.target.value)}
                          placeholder="10"
                          suffix="万円/月"
                          min="0"
                        />
                      </div>
                    </div>
                    {/* 年間収入プレビュー */}
                    {(() => {
                      const monthly = parseFloat(data.postRetirementMonthlyIncome) || 0
                      const endAge  = data.postRetirementWorkingAge || '70'
                      const retAge  = data.retirementAge || '65'
                      if (monthly <= 0) return null
                      return (
                        <div
                          className="rounded-lg px-3 py-2 flex items-center justify-between text-xs"
                          style={{ backgroundColor: '#f0fdf4', color: '#166534' }}
                        >
                          <span>年間収入</span>
                          <span className="font-semibold">
                            {Math.round(monthly * 12).toLocaleString()}万円/年
                            <span className="font-normal text-subtle ml-1">
                              （{retAge}〜{endAge}歳）
                            </span>
                          </span>
                        </div>
                      )
                    })()}
                    <p className="text-[11px] text-subtle">
                      ※ インフレ調整なしの名目額で計上します
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* ── 支出・積立セクション ── */}
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
          支出・積立
        </p>
        <div className="space-y-4">
          <Field
            icon={TrendingDown}
            label="毎月の基本生活費"
            hint="家賃・食費・光熱費・通信費・娯楽費など、毎月かかる費用の合計"
          >
            <Input
              type="number"
              value={data.monthlyExpenses}
              onChange={(e) => setField('monthlyExpenses', e.target.value)}
              placeholder="18"
              suffix="万円/月"
              min="0"
            />
          </Field>

          <Field
            icon={PiggyBank}
            label="毎月の積立・投資額（総額）"
            hint="手取りから毎月投資・貯金に回す合計金額（iDeCo・NISAを含む）"
          >
            <Input
              type="number"
              value={data.monthlyInvestmentAmount}
              onChange={(e) => setField('monthlyInvestmentAmount', e.target.value)}
              placeholder="3"
              suffix="万円/月"
              min="0"
            />
            {(() => {
              const monthly = parseFloat(data.monthlyInvestmentAmount) || 0
              if (monthly <= 0) return null
              return (
                <div
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                  style={{ backgroundColor: '#f0fdf4', color: '#166534' }}
                >
                  <ArrowRight className="w-3 h-3 flex-shrink-0" />
                  <span>
                    年間積立額：{' '}
                    <span className="font-semibold tabular-nums">
                      {Math.round(monthly * 12).toLocaleString()}万円/年
                    </span>
                    を運用資産に移動して複利で増やします
                  </span>
                </div>
              )
            })()}
          </Field>

          {/* ── 積立停止タイミングの設定 ── */}
          {(() => {
            const isAuto = data.autoStopInvestment ?? true
            return (
              <div
                className={[
                  'rounded-xl border-2 overflow-hidden transition-colors duration-200',
                  isAuto ? 'border-navy' : 'border-border-base',
                ].join(' ')}
              >
                {/* ヘッダー行 */}
                <div
                  className={[
                    'flex items-center justify-between px-4 py-3.5',
                    isAuto ? 'bg-blue-light/40' : 'bg-white',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Timer className={`w-4 h-4 flex-shrink-0 ${isAuto ? 'text-navy' : 'text-muted'}`} />
                    <div>
                      <p className={`text-sm font-medium ${isAuto ? 'text-navy' : 'text-muted'}`}>
                        収入変化・リタイアに合わせて積立を停止
                      </p>
                      <p className="text-[11px] text-subtle mt-0.5">
                        {isAuto
                          ? '収入減少①またはリタイア年齢で自動停止（推奨）'
                          : `手動設定: ${data.customInvestmentEndAge || '未入力'} 歳で終了`}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    enabled={isAuto}
                    onChange={(v) => setField('autoStopInvestment', v)}
                    label=""
                  />
                </div>

                {/* ボディ: 自動モード → ヘルパーテキスト / 手動モード → 年齢入力 */}
                <AnimatePresence mode="wait" initial={false}>
                  {isAuto ? (
                    <motion.div
                      key="auto-body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                      <div className="px-4 py-2.5 border-t border-border-base bg-white">
                        <p className="text-[11px] text-subtle leading-relaxed">
                          ※ 収入減少開始年齢（設定されている場合）、またはリタイア年齢に到達した時点で自動的に積立を停止します
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="manual-body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-4 pb-4 pt-3 space-y-3 border-t border-border-base bg-white">
                        <div>
                          <p className="text-xs text-muted mb-1.5">積立終了年齢</p>
                          <Input
                            type="number"
                            value={data.customInvestmentEndAge}
                            onChange={(e) => setField('customInvestmentEndAge', e.target.value)}
                            placeholder={data.retirementAge || '65'}
                            suffix="歳まで"
                            min="20"
                            max="80"
                          />
                        </div>
                        <p className="text-[11px] text-subtle">
                          ※ iDeCo の掛金拠出は法規上 65 歳が上限のため、65 歳以降はiDeCo部分の節税メリットが自動的に停止します
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })()}

          {/* ── 積立内訳（iDeCo・NISA）アコーディオン ── */}
          <div
            className={[
              'rounded-xl border-2 overflow-hidden transition-colors duration-200',
              (data.idecoEnabled || data.nisaEnabled) ? 'border-navy' : 'border-border-base',
            ].join(' ')}
          >
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className={[
                'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                showBreakdown ? 'bg-blue-light/40' : 'bg-white hover:bg-background',
              ].join(' ')}
            >
              <ChevronDown
                className={[
                  'w-4 h-4 flex-shrink-0 transition-transform duration-200',
                  showBreakdown ? 'rotate-180' : '',
                  (data.idecoEnabled || data.nisaEnabled) ? 'text-navy' : 'text-muted',
                ].join(' ')}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${(data.idecoEnabled || data.nisaEnabled) ? 'text-navy' : 'text-muted'}`}>
                  積立の内訳を入力（iDeCo・NISA）
                </p>
                <p className="text-[11px] text-subtle mt-0.5">
                  {data.idecoEnabled || data.nisaEnabled
                    ? [
                        data.idecoEnabled ? `iDeCo ${data.idecoMonthlyAmount || '0'}万円/月` : '',
                        data.nisaEnabled  ? `NISA ${data.nisaAnnualAmount || '0'}万円/年` : '',
                      ].filter(Boolean).join(' ＋ ')
                    : 'iDeCo・NISAを積立総額の内訳として設定'}
                </p>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {showBreakdown && (
                <motion.div
                  key="investment-breakdown"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="px-4 pb-4 pt-3 space-y-3 border-t border-border-base bg-white">
                    <div
                      className="px-3 py-2 rounded-lg text-[11px] text-muted leading-relaxed"
                      style={{ backgroundColor: '#fef9e7' }}
                    >
                      <span style={{ color: '#d4af37' }}>ℹ</span>{' '}
                      iDeCo・NISAの掛金は「積立総額」の内数として入力してください。二重計上を防ぐため、これらの合計が積立総額を超えないようにしてください。
                    </div>

                    {/* iDeCo */}
                    <div
                      className={[
                        'rounded-xl border-2 overflow-hidden transition-colors duration-200',
                        data.idecoEnabled ? 'border-navy' : 'border-border-base',
                      ].join(' ')}
                    >
                      <button
                        type="button"
                        onClick={() => setField('idecoEnabled', !data.idecoEnabled)}
                        className={[
                          'w-full flex items-center gap-3 px-3 py-3 text-left transition-colors',
                          data.idecoEnabled ? 'bg-blue-light/40' : 'bg-white hover:bg-background',
                        ].join(' ')}
                      >
                        <CheckboxIcon enabled={data.idecoEnabled} />
                        <PiggyBankIcon className={`w-4 h-4 ${data.idecoEnabled ? 'text-navy' : 'text-muted'}`} />
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${data.idecoEnabled ? 'text-navy' : 'text-muted'}`}>
                            iDeCo（個人型確定拠出年金）
                          </span>
                          <p className="text-[11px] text-subtle mt-0.5">掛金が全額所得控除・運用益非課税</p>
                        </div>
                        {data.idecoEnabled && idecoTaxBenefit > 0 && (
                          <span className="ml-auto text-xs font-medium text-gold whitespace-nowrap">
                            年 {Math.round(idecoTaxBenefit * 10) / 10} 万円節税
                          </span>
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {data.idecoEnabled && (
                          <motion.div
                            key="ideco-detail"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                          >
                            <div className="px-3 pb-3 pt-2.5 space-y-2.5 border-t border-border-base bg-white">
                              <div
                                className="px-3 py-2 rounded-lg text-[11px] text-muted leading-relaxed"
                                style={{ backgroundColor: '#fef9e7' }}
                              >
                                <span style={{ color: '#d4af37' }}>ℹ</span>{' '}
                                拠出上限の目安：会社員（企業年金なし）月 2.3 万円、自営業 月 6.8 万円
                              </div>
                              <div>
                                <p className="text-xs text-muted mb-1.5">月額拠出額</p>
                                <Input
                                  type="number"
                                  value={data.idecoMonthlyAmount}
                                  onChange={(e) => setField('idecoMonthlyAmount', e.target.value)}
                                  placeholder="2.3"
                                  suffix="万円/月"
                                  min="0"
                                  max="6.8"
                                  step="0.1"
                                />
                              </div>
                              {idecoTaxBenefit > 0 && (
                                <div
                                  className="rounded-lg px-3 py-2 space-y-1"
                                  style={{ backgroundColor: '#e6f0ff' }}
                                >
                                  <div className="flex items-center justify-between text-xs" style={{ color: '#003366' }}>
                                    <span>年間拠出額</span>
                                    <span className="font-semibold">
                                      {Math.round(idecoAnnual * 10) / 10} 万円/年
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs border-t pt-1" style={{ borderColor: '#b3c9e8', color: '#003366' }}>
                                    <span className="font-medium">年間節税額（概算）</span>
                                    <span className="font-bold text-gold">約 {Math.round(idecoTaxBenefit * 10) / 10} 万円/年</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* NISA */}
                    <div
                      className={[
                        'rounded-xl border-2 overflow-hidden transition-colors duration-200',
                        data.nisaEnabled ? 'border-navy' : 'border-border-base',
                      ].join(' ')}
                    >
                      <button
                        type="button"
                        onClick={() => setField('nisaEnabled', !data.nisaEnabled)}
                        className={[
                          'w-full flex items-center gap-3 px-3 py-3 text-left transition-colors',
                          data.nisaEnabled ? 'bg-blue-light/40' : 'bg-white hover:bg-background',
                        ].join(' ')}
                      >
                        <CheckboxIcon enabled={data.nisaEnabled} />
                        <Coins className={`w-4 h-4 ${data.nisaEnabled ? 'text-navy' : 'text-muted'}`} />
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${data.nisaEnabled ? 'text-navy' : 'text-muted'}`}>
                            NISA（少額投資非課税制度）
                          </span>
                          <p className="text-[11px] text-subtle mt-0.5">運用益・配当が非課税（新NISA 年最大360万まで）</p>
                        </div>
                        {data.nisaEnabled && data.nisaAnnualAmount && (
                          <span className="ml-auto text-xs font-medium text-gold whitespace-nowrap">
                            年 {Number(data.nisaAnnualAmount).toLocaleString()} 万円
                          </span>
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {data.nisaEnabled && (
                          <motion.div
                            key="nisa-detail"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                          >
                            <div className="px-3 pb-3 pt-2.5 space-y-2.5 border-t border-border-base bg-white">
                              <div
                                className="px-3 py-2 rounded-lg text-[11px] text-muted leading-relaxed"
                                style={{ backgroundColor: '#fef9e7' }}
                              >
                                <span style={{ color: '#d4af37' }}>ℹ</span>{' '}
                                新NISA：つみたて投資枠 120万円＋成長投資枠 240万円 = 合計 360万円/年
                              </div>
                              <div>
                                <p className="text-xs text-muted mb-1.5">年間積立額</p>
                                <Input
                                  type="number"
                                  value={data.nisaAnnualAmount}
                                  onChange={(e) => setField('nisaAnnualAmount', e.target.value)}
                                  placeholder="20"
                                  suffix="万円/年"
                                  min="0"
                                  max="360"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </div>
  )
}
