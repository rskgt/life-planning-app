'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  PiggyBank,
  Calendar,
  Users,
  Baby,
  Briefcase,
  Settings,
  Home,
  GraduationCap,
  Car,
  Plus,
  SlidersHorizontal,
  User,
  Heart,
  Landmark,
  ArrowRight,
  Edit2,
  X,
  Coins,
  Lock,
} from 'lucide-react'

import {
  useOnboardingStore,
  type OnboardingData,
  type MajorExpense,
  type Child,
} from '@/store/useOnboardingStore'
import { calculateSimulation, formatMoney, calculateNetAnnualIncome } from '@/lib/calculateSimulation'
import { Card } from '@/components/ui/Card'
import { AssetChart, ChartLegend } from './_components/AssetChart'
import { RateAdjuster } from './_components/RateAdjuster'
import { FullEditPanel } from './_components/FullEditPanel'

// ─── フェードアップアニメーション ────────────────────────

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: 'easeOut' as const },
})

// ─── 診断バナー ──────────────────────────────────────────

function DiagnosisBanner({
  depletionAge,
  assetsAt80,
}: {
  depletionAge: number | null
  assetsAt80:   number
}) {
  const isHealthy = depletionAge === null
  const isWarn    = depletionAge !== null && depletionAge >= 75

  const color   = isHealthy ? '#16a34a' : isWarn ? '#d97706' : '#dc2626'
  const bgColor = isHealthy ? '#f0fdf4' : isWarn ? '#fffbeb' : '#fef2f2'
  const Icon    = isHealthy ? CheckCircle2 : AlertTriangle

  const title = isHealthy
    ? '100 歳まで資産は維持できる見込みです'
    : `${depletionAge} 歳頃に資産が枯渇する見込みです`

  const sub = isHealthy
    ? `80 歳時点の予想資産: ${formatMoney(assetsAt80)}`
    : '利回りを上げるか、積立額を見直してプランを改善しましょう'

  return (
    <div
      className="flex items-center gap-4 rounded-xl p-4 border-2 shadow-sm"
      style={{ borderColor: color, backgroundColor: bgColor }}
    >
      <div
        className="flex-shrink-0 p-2.5 rounded-full"
        style={{ backgroundColor: `${color}22` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy">{title}</p>
        <p className="text-xs text-muted mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

// ─── サマリーカード ──────────────────────────────────────

type AccentColor = 'navy' | 'gold' | 'red' | 'green'

const ACCENT_COLORS: Record<AccentColor, { bg: string; icon: string; value: string }> = {
  navy:  { bg: '#e6f0ff', icon: '#003366', value: '#003366' },
  gold:  { bg: '#fef9e7', icon: '#d4af37', value: '#d4af37' },
  red:   { bg: '#fef2f2', icon: '#dc2626', value: '#dc2626' },
  green: { bg: '#f0fdf4', icon: '#16a34a', value: '#16a34a' },
}

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  delay = 0,
}: {
  label:   string
  value:   string
  sub?:    string
  icon:    React.ElementType
  accent:  AccentColor
  delay?:  number
}) {
  const c = ACCENT_COLORS[accent]

  return (
    <motion.div
      className="bg-surface rounded-2xl p-4 shadow-md flex flex-col gap-3"
      {...fadeUp(delay)}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: c.bg }}
      >
        <Icon className="w-4 h-4" style={{ color: c.icon }} />
      </div>
      <div>
        <p className="text-xs text-muted leading-tight">{label}</p>
        <p className="text-base sm:text-xl font-semibold mt-0.5 tabular-nums leading-tight break-all" style={{ color: c.value }}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-subtle mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  )
}


// ─── 前提条件セクション ──────────────────────────────────

const EXPENSE_ICONS: Record<string, React.ElementType> = {
  car: Car, other: Plus,
}

const EDUCATION_COURSE_LABELS: Record<string, string> = {
  'all-public':     '全公立',
  'high-private':   '高校から私立',
  'middle-private': '中学から私立',
  'custom':         'カスタム',
}

const HOUSING_STATUS_LABELS: Record<string, string> = {
  'none':     'なし',
  'planning': 'これから購入予定',
  'existing': '購入済み（返済中）',
}

function ConditionsSection({
  data,
  editMode,
}: {
  data:      OnboardingData
  editMode:  boolean
}) {
  const enabledExpenses = data.majorExpenses.filter((e: MajorExpense) => e.enabled)
  const grossAnnual      = parseFloat(data.annualIncome) || 0
  const netAnnual        = calculateNetAnnualIncome(grossAnnual)
  const grossSpouseAnnual = data.hasSpouse ? (parseFloat(data.spouseAnnualIncome) || 0) : 0
  const netSpouseAnnual  = calculateNetAnnualIncome(grossSpouseAnnual)

  const totalCash        = parseFloat(data.currentCash) || 0
  const totalInvestments = parseFloat(data.currentInvestments) || 0
  const totalDC          = parseFloat(data.currentDC ?? '0') || 0
  const totalNISABalance = parseFloat(data.currentNISABalance ?? '0') || 0

  const rows = [
    { icon: Calendar,     label: '現在の年齢',            value: data.age              ? `${data.age}歳`                           : '未入力' },
    { icon: Users,        label: '配偶者',                 value: data.hasSpouse        ? 'あり'                                     : 'なし'   },
    ...(data.hasSpouse ? [
      { icon: Heart,        label: '配偶者の年齢',           value: data.spouseAge          ? `${data.spouseAge}歳`                     : '未入力' },
      { icon: Wallet,       label: '配偶者の額面年収',       value: data.spouseAnnualIncome ? `${data.spouseAnnualIncome}万円/年`         : '未入力' },
      { icon: ArrowRight,   label: '配偶者の手取り年収（概算）', value: grossSpouseAnnual > 0 ? `約${Math.round(netSpouseAnnual)}万円/年` : '未入力' },
      { icon: Briefcase,    label: '配偶者のリタイア年齢',   value: data.spouseRetirementAge ? `${data.spouseRetirementAge}歳`            : '未入力' },
    ] : []),
    { icon: Baby,         label: '子供の人数',             value: `${data.children.length}人`                                              },
    { icon: PiggyBank,    label: '現金預金',               value: totalCash > 0         ? `${totalCash.toLocaleString()}万円`            : '未入力' },
    { icon: TrendingUp,   label: '運用資産（総額）',         value: totalInvestments > 0  ? `${totalInvestments.toLocaleString()}万円`      : '未入力' },
    ...(totalDC > 0 ? [
      { icon: Lock, label: '  DC残高（ロック中）', value: `${totalDC.toLocaleString()}万円` },
    ] : []),
    ...(totalNISABalance > 0 ? [
      { icon: Coins, label: '  NISA残高', value: `${totalNISABalance.toLocaleString()}万円` },
    ] : []),
    { icon: Wallet,       label: '額面年収（本人）',        value: data.annualIncome     ? `${data.annualIncome}万円/年`                  : '未入力' },
    { icon: ArrowRight,   label: '手取り年収（概算）',      value: grossAnnual > 0       ? `約${Math.round(netAnnual)}万円/年`            : '未入力' },
    ...(data.applyIncomeDecline ? [
      { icon: TrendingDown, label: '収入減少①',
        value: `${data.incomeDecreaseAge1}歳〜 ${data.incomeDecreaseRate1}%` },
      { icon: TrendingDown, label: '収入減少②',
        value: `${data.incomeDecreaseAge2}歳〜 ${data.incomeDecreaseRate2}%` },
    ] : []),
    ...(data.postRetirementWork ? [
      { icon: Briefcase, label: 'リタイア後の労働',
        value: `〜${data.postRetirementWorkingAge}歳 / ${data.postRetirementMonthlyIncome}万円/月` },
    ] : []),
    { icon: TrendingDown, label: '毎月の生活費',           value: data.monthlyExpenses  ? `${data.monthlyExpenses}万円/月`               : '未入力' },
    { icon: PiggyBank,    label: '毎月の積立額',           value: data.monthlyInvestmentAmount ? `${data.monthlyInvestmentAmount}万円/月` : '未設定' },
    { icon: Briefcase,    label: 'リタイア希望年齢',       value: data.retirementAge    ? `${data.retirementAge}歳`                     : '未入力' },
    { icon: Landmark,     label: '公的年金（世帯月額）',   value: data.monthlyPension   ? `${data.monthlyPension}万円/月`               : '未設定' },
    ...(data.severancePay ? [
      { icon: Briefcase, label: '退職金', value: `${Number(data.severancePay).toLocaleString()}万円` },
    ] : []),
    ...(data.idecoEnabled ? [
      { icon: PiggyBank, label: 'iDeCo 月額拠出', value: `${data.idecoMonthlyAmount}万円/月` },
    ] : []),
    ...(data.nisaEnabled ? [
      { icon: Coins, label: 'NISA 年間積立', value: `${data.nisaAnnualAmount}万円/年` },
    ] : []),
    { icon: Home,         label: '住宅ローン',
      value: (() => {
        if (data.housingStatus === 'planning') {
          return `購入予定 ${data.housingPurchaseAge}歳 / ${Number(data.housingCost).toLocaleString()}万円`
        }
        if (data.housingStatus === 'existing') {
          return `返済中 残${data.existingLoanRemainingYears}年 / 残高${Number(data.existingLoanBalance).toLocaleString()}万円`
        }
        return 'なし'
      })(),
    },
    ...(data.willSellHouse && data.housingStatus !== 'none' ? [
      { icon: TrendingUp, label: '住宅売却予定',
        value: `${data.sellHouseAge}歳 / 売却${Number(data.sellHousePrice).toLocaleString()}万円` },
      { icon: ArrowRight, label: '売却後の家賃',
        value: `${data.postSellMonthlyRent}万円/月` },
    ] : []),
    ...(data.expectParentCare ? [
      { icon: Settings, label: '親の介護費用',
        value: `${data.parentCareAge}歳頃 / 総額${Number(data.parentCareCost).toLocaleString()}万円` },
    ] : []),
    ...(data.expectSelfCare ? [
      { icon: Heart, label: '自身の介護費用',
        value: `${data.selfCareAge}歳頃 / 総額${Number(data.selfCareCost).toLocaleString()}万円` },
    ] : []),
  ]

  return (
    <div className="space-y-2.5">
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-muted min-w-0 flex-1">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="leading-snug">{label}</span>
          </span>
          <span className="font-medium text-navy text-right shrink-0">{value}</span>
        </div>
      ))}

      {/* 子どもの教育コース */}
      {data.children.length > 0 && (
        <>
          <div className="pt-1 border-t border-border-base" />
          <p className="text-xs font-medium text-muted">子どもの教育費</p>
          {data.children.map((c: Child, i: number) => (
            <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-1.5 text-muted min-w-0 flex-1">
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{i + 1}人目{c.currentAge ? `（${c.currentAge}歳）` : ''}</span>
              </span>
              <span className="font-medium text-navy text-right shrink-0">
                {EDUCATION_COURSE_LABELS[c.educationCourse] ?? c.educationCourse}
                {c.educationCourse === 'custom' && c.customAnnualAmount
                  ? ` ${c.customAnnualAmount}万/年`
                  : ''}
              </span>
            </div>
          ))}
        </>
      )}

      {/* その他の支出 */}
      {enabledExpenses.length > 0 && (
        <>
          <div className="pt-1 border-t border-border-base" />
          <p className="text-xs font-medium text-muted">その他の支出</p>
          {enabledExpenses.map((e: MajorExpense) => {
            const Icon = EXPENSE_ICONS[e.id] ?? Plus
            return (
              <div key={e.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-1.5 text-muted min-w-0 flex-1">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{e.label}</span>
                </span>
                <span className="font-medium text-navy text-right shrink-0">
                  {e.amount}万円
                  {e.targetAge && (
                    <span className="text-muted font-normal ml-1">({e.targetAge}歳)</span>
                  )}
                </span>
              </div>
            )
          })}
        </>
      )}

      {/* 全項目編集パネル */}
      <AnimatePresence initial={false}>
        {editMode && (
          <motion.div
            key="full-edit"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <FullEditPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── ページ ───────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const {
    data,
    investmentRate,
    inflationRate,
    setInvestmentRate,
    setInflationRate,
  } = useOnboardingStore()

  // スライダーが変わるたびにリアルタイムで再計算
  const result = useMemo(
    () => calculateSimulation(data, { investmentRate, inflationRate }),
    [data, investmentRate, inflationRate],
  )

  const {
    yearlyData,
    retirementAge,
    assetsAtRetirement,
    assetsAt80,
    monthlyBalance,
    depletionAge,
  } = result

  const balanceAccent: AccentColor = monthlyBalance > 0 ? 'green' : monthlyBalance < 0 ? 'red' : 'navy'
  const at80Accent:    AccentColor = assetsAt80 >= 0 ? 'navy' : 'red'

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* ── ブランドヘッダー ── */}
        <motion.div className="flex items-center justify-between" {...fadeUp(0)}>
          <Link
            href="/"
            className="flex items-center gap-2 text-navy/60 hover:text-navy transition-colors"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-navy">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium">ライフプランニング</span>
          </Link>
          <span className="text-xs text-subtle">シミュレーション結果</span>
        </motion.div>

        {/* ── 診断バナー ── */}
        <motion.div {...fadeUp(0.05)}>
          <DiagnosisBanner depletionAge={depletionAge} assetsAt80={assetsAt80} />
        </motion.div>

        {/* ── サマリーカード（3枚） ── */}
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard
            icon={Briefcase}
            label={`${retirementAge}歳時点の資産`}
            value={formatMoney(assetsAtRetirement)}
            sub="退職時"
            accent="gold"
            delay={0.10}
          />
          <SummaryCard
            icon={monthlyBalance >= 0 ? TrendingUp : TrendingDown}
            label="月間収支（現在）"
            value={`${monthlyBalance >= 0 ? '+' : ''}${monthlyBalance}万円`}
            sub="手取り月収 − 生活費"
            accent={balanceAccent}
            delay={0.17}
          />
          <SummaryCard
            icon={PiggyBank}
            label="80歳時点の資産"
            value={formatMoney(assetsAt80)}
            sub={assetsAt80 >= 0 ? '黒字' : '赤字'}
            accent={at80Accent}
            delay={0.24}
          />
        </div>

        {/* ── 資産推移グラフカード ── */}
        <motion.div {...fadeUp(0.32)}>
          <Card className="p-5">
            {/* カードヘッダー */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-navy flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  資産推移グラフ
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {data.age || '30'}歳 〜 100歳までのシミュレーション
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium shrink-0"
                style={{ backgroundColor: '#e6f0ff', color: '#003366' }}>
                <span>利回り {investmentRate}%</span>
                <span className="text-navy/40">|</span>
                <span>インフレ {inflationRate}%</span>
              </div>
            </div>

            {/* グラフ */}
            <div className="h-64 sm:h-80">
              <AssetChart
                data={yearlyData}
                retirementAge={retirementAge}
                depletionAge={depletionAge}
              />
            </div>

            {/* 凡例 */}
            <ChartLegend depletionAge={depletionAge} />
          </Card>
        </motion.div>

        {/* ── レートアジャスターカード ── */}
        <motion.div {...fadeUp(0.40)}>
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              シミュレーション条件を調整
              <span className="ml-auto text-[11px] font-normal text-muted">
                リアルタイムでグラフが更新されます
              </span>
            </h3>

            <RateAdjuster
              investmentRate={investmentRate}
              inflationRate={inflationRate}
              onInvestmentChange={setInvestmentRate}
              onInflationChange={setInflationRate}
            />
          </Card>
        </motion.div>

        {/* ── 前提条件カード ── */}
        <motion.div {...fadeUp(0.48)}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-navy flex items-center gap-2">
                <Settings className="w-4 h-4" />
                入力した前提条件
              </h3>
              <button
                onClick={() => setEditMode((v) => !v)}
                className={[
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  editMode
                    ? 'bg-navy text-white'
                    : 'border border-border-base text-muted hover:border-navy hover:text-navy',
                ].join(' ')}
              >
                {editMode ? (
                  <><X className="w-3 h-3" />閉じる</>
                ) : (
                  <><Edit2 className="w-3 h-3" />編集</>
                )}
              </button>
            </div>

            <ConditionsSection data={data} editMode={editMode} />

            <div className="mt-5 pt-4 border-t border-border-base flex flex-col gap-2.5">
              <motion.button
                onClick={() => router.push('/onboarding/edit')}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-medium border-2 border-navy text-navy hover:bg-blue-light transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <Settings className="w-4 h-4" />
                条件を変更する
              </motion.button>

              <motion.button
                onClick={() => router.push('/')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-sm font-medium text-subtle hover:text-muted transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                最初からやり直す
              </motion.button>
            </div>
          </Card>
        </motion.div>

        {/* ── フッター注記 ── */}
        <motion.p className="text-center text-xs text-subtle pb-4" {...fadeUp(0.55)}>
          ※ このシミュレーションは参考値です。税制・年金・医療費等は考慮されていません。
        </motion.p>

      </div>
    </div>
  )
}
