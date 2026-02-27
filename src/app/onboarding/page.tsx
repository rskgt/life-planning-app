'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Sparkles, Shield, Zap, ChevronDown } from 'lucide-react'

import { useOnboardingStore } from '@/store/useOnboardingStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Step1BasicInfo } from './_components/Step1BasicInfo'
import { deriveDefaultsFromBasicInfo, buildDeriveSummary } from '@/lib/deriveDefaults'

// ─── 自動設定プレビュー ───────────────────────────────────────────────

function AutoSettingsPreview({ age, hasSpouse, spouseAge, numChildren }: {
  age: number
  hasSpouse: boolean
  spouseAge: number
  numChildren: number
}) {
  const [open, setOpen] = useState(false)

  if (age < 18) return null

  const children = Array.from({ length: numChildren }, (_, i) => ({
    id: `prev-${i}`,
    currentAge: '',
    educationCourse: 'all-public' as const,
    customAnnualAmount: '',
  }))

  const derived  = deriveDefaultsFromBasicInfo(age, hasSpouse, spouseAge, children)
  const items    = buildDeriveSummary(derived, hasSpouse)

  return (
    <div
      className="rounded-xl border border-border-base overflow-hidden"
      style={{ backgroundColor: '#fafbfc' }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-background transition-colors"
      >
        <ChevronDown
          className={[
            'w-3.5 h-3.5 text-muted flex-shrink-0 transition-transform duration-200',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
        <span className="text-xs text-muted font-medium flex-1">
          自動設定される値を確認する
        </span>
        <span className="text-[10px] text-subtle">後で変更可能</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="preview"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-3 pt-1 border-t border-border-base space-y-1.5">
              {items.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-muted">{label}</span>
                  <span className="font-medium text-navy tabular-nums">{value}</span>
                </div>
              ))}
              <p className="text-[10px] text-subtle pt-1">
                ※ 結果画面の「編集」から個別に調整できます
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── ページ ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const { data, setMultipleFields } = useOnboardingStore()

  const age        = parseInt(data.age) || 0
  const spouseAge  = parseInt(data.spouseAge) || 30
  const canSubmit  = age >= 18

  const handleSubmit = () => {
    if (!canSubmit) return
    const derived = deriveDefaultsFromBasicInfo(
      age,
      data.hasSpouse,
      spouseAge,
      data.children,
    )
    setMultipleFields(derived)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-md flex flex-col gap-5">

        {/* ── ブランドヘッダー ── */}
        <Link
          href="/"
          className="flex items-center gap-2 text-navy/60 hover:text-navy transition-colors w-fit"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-navy">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-medium">ライフプランニング</span>
        </Link>

        {/* ── 自動設定バナー ── */}
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ backgroundColor: '#fef9e7' }}
        >
          <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#d4af37' }} />
          <div className="text-xs leading-relaxed" style={{ color: '#5a4a00' }}>
            <p className="font-semibold mb-0.5">入力はこれだけ！</p>
            <p>
              年齢・家族構成を入力するだけで、収入・資産・生活費・年金などを
              統計データをもとに自動設定します。結果画面でいつでも調整できます。
            </p>
          </div>
        </div>

        {/* ── フォームカード ── */}
        <Card className="overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-border-base">
            <h2 className="text-lg font-medium text-navy">基本情報を教えてください</h2>
            <p className="text-xs text-muted mt-0.5">
              この5項目だけでシミュレーションを開始できます
            </p>
          </div>
          <div className="px-6 py-6">
            <Step1BasicInfo />
          </div>
        </Card>

        {/* ── 自動設定プレビュー ── */}
        {canSubmit && (
          <AutoSettingsPreview
            age={age}
            hasSpouse={data.hasSpouse}
            spouseAge={spouseAge}
            numChildren={data.children.length}
          />
        )}

        {/* ── ナビゲーションボタン ── */}
        <div className="flex gap-3">
          <Link href="/" className="flex-1">
            <Button variant="outline" size="lg" className="w-full">
              <ChevronLeft className="w-4 h-4" />
              最初に戻る
            </Button>
          </Link>

          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-medium text-base text-white shadow-md transition-opacity',
              canSubmit ? '' : 'opacity-40 cursor-not-allowed',
            ].join(' ')}
            style={{ backgroundColor: '#d4af37' }}
            whileHover={canSubmit ? {
              scale: 1.02,
              boxShadow: '0 12px 28px rgba(212,175,55,0.38)',
            } : undefined}
            whileTap={canSubmit ? { scale: 0.97 } : undefined}
          >
            <Sparkles className="w-4 h-4" />
            シミュレーションを開始
          </motion.button>
        </div>

        {/* ── 注記 ── */}
        {!canSubmit && (
          <p className="text-center text-xs text-muted">
            年齢を入力するとシミュレーションを開始できます
          </p>
        )}

      </div>
    </div>
  )
}
