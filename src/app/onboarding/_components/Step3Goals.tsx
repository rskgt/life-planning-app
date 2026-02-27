'use client'

import {
  Briefcase, Home, Car, Plus, GraduationCap, Heart, Landmark,
  UserRound, Building2, TrendingUp,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Input } from '@/components/ui/Input'
import {
  type Child,
  type EducationCourse,
  type HousingStatus,
  type MajorExpense,
  useOnboardingStore,
} from '@/store/useOnboardingStore'
import { calculateMortgageAnnualPayment } from '@/lib/calculateSimulation'

// ─── アイコンマップ（その他の支出用） ─────────────────────

const ICONS: Record<string, React.ElementType> = {
  car:   Car,
  other: Plus,
}

// ─── カスタムチェックボックス ────────────────────────────

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

// ─── CareItem ────────────────────────────────────────────

interface CareItemProps {
  icon:      React.ElementType
  label:     string
  helpText:  string
  badge?:    string
  enabled:   boolean
  ageValue:  string
  costValue: string
  onToggle:  () => void
  onAgeChange:  (v: string) => void
  onCostChange: (v: string) => void
  agePlaceholder:  string
  costPlaceholder: string
}

function CareItem({
  icon: Icon,
  label,
  helpText,
  badge,
  enabled,
  ageValue,
  costValue,
  onToggle,
  onAgeChange,
  onCostChange,
  agePlaceholder,
  costPlaceholder,
}: CareItemProps) {
  return (
    <div
      className={[
        'rounded-xl border-2 overflow-hidden transition-colors duration-200',
        enabled ? 'border-navy' : 'border-border-base',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={onToggle}
        className={[
          'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
          enabled ? 'bg-blue-light/40' : 'bg-white hover:bg-background',
        ].join(' ')}
      >
        <CheckboxIcon enabled={enabled} />
        <Icon className={`w-4 h-4 ${enabled ? 'text-navy' : 'text-muted'}`} />
        <span className={`text-sm font-medium ${enabled ? 'text-navy' : 'text-muted'}`}>
          {label}
        </span>
        {enabled && badge && (
          <span className="ml-auto text-xs font-medium text-gold whitespace-nowrap">
            {badge}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            key="care-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-4 pt-3 space-y-3 border-t border-border-base bg-white">
              {/* ヘルプテキスト */}
              <div className="px-3 py-2 rounded-lg text-[11px] text-muted leading-relaxed"
                style={{ backgroundColor: '#fef9e7' }}>
                <span style={{ color: '#d4af37' }}>ℹ</span>{' '}{helpText}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted mb-1.5">発生想定年齢（本人）</p>
                  <Input
                    type="number"
                    value={ageValue}
                    onChange={(e) => onAgeChange(e.target.value)}
                    placeholder={agePlaceholder}
                    suffix="歳"
                    min="30"
                    max="100"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted mb-1.5">負担総額</p>
                  <Input
                    type="number"
                    value={costValue}
                    onChange={(e) => onCostChange(e.target.value)}
                    placeholder={costPlaceholder}
                    suffix="万円"
                    min="0"
                  />
                </div>
              </div>
              <p className="text-[11px] text-subtle">
                ※ 入力した総額を発生年から 5 年間に均等計上します
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── CareSection ─────────────────────────────────────────

function CareSection() {
  const { data, setField } = useOnboardingStore()

  return (
    <div className="space-y-2.5">
      <CareItem
        icon={UserRound}
        label="親の介護費用を見込む"
        helpText="公的介護保険の自己負担を含む在宅介護の平均費用は約300〜500万円です。施設入居の場合は更に高額になることがあります。"
        badge={data.parentCareCost ? `総額 ${Number(data.parentCareCost).toLocaleString()} 万円` : undefined}
        enabled={data.expectParentCare}
        ageValue={data.parentCareAge}
        costValue={data.parentCareCost}
        onToggle={() => setField('expectParentCare', !data.expectParentCare)}
        onAgeChange={(v) => setField('parentCareAge', v)}
        onCostChange={(v) => setField('parentCareCost', v)}
        agePlaceholder="55"
        costPlaceholder="300"
      />

      <CareItem
        icon={Heart}
        label="自分・配偶者の介護費用を見込む"
        helpText="自身または配偶者の介護費用の自己負担額の平均は約500万円です。要介護度や施設の種類によって大きく異なります。"
        badge={data.selfCareCost ? `総額 ${Number(data.selfCareCost).toLocaleString()} 万円` : undefined}
        enabled={data.expectSelfCare}
        ageValue={data.selfCareAge}
        costValue={data.selfCareCost}
        onToggle={() => setField('expectSelfCare', !data.expectSelfCare)}
        onAgeChange={(v) => setField('selfCareAge', v)}
        onCostChange={(v) => setField('selfCareCost', v)}
        agePlaceholder="80"
        costPlaceholder="500"
      />
    </div>
  )
}

// ─── HouseSellSection ────────────────────────────────────

function HouseSellSection() {
  const { data, setField } = useOnboardingStore()
  const enabled = data.willSellHouse

  const sellPrice = parseFloat(data.sellHousePrice) || 0
  const relocCost = parseFloat(data.relocationCost) || 0
  const netProceeds = sellPrice - relocCost

  return (
    <div
      className={[
        'rounded-xl border-2 overflow-hidden transition-colors duration-200',
        enabled ? 'border-navy' : 'border-border-base',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={() => setField('willSellHouse', !enabled)}
        className={[
          'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
          enabled ? 'bg-blue-light/40' : 'bg-white hover:bg-background',
        ].join(' ')}
      >
        <CheckboxIcon enabled={enabled} />
        <TrendingUp className={`w-4 h-4 ${enabled ? 'text-navy' : 'text-muted'}`} />
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium ${enabled ? 'text-navy' : 'text-muted'}`}>
            老後に住宅を売却・住み替えする
          </span>
          <p className="text-[11px] text-subtle mt-0.5">
            施設入居・住み替えの計画がある場合
          </p>
        </div>
        {enabled && netProceeds !== 0 && (
          <span className={`ml-auto text-xs font-medium whitespace-nowrap ${netProceeds >= 0 ? 'text-gold' : 'text-red-500'}`}>
            手取 {netProceeds >= 0 ? '+' : ''}{Math.round(netProceeds).toLocaleString()} 万円
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            key="sell-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-4 pt-3 space-y-3 border-t border-border-base bg-white">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted mb-1.5">売却予定年齢</p>
                  <Input
                    type="number"
                    value={data.sellHouseAge}
                    onChange={(e) => setField('sellHouseAge', e.target.value)}
                    placeholder="75"
                    suffix="歳"
                    min="50"
                    max="100"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted mb-1.5">売却見込額</p>
                  <Input
                    type="number"
                    value={data.sellHousePrice}
                    onChange={(e) => setField('sellHousePrice', e.target.value)}
                    placeholder="1500"
                    suffix="万円"
                    min="0"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted mb-1.5">住み替え先の初期費用</p>
                  <Input
                    type="number"
                    value={data.relocationCost}
                    onChange={(e) => setField('relocationCost', e.target.value)}
                    placeholder="500"
                    suffix="万円"
                    min="0"
                  />
                  <p className="text-[10px] text-subtle mt-1">施設入居費・引越し費用など</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-1.5">売却後の月額家賃</p>
                  <Input
                    type="number"
                    value={data.postSellMonthlyRent}
                    onChange={(e) => setField('postSellMonthlyRent', e.target.value)}
                    placeholder="10"
                    suffix="万円/月"
                    min="0"
                    step="0.5"
                  />
                  <p className="text-[10px] text-subtle mt-1">施設月額・賃貸家賃など</p>
                </div>
              </div>

              {/* 収支サマリー */}
              {(sellPrice > 0 || relocCost > 0) && (
                <div
                  className="rounded-lg px-3 py-2 space-y-1"
                  style={{ backgroundColor: '#e6f0ff' }}
                >
                  <div className="flex items-center justify-between text-xs" style={{ color: '#003366' }}>
                    <span>売却収入</span>
                    <span className="font-semibold">+{sellPrice.toLocaleString()} 万円</span>
                  </div>
                  <div className="flex items-center justify-between text-xs" style={{ color: '#003366' }}>
                    <span>住み替え費用</span>
                    <span className="font-semibold">−{relocCost.toLocaleString()} 万円</span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t pt-1" style={{ borderColor: '#003366', color: '#003366' }}>
                    <span className="font-medium">売却時の手取り</span>
                    <span className="font-bold">
                      {netProceeds >= 0 ? '+' : ''}{Math.round(netProceeds).toLocaleString()} 万円
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── HousingSection（3択 + 売却） ───────────────────────────────

const HOUSING_OPTIONS: { value: HousingStatus; label: string; sub: string }[] = [
  { value: 'none',     label: '予定なし',                     sub: '住宅購入の予定はない' },
  { value: 'planning', label: 'これから購入',                 sub: '将来のマイホーム購入を計画している' },
  { value: 'existing', label: 'すでに購入済み（返済中）',     sub: '現在ローン返済中' },
]

function HousingSection() {
  const { data, setField } = useOnboardingStore()
  const status = data.housingStatus

  // これから購入：月額返済額の試算
  const cost         = parseFloat(data.housingCost) || 0
  const down         = parseFloat(data.housingDownPayment) || 0
  const loanAmount   = Math.max(0, cost - down)
  const planYears    = parseInt(data.housingLoanYears) || 35
  const planRate     = parseFloat(data.housingLoanRate) || 1.5
  const planAnnual   = calculateMortgageAnnualPayment(loanAmount, planYears, planRate)
  const planMonthly  = planAnnual / 12

  // すでに購入済み：月額返済額の試算
  const existingBalance  = parseFloat(data.existingLoanBalance) || 0
  const existingYears    = parseInt(data.existingLoanRemainingYears) || 0
  const existingRate     = parseFloat(data.existingLoanRate) || 0
  const existingAnnual   = calculateMortgageAnnualPayment(existingBalance, existingYears, existingRate)
  const existingMonthly  = existingAnnual / 12

  const showSell = status === 'planning' || status === 'existing'

  return (
    <div className="space-y-2">
      {/* 3択ラジオボタン */}
      {HOUSING_OPTIONS.map((opt) => {
        const selected = status === opt.value
        return (
          <div
            key={opt.value}
            className={[
              'rounded-xl border-2 overflow-hidden transition-colors duration-200',
              selected ? 'border-navy' : 'border-border-base',
            ].join(' ')}
          >
            <button
              type="button"
              onClick={() => setField('housingStatus', opt.value)}
              className={[
                'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                selected ? 'bg-blue-light/40' : 'bg-white hover:bg-background',
              ].join(' ')}
            >
              {/* ラジオ風インジケーター */}
              <div
                className={[
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200',
                  selected ? 'border-navy' : 'border-border-base',
                ].join(' ')}
              >
                {selected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-navy" />
                )}
              </div>
              <Home className={`w-4 h-4 ${selected ? 'text-navy' : 'text-muted'}`} />
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium ${selected ? 'text-navy' : 'text-muted'}`}>
                  {opt.label}
                </span>
                <p className="text-[11px] text-subtle mt-0.5">{opt.sub}</p>
              </div>
              {/* 月額返済試算バッジ */}
              {selected && opt.value === 'planning' && planMonthly > 0 && (
                <span className="ml-auto text-xs font-medium text-gold whitespace-nowrap">
                  月々 約 {Math.round(planMonthly * 10) / 10} 万円
                </span>
              )}
              {selected && opt.value === 'existing' && existingMonthly > 0 && (
                <span className="ml-auto text-xs font-medium text-gold whitespace-nowrap">
                  月々 約 {Math.round(existingMonthly * 10) / 10} 万円
                </span>
              )}
            </button>

            {/* これから購入の詳細フォーム */}
            <AnimatePresence initial={false}>
              {selected && opt.value === 'planning' && (
                <motion.div
                  key="planning-detail"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="px-4 pb-4 pt-3 space-y-3 border-t border-border-base bg-white">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted mb-1.5">物件価格</p>
                        <Input
                          type="number"
                          value={data.housingCost}
                          onChange={(e) => setField('housingCost', e.target.value)}
                          placeholder="3000"
                          suffix="万円"
                          min="0"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-1.5">頭金</p>
                        <Input
                          type="number"
                          value={data.housingDownPayment}
                          onChange={(e) => setField('housingDownPayment', e.target.value)}
                          placeholder="600"
                          suffix="万円"
                          min="0"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-1.5">購入予定年齢</p>
                        <Input
                          type="number"
                          value={data.housingPurchaseAge}
                          onChange={(e) => setField('housingPurchaseAge', e.target.value)}
                          placeholder="35"
                          suffix="歳"
                          min="20"
                          max="80"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-1.5">ローン年数</p>
                        <Input
                          type="number"
                          value={data.housingLoanYears}
                          onChange={(e) => setField('housingLoanYears', e.target.value)}
                          placeholder="35"
                          suffix="年"
                          min="1"
                          max="50"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-1.5">年利</p>
                      <Input
                        type="number"
                        value={data.housingLoanRate}
                        onChange={(e) => setField('housingLoanRate', e.target.value)}
                        placeholder="1.5"
                        suffix="%"
                        min="0"
                        max="10"
                        step="0.1"
                      />
                    </div>
                    {planMonthly > 0 && (
                      <div
                        className="rounded-lg px-3 py-2 flex items-center justify-between"
                        style={{ backgroundColor: '#e6f0ff' }}
                      >
                        <span className="text-xs" style={{ color: '#003366' }}>
                          試算: 月々の返済額（元利均等）
                        </span>
                        <span className="text-sm font-semibold" style={{ color: '#003366' }}>
                          約 {Math.round(planMonthly * 10) / 10} 万円/月
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* すでに購入済みの詳細フォーム */}
            <AnimatePresence initial={false}>
              {selected && opt.value === 'existing' && (
                <motion.div
                  key="existing-detail"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className="px-4 pb-4 pt-3 space-y-3 border-t border-border-base bg-white">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <p className="text-xs text-muted mb-1.5">現在のローン残高</p>
                        <Input
                          type="number"
                          value={data.existingLoanBalance}
                          onChange={(e) => setField('existingLoanBalance', e.target.value)}
                          placeholder="2500"
                          suffix="万円"
                          min="0"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-1.5">残りの返済期間</p>
                        <Input
                          type="number"
                          value={data.existingLoanRemainingYears}
                          onChange={(e) => setField('existingLoanRemainingYears', e.target.value)}
                          placeholder="25"
                          suffix="年"
                          min="1"
                          max="50"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-1.5">ローン金利</p>
                        <Input
                          type="number"
                          value={data.existingLoanRate}
                          onChange={(e) => setField('existingLoanRate', e.target.value)}
                          placeholder="1.5"
                          suffix="%"
                          min="0"
                          max="10"
                          step="0.1"
                        />
                      </div>
                    </div>
                    {existingMonthly > 0 && (
                      <div
                        className="rounded-lg px-3 py-2 flex items-center justify-between"
                        style={{ backgroundColor: '#e6f0ff' }}
                      >
                        <span className="text-xs" style={{ color: '#003366' }}>
                          試算: 月々の返済額（元利均等）
                        </span>
                        <span className="text-sm font-semibold" style={{ color: '#003366' }}>
                          約 {Math.round(existingMonthly * 10) / 10} 万円/月
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      {/* 住宅売却・住み替えセクション（planning / existing のみ表示） */}
      <AnimatePresence initial={false}>
        {showSell && (
          <motion.div
            key="sell-section"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="pt-1">
              <p className="text-xs font-medium text-muted mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                老後の住み替え計画
              </p>
              <HouseSellSection />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── 教育コースの選択肢 ──────────────────────────────────

const COURSE_OPTIONS: { value: EducationCourse; label: string; sub: string }[] = [
  { value: 'all-public',     label: '全て公立',      sub: '〜約 810 万円' },
  { value: 'high-private',   label: '高校から私立',  sub: '〜約 1,140 万円' },
  { value: 'middle-private', label: '中学から私立',  sub: '〜約 1,530 万円' },
  { value: 'custom',         label: 'カスタム',      sub: '年額を手動入力' },
]

// ─── ChildEducationItem ──────────────────────────────────

function ChildEducationItem({ child, index }: { child: Child; index: number }) {
  const { updateChild } = useOnboardingStore()

  return (
    <div className="rounded-xl border border-border-base p-3.5 space-y-2.5">
      <p className="text-xs font-medium text-muted">
        {index + 1}人目
        {child.currentAge ? `（現在 ${child.currentAge} 歳）` : ''}
      </p>

      <div className="space-y-1.5">
        {COURSE_OPTIONS.map((opt) => {
          const selected = child.educationCourse === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateChild(child.id, { educationCourse: opt.value })}
              className={[
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border-2 text-left transition-colors duration-150',
                selected
                  ? 'border-navy bg-blue-light/40'
                  : 'border-border-base bg-white hover:border-navy/30',
              ].join(' ')}
            >
              <span
                className={`text-sm font-medium ${selected ? 'text-navy' : 'text-muted'}`}
              >
                {opt.label}
              </span>
              <span className="text-xs text-subtle">{opt.sub}</span>
            </button>
          )
        })}
      </div>

      {/* カスタム年額入力 */}
      {child.educationCourse === 'custom' && (
        <div>
          <p className="text-xs text-muted mb-1.5">年間の教育費</p>
          <Input
            type="number"
            value={child.customAnnualAmount}
            onChange={(e) =>
              updateChild(child.id, { customAnnualAmount: e.target.value })
            }
            placeholder="100"
            suffix="万円/年"
            min="0"
          />
        </div>
      )}
    </div>
  )
}

// ─── ExpenseItem（車・その他） ───────────────────────────

interface ExpenseItemProps {
  expense: MajorExpense
  onToggle: () => void
  onUpdate: (patch: Partial<Omit<MajorExpense, 'id'>>) => void
}

function ExpenseItem({ expense, onToggle, onUpdate }: ExpenseItemProps) {
  const Icon = ICONS[expense.id] ?? Plus

  return (
    <div
      className={[
        'rounded-xl border-2 overflow-hidden transition-colors duration-200',
        expense.enabled ? 'border-navy' : 'border-border-base',
      ].join(' ')}
    >
      {/* チェックボックス行 */}
      <button
        type="button"
        onClick={onToggle}
        className={[
          'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
          expense.enabled ? 'bg-blue-light/40' : 'bg-white hover:bg-background',
        ].join(' ')}
      >
        <CheckboxIcon enabled={expense.enabled} />
        <Icon className={`w-4 h-4 ${expense.enabled ? 'text-navy' : 'text-muted'}`} />
        <span
          className={`text-sm font-medium ${expense.enabled ? 'text-navy' : 'text-muted'}`}
        >
          {expense.label}
        </span>
        {expense.enabled && expense.amount && (
          <span className="ml-auto text-xs font-medium text-gold">
            {Number(expense.amount).toLocaleString()} 万円
          </span>
        )}
      </button>

      {/* 詳細入力（アコーディオン） */}
      <AnimatePresence initial={false}>
        {expense.enabled && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-4 pt-3 grid grid-cols-2 gap-3 border-t border-border-base bg-white">
              <div>
                <p className="text-xs text-muted mb-1.5">予算</p>
                <Input
                  type="number"
                  value={expense.amount}
                  onChange={(e) => onUpdate({ amount: e.target.value })}
                  placeholder="300"
                  suffix="万円"
                  min="0"
                />
              </div>
              <div>
                <p className="text-xs text-muted mb-1.5">予定年齢</p>
                <Input
                  type="number"
                  value={expense.targetAge}
                  onChange={(e) => onUpdate({ targetAge: e.target.value })}
                  placeholder="35"
                  suffix="歳"
                  min="20"
                  max="80"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Step3Goals ──────────────────────────────────────────

export function Step3Goals() {
  const { data, setField, updateMajorExpense } = useOnboardingStore()

  return (
    <div className="space-y-6">
      {/* リタイア希望年齢 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-navy mb-2.5">
          <Briefcase className="w-4 h-4" />
          リタイア希望年齢
        </label>
        <Input
          type="number"
          value={data.retirementAge}
          onChange={(e) => setField('retirementAge', e.target.value)}
          placeholder="65"
          suffix="歳"
          min="40"
          max="80"
        />
      </div>

      {/* 配偶者のリタイア希望年齢（配偶者ありの場合のみ） */}
      {data.hasSpouse && (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-navy mb-2.5">
            <Heart className="w-4 h-4" />
            配偶者のリタイア希望年齢
          </label>
          <Input
            type="number"
            value={data.spouseRetirementAge}
            onChange={(e) => setField('spouseRetirementAge', e.target.value)}
            placeholder="65"
            suffix="歳"
            min="40"
            max="80"
          />
        </div>
      )}

      {/* 老後の公的年金（世帯月額） */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-navy mb-2.5">
          <Landmark className="w-4 h-4" />
          老後の公的年金（世帯月額・65 歳以降）
        </label>
        <Input
          type="number"
          value={data.monthlyPension}
          onChange={(e) => setField('monthlyPension', e.target.value)}
          placeholder="20"
          suffix="万円"
          min="0"
        />
        <div className="mt-2 px-3 py-2 rounded-lg bg-gold-light text-[11px] text-muted leading-relaxed space-y-0.5">
          <p className="font-medium" style={{ color: '#d4af37' }}>目安</p>
          <p>・単身（会社員）: 約 15 万円/月</p>
          <p>・共働き（夫婦ともに会社員）: 約 25〜30 万円/月</p>
          <p>・専業主婦世帯: 約 20〜22 万円/月</p>
        </div>
      </div>

      {/* 退職金（将来の一時金収入） */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-navy mb-2.5">
          <Briefcase className="w-4 h-4" />
          退職金（見込み額）
        </label>
        <Input
          type="number"
          value={data.severancePay}
          onChange={(e) => setField('severancePay', e.target.value)}
          placeholder="1000"
          suffix="万円"
          min="0"
        />
        <p className="text-xs text-muted mt-1.5">
          ※ リタイア時に一括で資産へ加算されます
        </p>
      </div>

      {/* 住宅 */}
      <div>
        <p className="text-sm font-medium text-navy mb-3">住宅ローン・住み替え</p>
        <HousingSection />
      </div>

      {/* 介護費用 */}
      <div>
        <p className="text-sm font-medium text-navy mb-1">
          介護費用
          <span className="text-xs font-normal text-muted ml-2">（見込む場合はチェック）</span>
        </p>
        <p className="text-[11px] text-subtle mb-3 flex items-center gap-1">
          <UserRound className="w-3 h-3" />
          発生年から 5 年間に均等計上します
        </p>
        <CareSection />
      </div>

      {/* 子どもの教育費（子どもがいる場合のみ表示） */}
      {data.children.length > 0 && (
        <div>
          <p className="text-sm font-medium text-navy mb-1">
            子どもの教育費
            <span className="text-xs font-normal text-muted ml-2">（進路を選択）</span>
          </p>
          <p className="text-[11px] text-subtle mb-3 flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            幼稚園〜大学までの概算費用を年次で計上します
          </p>
          <div className="space-y-2.5">
            {data.children.map((child, index) => (
              <ChildEducationItem key={child.id} child={child} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* その他の支出（車・その他） */}
      <div>
        <p className="text-sm font-medium text-navy mb-3">
          その他の支出
          <span className="text-xs font-normal text-muted ml-2">（複数選択可）</span>
        </p>
        <div className="space-y-2.5">
          {data.majorExpenses.map((expense) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              onToggle={() =>
                updateMajorExpense(expense.id, { enabled: !expense.enabled })
              }
              onUpdate={(patch) => updateMajorExpense(expense.id, patch)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
