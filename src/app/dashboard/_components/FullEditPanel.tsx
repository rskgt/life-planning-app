'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Users, Wallet, Target } from 'lucide-react'
import { Step1BasicInfo } from '@/app/onboarding/_components/Step1BasicInfo'
import { Step2Financial } from '@/app/onboarding/_components/Step2Financial'
import { Step3Goals } from '@/app/onboarding/_components/Step3Goals'

// ─── セクション定義 ──────────────────────────────────────────────────

interface Section {
  id:        string
  icon:      React.ElementType
  title:     string
  sub:       string
  Component: React.ComponentType
}

const SECTIONS: Section[] = [
  {
    id:        'basic',
    icon:      Users,
    title:     '基本情報',
    sub:       '年齢・配偶者・子供',
    Component: Step1BasicInfo,
  },
  {
    id:        'financial',
    icon:      Wallet,
    title:     '財務状況',
    sub:       '資産・収入・積立・iDeCo・NISA',
    Component: Step2Financial,
  },
  {
    id:        'goals',
    icon:      Target,
    title:     '将来の目標・イベント',
    sub:       'リタイア・住宅・年金・介護・教育費',
    Component: Step3Goals,
  },
]

// ─── コンポーネント ──────────────────────────────────────────────────

/**
 * ダッシュボードで全項目を編集できるアコーディオン形式のパネル。
 * 各セクションはオンボーディングの Step コンポーネントをそのまま利用する。
 */
export function FullEditPanel() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="mt-4 pt-4 border-t border-border-base space-y-2">
      <p className="text-xs text-subtle pb-1">
        セクションを開いて各項目を編集できます。変更はリアルタイムでグラフに反映されます。
      </p>

      {SECTIONS.map(({ id, icon: Icon, title, sub, Component }) => {
        const isOpen = openSections.has(id)
        return (
          <div
            key={id}
            className={[
              'rounded-xl border-2 overflow-hidden transition-colors duration-200',
              isOpen ? 'border-navy' : 'border-border-base',
            ].join(' ')}
          >
            {/* ヘッダー */}
            <button
              type="button"
              onClick={() => toggle(id)}
              className={[
                'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                isOpen ? 'bg-blue-light/40' : 'bg-white hover:bg-background',
              ].join(' ')}
            >
              <ChevronDown
                className={[
                  'w-4 h-4 flex-shrink-0 transition-transform duration-200',
                  isOpen ? 'rotate-180 text-navy' : 'text-muted',
                ].join(' ')}
              />
              <Icon className={`w-4 h-4 flex-shrink-0 ${isOpen ? 'text-navy' : 'text-muted'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isOpen ? 'text-navy' : 'text-muted'}`}>
                  {title}
                </p>
                <p className="text-[11px] text-subtle mt-0.5">{sub}</p>
              </div>
            </button>

            {/* ボディ */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key={id}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="px-4 py-5 border-t border-border-base bg-white">
                    <Component />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
