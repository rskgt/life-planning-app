'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles, Shield } from 'lucide-react'

import { useOnboardingStore } from '@/store/useOnboardingStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StepIndicator } from '../_components/StepIndicator'
import { Step1BasicInfo } from '../_components/Step1BasicInfo'
import { Step2Financial } from '../_components/Step2Financial'
import { Step3Goals } from '../_components/Step3Goals'

// ─── 定数 ─────────────────────────────────────────────

const STEP_LABELS = ['基本情報', '財務状況', '将来の目標'] as const

const STEP_META = [
  {
    title: '基本情報を確認・編集',
    sub:   '年齢・配偶者・子供の情報',
  },
  {
    title: '財務状況を編集',
    sub:   '資産・収入・積立・iDeCo・NISA',
  },
  {
    title: '将来の目標・イベントを編集',
    sub:   'リタイア・住宅・年金・介護・教育費',
  },
]

const STEP_COMPONENTS = [Step1BasicInfo, Step2Financial, Step3Goals]

// ─── スライドアニメーション定義 ───────────────────────

const slideVariants = {
  enter: (dir: number) => ({
    x:       dir > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x:       0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x:       dir > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
}

const slideTrans = {
  duration: 0.32,
  ease: [0.32, 0.72, 0, 1] as const,
}

// ─── ページ ───────────────────────────────────────────

export default function OnboardingEditPage() {
  const router = useRouter()
  const { totalSteps } = useOnboardingStore()
  const [step, setStep]         = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)

  const StepContent = STEP_COMPONENTS[step]
  const meta        = STEP_META[step]
  const isLastStep  = step === totalSteps - 1

  const handleNext = () => {
    setDirection(1)
    setStep((s) => Math.min(s + 1, totalSteps - 1))
  }

  const handlePrev = () => {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleDone = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-md flex flex-col gap-5">

        {/* ── ブランドヘッダー ── */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-navy/60 hover:text-navy transition-colors w-fit"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-navy">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-medium">ライフプランニング</span>
        </Link>

        {/* ── ステップインジケーター ── */}
        <StepIndicator currentStep={step} steps={[...STEP_LABELS]} />

        {/* ── フォームカード ── */}
        <Card className="overflow-hidden">
          {/* カードヘッダー */}
          <div className="px-6 pt-6 pb-4 border-b border-border-base">
            <AnimatePresence mode="wait">
              <motion.div
                key={`meta-${step}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
              >
                <h2 className="text-lg font-medium text-navy">{meta.title}</h2>
                <p className="text-xs text-muted mt-0.5">{meta.sub}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* カードボディ（スライドアニメーション） */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTrans}
                className="px-6 py-6"
              >
                <StepContent />
              </motion.div>
            </AnimatePresence>
          </div>
        </Card>

        {/* ── ナビゲーションボタン ── */}
        <div className="flex flex-col gap-3">
          {/* 次へ / 保存して結果を見る（主要アクション・上段） */}
          {isLastStep ? (
            <motion.button
              type="button"
              onClick={handleDone}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-medium text-sm text-white shadow-md"
              style={{ backgroundColor: '#d4af37' }}
              whileHover={{
                scale: 1.02,
                boxShadow: '0 12px 28px rgba(212,175,55,0.38)',
              }}
              whileTap={{ scale: 0.97 }}
            >
              <Sparkles className="w-4 h-4" />
              保存して結果を見る
            </motion.button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={handleNext}
              className="w-full"
            >
              次へ
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          {/* 戻るボタン（下段） */}
          {step > 0 ? (
            <Button
              variant="outline"
              size="md"
              onClick={handlePrev}
              className="w-full"
            >
              <ChevronLeft className="w-4 h-4" />
              戻る
            </Button>
          ) : (
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" size="md" className="w-full">
                <ChevronLeft className="w-4 h-4" />
                結果に戻る
              </Button>
            </Link>
          )}
        </div>

        {/* ── 進捗テキスト ── */}
        <p className="text-center text-xs text-subtle">
          ステップ {step + 1} / {totalSteps}
        </p>

      </div>
    </div>
  )
}
