'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: number   // 0-indexed
  steps: string[]       // ラベル配列
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <nav
      aria-label="オンボーディング進捗"
      className="flex items-start w-full"
    >
      {steps.map((label, i) => {
        const isCompleted = i < currentStep
        const isCurrent   = i === currentStep

        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            {/* ── サークル + ラベル ── */}
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <motion.div
                className={[
                  'w-9 h-9 rounded-full flex items-center justify-center',
                  'text-sm font-semibold border-2 transition-colors duration-300',
                  isCompleted
                    ? 'bg-navy border-navy text-white'
                    : isCurrent
                      ? 'bg-white border-navy text-navy'
                      : 'bg-white border-border-base text-subtle',
                ].join(' ')}
                animate={isCurrent ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 0.35 }}
              >
                {isCompleted
                  ? <Check className="w-4 h-4 stroke-[2.5]" />
                  : <span>{i + 1}</span>
                }
              </motion.div>

              <span
                className={[
                  'text-[11px] font-medium whitespace-nowrap',
                  isCurrent   ? 'text-navy'
                  : isCompleted ? 'text-muted'
                  :               'text-subtle',
                ].join(' ')}
              >
                {label}
              </span>
            </div>

            {/* ── 接続ライン ── */}
            {i < steps.length - 1 && (
              <div className="flex-1 mx-2 mb-5 h-0.5 bg-border-base overflow-hidden rounded-full">
                <motion.div
                  className="h-full bg-navy rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isCompleted ? 1 : 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  style={{ originX: 0 }}
                />
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
