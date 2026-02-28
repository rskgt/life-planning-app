import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ─── 型定義 ─────────────────────────────────────────────

export type EducationCourse = 'all-public' | 'high-private' | 'middle-private' | 'custom'

/** 住宅の状況 */
export type HousingStatus = 'none' | 'planning' | 'existing'

export interface Child {
  id: string
  currentAge: string
  educationCourse: EducationCourse
  /** 年間の教育費（万円/年）― course が 'custom' の場合のみ使用 */
  customAnnualAmount: string
}

/** 大きな支出イベント（車・その他） */
export interface MajorExpense {
  id: string
  label: string
  /** 予算（万円・今日の価格） */
  amount: string
  /** 予定年齢（歳） */
  targetAge: string
  enabled: boolean
}

export interface OnboardingData {
  // ── Step 1: 基本情報 ──
  age: string
  hasSpouse: boolean
  children: Child[]

  // ── 配偶者情報（hasSpouse === true の場合のみ使用） ──
  spouseAge: string
  /** 配偶者の額面年収（ボーナス込み・万円/年） */
  spouseAnnualIncome: string
  spouseRetirementAge: string

  // ── Step 2: 財務状況 ──
  /** 現金預金（普通預金・定期預金など、利回り0%） */
  currentCash: string
  /** 運用資産（総額）― NISA・DC・特定口座など、現在保有する運用資産の合計 */
  currentInvestments: string
  /** 確定拠出年金残高（iDeCoや企業型DCなど、60歳まで引き出せない資産）― 運用資産総額の内数 */
  currentDC: string
  /** NISA残高（非課税で運用・取り崩しが可能な資産）― 運用資産総額の内数 */
  currentNISABalance: string
  /** 額面の年収（ボーナス込み・万円/年） */
  annualIncome: string
  /** 毎月の基本生活費（万円/月） */
  monthlyExpenses: string
  /** 毎月の積立額（現金→投資へ移動する金額・万円/月） */
  monthlyInvestmentAmount: string
  /** 積立を収入変化・リタイアに連動して自動停止する（デフォルト: true） */
  autoStopInvestment: boolean
  /** 積立終了年齢（autoStopInvestment が false のときのみ使用） */
  customInvestmentEndAge: string

  // ── iDeCo（毎月の積立の内訳） ──
  idecoEnabled: boolean
  /** iDeCo 月額拠出額（万円/月）― 積立総額の内数 */
  idecoMonthlyAmount: string

  // ── NISA（毎月の積立の内訳） ──
  nisaEnabled: boolean
  /** NISA 年間積立額（万円/年）― 積立総額の内数 */
  nisaAnnualAmount: string

  // ── Step 3: 将来の目標・イベント ──
  retirementAge: string

  // ── 公的年金（65 歳以降の世帯月額） ──
  monthlyPension: string

  // ── 住宅 ──
  housingStatus: HousingStatus

  // これから購入（planning）の場合
  housingPurchaseAge: string
  housingCost: string         // 物件価格（万円）
  housingDownPayment: string  // 頭金（万円）
  housingLoanYears: string    // ローン年数
  housingLoanRate: string     // 年利（%）

  // すでに購入済み（existing）の場合
  existingLoanBalance: string        // 現在のローン残高（万円）
  existingLoanRemainingYears: string // 残りの返済期間（年）
  existingLoanRate: string           // ローン金利（%）

  // 住宅売却（planning / existing のときのみ有効）
  willSellHouse: boolean             // 老後に住宅を売却・住み替えする
  sellHouseAge: string               // 売却想定年齢
  sellHousePrice: string             // 売却見込額（万円）
  relocationCost: string             // 住み替え先の初期費用・施設入居費（万円）
  postSellMonthlyRent: string        // 売却後の月額家賃（万円/月）

  // ── 収入カーブ（役職定年・再雇用による段階的減収） ──
  /** 収入カーブを適用する */
  applyIncomeDecline: boolean
  /** 第1段階の減収開始年齢（例: 55歳 / 役職定年） */
  incomeDecreaseAge1: string
  /** 第1段階の収入維持率（0〜100 %、例: 85） */
  incomeDecreaseRate1: string
  /** 第2段階の減収開始年齢（例: 60歳 / 再雇用） */
  incomeDecreaseAge2: string
  /** 第2段階の収入維持率（0〜100 %、例: 60） */
  incomeDecreaseRate2: string

  // ── リタイア後の労働収入 ──
  /** リタイア後も働く */
  postRetirementWork: boolean
  /** 働く上限年齢 */
  postRetirementWorkingAge: string
  /** 月額労働収入（万円/月） */
  postRetirementMonthlyIncome: string

  // ── 介護費用 ──
  expectParentCare: boolean          // 親の介護費用を見込む
  parentCareAge: string              // 発生想定年齢（本人年齢）
  parentCareCost: string             // 負担総額（万円）
  expectSelfCare: boolean            // 自分・配偶者の介護費用を見込む
  selfCareAge: string                // 発生想定年齢（本人年齢）
  selfCareCost: string               // 負担総額（万円）

  // ── その他の支出 ──
  majorExpenses: MajorExpense[]

  // ── 退職金 ──
  /** 退職金（万円）― リタイア年齢時に一括加算 */
  severancePay: string
}

interface OnboardingStore {
  step: number
  totalSteps: number
  data: OnboardingData

  // ── シミュレーションパラメータ ──
  /** 想定運用利回り（%/年、例: 3.0 = 3%） */
  investmentRate: number
  /** 想定インフレ率（%/年、例: 1.0 = 1%） */
  inflationRate: number

  // ── アクション ──
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setField: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => void
  /** 複数フィールドを一括更新する（自動設定時に使用） */
  setMultipleFields: (fields: Partial<OnboardingData>) => void
  /** 子供の人数を変更する（配列を増減。既存データは保持） */
  setChildrenCount: (n: number) => void
  updateChild: (id: string, patch: Partial<Omit<Child, 'id'>>) => void
  updateMajorExpense: (id: string, patch: Partial<Omit<MajorExpense, 'id'>>) => void
  setInvestmentRate: (rate: number) => void
  setInflationRate: (rate: number) => void
  reset: () => void
}

// ─── 初期値 ─────────────────────────────────────────────

const DEFAULT_MAJOR_EXPENSES: MajorExpense[] = [
  { id: 'car',   label: '車の購入',     amount: '300', targetAge: '35', enabled: false },
  { id: 'other', label: 'その他の支出', amount: '',    targetAge: '',   enabled: false },
]

function makeChild(): Child {
  const id = `child-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  return {
    id,
    currentAge: '',
    educationCourse: 'all-public',
    customAnnualAmount: '',
  }
}

const initialData: OnboardingData = {
  age: '',
  hasSpouse: false,
  children: [],
  spouseAge: '',
  spouseAnnualIncome: '',
  spouseRetirementAge: '65',
  currentCash: '',
  currentInvestments: '',
  currentDC: '',
  currentNISABalance: '',
  annualIncome: '',
  monthlyExpenses: '',
  monthlyInvestmentAmount: '',
  autoStopInvestment: true,
  customInvestmentEndAge: '',
  idecoEnabled: false,
  idecoMonthlyAmount: '2.3',
  nisaEnabled: false,
  nisaAnnualAmount: '20',
  retirementAge: '65',
  monthlyPension: '',
  housingStatus: 'none',
  housingPurchaseAge: '35',
  housingCost: '3000',
  housingDownPayment: '600',
  housingLoanYears: '35',
  housingLoanRate: '1.5',
  existingLoanBalance: '',
  existingLoanRemainingYears: '',
  existingLoanRate: '1.5',
  willSellHouse: false,
  sellHouseAge: '75',
  sellHousePrice: '1500',
  relocationCost: '500',
  postSellMonthlyRent: '10',
  applyIncomeDecline: false,
  incomeDecreaseAge1: '55',
  incomeDecreaseRate1: '85',
  incomeDecreaseAge2: '60',
  incomeDecreaseRate2: '60',
  postRetirementWork: false,
  postRetirementWorkingAge: '70',
  postRetirementMonthlyIncome: '10',
  expectParentCare: false,
  parentCareAge: '55',
  parentCareCost: '300',
  expectSelfCare: false,
  selfCareAge: '80',
  selfCareCost: '500',
  majorExpenses: DEFAULT_MAJOR_EXPENSES,
  severancePay: '',
}

// ─── SSR 用 no-op ストレージ ────────────────────────────
// localStorage はブラウザ専用のため、サーバー側では何もしないストレージを使う

const noopStorage = {
  getItem:    (_: string): string | null => null,
  setItem:    (_: string, __: string): void => {},
  removeItem: (_: string): void => {},
}

// ─── ストア ─────────────────────────────────────────────

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      step: 0,
      totalSteps: 3,
      data: initialData,
      investmentRate: 3.0,
      inflationRate:  1.0,

      setStep: (step) => set({ step }),

      nextStep: () =>
        set((s) => ({ step: Math.min(s.step + 1, s.totalSteps - 1) })),

      prevStep: () =>
        set((s) => ({ step: Math.max(s.step - 1, 0) })),

      setField: (field, value) =>
        set((s) => ({ data: { ...s.data, [field]: value } })),

      setMultipleFields: (fields) =>
        set((s) => ({ data: { ...s.data, ...fields } })),

      setChildrenCount: (n) =>
        set((s) => {
          const current = s.data.children
          if (n === current.length) return s
          if (n < current.length) {
            return { data: { ...s.data, children: current.slice(0, n) } }
          }
          const added: Child[] = Array.from(
            { length: n - current.length },
            () => makeChild()
          )
          return { data: { ...s.data, children: [...current, ...added] } }
        }),

      updateChild: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            children: s.data.children.map((c) =>
              c.id === id ? { ...c, ...patch } : c
            ),
          },
        })),

      updateMajorExpense: (id, patch) =>
        set((s) => ({
          data: {
            ...s.data,
            majorExpenses: s.data.majorExpenses.map((e) =>
              e.id === id ? { ...e, ...patch } : e
            ),
          },
        })),

      setInvestmentRate: (rate) => set({ investmentRate: rate }),
      setInflationRate:  (rate) => set({ inflationRate:  rate }),

      reset: () =>
        set({ step: 0, data: initialData, investmentRate: 3.0, inflationRate: 1.0 }),
    }),
    {
      name: 'life-planning-store-v10',
      // サーバーサイドでは no-op、クライアントサイドでは localStorage を使用
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : noopStorage
      ),
      // SSR ハイドレーションのミスマッチを防ぐため手動でハイドレートする
      skipHydration: true,
    }
  )
)
