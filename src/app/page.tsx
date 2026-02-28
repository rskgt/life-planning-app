'use client'

import { motion } from 'framer-motion'
import { Shield, TrendingUp, Users, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'

// ─── アニメーション定義 ──────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: 'easeOut' as const },
})

// ─── 機能ハイライト ──────────────────────────────────────

const features = [
  {
    icon: TrendingUp,
    label: '生涯資産シミュレーション',
    desc: '20歳〜100歳の資産推移を自動で試算します',
  },
  {
    icon: Users,
    label: '家族計画に対応',
    desc: '家族構成・ライフイベントを考慮した最適プラン',
  },
  {
    icon: Wallet,
    label: '収支の見える化',
    desc: '年収・貯蓄から生涯必要資金を算出します',
  },
]

// ─── コンポーネント ──────────────────────────────────────

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">

        {/* ── ブランドロゴ & タイトル ── */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-5"
            style={{ backgroundColor: '#003366' }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            className="text-3xl font-medium text-navy mb-2"
            {...fadeUp(0.25)}
          >
            ライフプランニング
          </motion.h1>

          <motion.p
            className="text-sm text-muted"
            {...fadeUp(0.4)}
          >
            あなたの未来を一緒に考えましょう
          </motion.p>
        </div>

        {/* ── 機能ハイライトカード ── */}
        <motion.div {...fadeUp(0.5)}>
          <Card className="p-6 mb-5">
            <ul className="space-y-5">
              {features.map(({ icon: Icon, label, desc }, i) => (
                <motion.li
                  key={label}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.4, ease: 'easeOut' }}
                >
                  <div
                    className="flex-shrink-0 p-2 rounded-lg"
                    style={{ backgroundColor: '#e6f0ff' }}
                  >
                    <Icon className="w-5 h-5 text-navy" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy">{label}</p>
                    <p className="text-xs text-muted mt-0.5">{desc}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* ── はじめる ボタン ── */}
        <motion.button
          className="w-full py-4 rounded-xl text-white font-medium text-base bg-navy shadow-md"
          onClick={() => router.push('/onboarding')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4, ease: 'easeOut' }}
          whileHover={{
            scale: 1.02,
            boxShadow: '0 16px 32px rgba(0, 51, 102, 0.28)',
          }}
          whileTap={{ scale: 0.97 }}
        >
          はじめる
        </motion.button>

        {/* ── フッター ── */}
        <motion.p
          className="text-xs text-center text-subtle mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          ライフプランニングツール v1.0
        </motion.p>
      </div>
    </div>
  )
}
