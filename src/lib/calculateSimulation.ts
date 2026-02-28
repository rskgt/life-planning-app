import type { OnboardingData, EducationCourse } from '@/store/useOnboardingStore'

// ─── パラメータ / 出力型 ─────────────────────────────────

export interface SimulationParams {
  /** 想定運用利回り（%/年、例: 3.0 = 3%） */
  investmentRate: number
  /** 想定インフレ率（%/年、例: 1.0 = 1%） */
  inflationRate: number
}

export interface YearlyDataPoint {
  age: number
  /** 資産残高（万円、マイナスあり） */
  assets: number
  /** その年に発生するライフイベント名 */
  events: string[]
  isRetirement: boolean
}

export interface SimulationResult {
  yearlyData:         YearlyDataPoint[]
  currentAge:         number
  retirementAge:      number
  /** 退職時点の予想資産（万円） */
  assetsAtRetirement: number
  /** 80 歳時点の予想資産（万円） */
  assetsAt80:         number
  /**
   * 月間収支（万円/月）= 世帯手取り月収 − 生活費（現時点）
   * ※ 積立額は含まない
   */
  monthlyBalance:     number
  /** 資産がゼロを下回る年齢（null = 100 歳まで持つ） */
  depletionAge:       number | null
}

// ─── iDeCo 所得控除による税メリット計算 ─────────────────

/**
 * iDeCo 年間拠出額から得られる税メリット（所得控除額）を概算する。
 * 掛け金は全額所得控除 → 所得税 + 住民税 (10%) の節税効果。
 *
 * 本人の額面年収に応じた実効控除率:
 *   〜500万  → 20%（所得税 10% + 住民税 10%）
 *   501〜1000万 → 28%（所得税 18% + 住民税 10%）
 *   1001万以上  → 33%（所得税 23% + 住民税 10%）
 */
export function calculateIDeCoTaxBenefit(
  grossAnnual: number,
  idecoAnnual: number,
): number {
  if (grossAnnual <= 0 || idecoAnnual <= 0) return 0
  if (grossAnnual <= 500)  return idecoAnnual * 0.20
  if (grossAnnual <= 1000) return idecoAnnual * 0.28
  return idecoAnnual * 0.33
}

// ─── 手取り年収の簡易計算 ────────────────────────────────

/**
 * 額面年収（万円）から手取り年収（万円）を概算する。
 *
 * 区分ごとの目安掛け率:
 *   〜 500万円以下  → 80%
 *   501〜1000万円   → 75%
 *   1001万円以上    → 70%
 */
export function calculateNetAnnualIncome(grossAnnual: number): number {
  if (grossAnnual <= 0) return 0
  if (grossAnnual <= 500)  return grossAnnual * 0.80
  if (grossAnnual <= 1000) return grossAnnual * 0.75
  return grossAnnual * 0.70
}

// ─── 教育費テーブル ──────────────────────────────────────
// 文部科学省「子供の学習費調査」に基づく概算年間費用（万円/年）

const EDUCATION_ANNUAL: Record<
  Exclude<EducationCourse, 'custom'>,
  { from: number; to: number; annual: number }[]
> = {
  'all-public': [
    { from: 3,  to: 5,  annual: 20 },  // 幼稚園（公立）
    { from: 6,  to: 11, annual: 35 },  // 小学校（公立）
    { from: 12, to: 14, annual: 50 },  // 中学校（公立）
    { from: 15, to: 17, annual: 50 },  // 高校（公立）
    { from: 18, to: 21, annual: 60 },  // 大学（国公立）
  ],
  'high-private': [
    { from: 3,  to: 5,  annual: 20 },
    { from: 6,  to: 11, annual: 35 },
    { from: 12, to: 14, annual: 50 },
    { from: 15, to: 17, annual: 80 },  // 高校（私立）
    { from: 18, to: 21, annual: 120 }, // 大学（私立）
  ],
  'middle-private': [
    { from: 3,  to: 5,  annual: 20 },
    { from: 6,  to: 11, annual: 35 },
    { from: 12, to: 14, annual: 120 }, // 中学校（私立）
    { from: 15, to: 17, annual: 100 }, // 高校（私立）
    { from: 18, to: 21, annual: 150 }, // 大学（私立）
  ],
}

function getChildAnnualEducationCost(
  course: EducationCourse,
  childAge: number,
  customAmount: number,
): number {
  if (childAge < 3 || childAge > 21) return 0
  if (course === 'custom') return customAmount
  const brackets = EDUCATION_ANNUAL[course]
  const bracket = brackets.find((b) => childAge >= b.from && childAge <= b.to)
  return bracket?.annual ?? 0
}

// ─── 住宅ローン計算（元利均等返済） ─────────────────────

/**
 * 元利均等返済の年間返済額を計算する。
 * @param loanAmount  ローン元本（万円）
 * @param years       返済年数
 * @param annualRatePct 年利（%、例: 1.5 = 1.5%）
 * @returns 年間返済額（万円）
 */
export function calculateMortgageAnnualPayment(
  loanAmount: number,
  years: number,
  annualRatePct: number,
): number {
  if (loanAmount <= 0 || years <= 0) return 0
  const r = annualRatePct / 100 / 12 // 月利
  const n = years * 12               // 返済回数
  if (r === 0) return loanAmount / years
  const monthly =
    (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  return monthly * 12 // 年間返済額
}

// ─── メイン計算関数 ──────────────────────────────────────

/**
 * オンボーディングデータとシミュレーションパラメータをもとに、
 * 現在〜100 歳までの毎年の資産残高を計算する。
 *
 * ■ 資産モデル（現金残高 + 運用残高の2本立て）
 *   - currentCash:        現金預金（利回り 0%）
 *   - currentInvestments: 運用資産（利回り investmentRate%、複利）
 *
 * ■ 年次計算フロー
 *   各年:
 *     1. 運用リターン: investmentBalance × (1 + rInvest) を適用
 *     2. キャッシュイン → 現金へ加算（インフレ倍率適用）:
 *        - 本人の手取り年収（額面から自動計算）: 本人年齢 ≦ retirementAge の期間
 *        - 配偶者の手取り年収: hasSpouse かつ 配偶者年齢 ≦ spouseRetirementAge の期間
 *        - 公的年金: 本人年齢 ≧ 65 の期間（名目額固定）
 *     3. キャッシュアウト → 現金から減算（インフレ倍率適用）:
 *        - 基本生活費
 *        - 子どもの成長加算
 *     4. 積立移動: monthlyInvestmentAmount × 12 を現金から運用資産へ移動
 *     5. 大きな支出（車・その他）→ 現金から減算
 *     6. 住宅関連 → 現金から減算:
 *        【これから購入（planning）】購入年に頭金を減算、以後ローン年数分だけ年間返済額を減算
 *        【すでに購入済み（existing）】今年から残り期間ずっと元利均等返済を減算
 *        ＋購入後は維持費 30 万円/年（固定）を毎年加算
 *        【住宅売却年】売却収入を加算し、住み替え費用を減算。以降ローン・維持費停止
 *        【売却後】毎年 postSellMonthlyRent × 12 を家賃として減算
 *     7. 介護費用 → 現金から減算（発生年から 5 年均等）:
 *        - 親の介護: parentCareAge 〜 +4 年
 *        - 自身の介護: selfCareAge 〜 +4 年
 *     8. 教育費 → 現金から減算
 *   合計資産 = cashBalance + investmentBalance
 *
 * ■ インフレの扱い
 *   - 手取り収入・生活費・子ども成長費は inflationRate で毎年上昇
 *   - 公的年金・住宅・大きな支出・ローン返済額・住宅維持費は名目額のまま
 *   - 教育費テーブルも名目額のまま使用
 */

/** 住宅維持費（固定資産税＋修繕積立金等）の年間概算額（万円/年） */
const HOUSING_MAINTENANCE_ANNUAL = 30

/** 介護費用を均等に分割して計上する年数 */
const CARE_SPREAD_YEARS = 5

/** 子どもの成長に伴う生活費加算（万円/年） */
const CHILD_EXPENSE_JUNIOR_HIGH = 36  // 中学生 13〜15 歳（月+3万）
const CHILD_EXPENSE_HIGH_SCHOOL = 60  // 高校生以上 16〜22 歳（月+5万）

/** 確定拠出年金の受給開始年齢（この年齢から DC 残高が取り崩し可能になる） */
const DC_UNLOCK_AGE = 60

/** iDeCo 掛金の拠出上限年齢（法的制限・65歳まで） */
const IDECO_MAX_AGE = 65

export function calculateSimulation(
  data:   OnboardingData,
  params: SimulationParams = { investmentRate: 3, inflationRate: 1 },
): SimulationResult {
  // ── パース ───────────────────────────────────────────
  const currentAge    = Math.max(18, parseInt(data.age)           || 30)
  const retirementAge = Math.max(currentAge + 1,
                          parseInt(data.retirementAge)            || 65)

  // 初期資産（現金・運用を分離）
  const currentCash        = Math.max(0, parseFloat(data.currentCash)        || 0)
  const currentInvestments = Math.max(0, parseFloat(data.currentInvestments) || 0)
  // 確定拠出年金（iDeCoや企業型DC）― 流動性資産と分離して追跡
  const currentDC          = Math.max(0, parseFloat(data.currentDC ?? '0')   || 0)

  // 手取り年収（額面から自動計算）― これをベースに収入カーブを適用する
  const grossAnnualIncome  = Math.max(0, parseFloat(data.annualIncome) || 0)
  const netAnnualIncome    = calculateNetAnnualIncome(grossAnnualIncome)

  const MAX_AGE = 100

  // ── 収入カーブ設定 ───────────────────────────────────
  const applyDecline       = data.applyIncomeDecline
  const declineAge1        = applyDecline ? (parseInt(data.incomeDecreaseAge1) || 55) : MAX_AGE + 1
  const declineRate1       = applyDecline ? Math.min(1, Math.max(0, (parseFloat(data.incomeDecreaseRate1) || 85) / 100)) : 1
  const declineAge2        = applyDecline ? (parseInt(data.incomeDecreaseAge2) || 60) : MAX_AGE + 1
  const declineRate2       = applyDecline ? Math.min(1, Math.max(0, (parseFloat(data.incomeDecreaseRate2) || 60) / 100)) : 1

  // ── 積立終了年齢の算出 ──────────────────────────────────
  // autoStopInvestment=true  → min(収入減少①開始年齢 if applyDecline, リタイア年齢)
  // autoStopInvestment=false → customInvestmentEndAge（未入力はリタイア年齢にフォールバック）
  const autoStopInvestment = data.autoStopInvestment ?? true
  const investmentEndAge: number = (() => {
    if (!autoStopInvestment) {
      return parseInt(data.customInvestmentEndAge) || retirementAge
    }
    const candidates = [retirementAge]
    if (applyDecline && declineAge1 <= MAX_AGE && declineAge1 > currentAge) {
      candidates.push(declineAge1)
    }
    return Math.min(...candidates)
  })()

  // ── リタイア後の労働収入 ──────────────────────────────
  const postWork           = data.postRetirementWork
  const postWorkEndAge     = postWork ? (parseInt(data.postRetirementWorkingAge) || 70) : 0
  const postWorkAnnual     = postWork ? Math.max(0, parseFloat(data.postRetirementMonthlyIncome) || 0) * 12 : 0

  // 生活費
  const monthlyExpenses = Math.max(0, parseFloat(data.monthlyExpenses) || 0)

  // ── 退職金 ──────────────────────────────────────────────
  const severancePay = Math.max(0, parseFloat(data.severancePay) || 0)

  // ── iDeCo ─────────────────────────────────────────────
  const idecoEnabled     = data.idecoEnabled ?? false
  const idecoAnnual      = idecoEnabled
    ? Math.max(0, parseFloat(data.idecoMonthlyAmount) || 0) * 12 : 0
  const idecoTaxBenefit  = calculateIDeCoTaxBenefit(grossAnnualIncome, idecoAnnual)

  // 毎月の積立額（現金→運用へ移動する年間額）
  const annualInvestmentTransfer =
    Math.max(0, parseFloat(data.monthlyInvestmentAmount) || 0) * 12

  // 配偶者
  const spouseCurrentAge     = data.hasSpouse ? (parseInt(data.spouseAge) || 0) : 0
  const grossSpouseIncome    = data.hasSpouse
    ? Math.max(0, parseFloat(data.spouseAnnualIncome) || 0) : 0
  const netSpouseAnnualIncome = calculateNetAnnualIncome(grossSpouseIncome)
  const spouseRetirementAge  = data.hasSpouse
    ? Math.max(1, parseInt(data.spouseRetirementAge) || 65) : 0

  // 公的年金（名目固定）
  const monthlyPension = Math.max(0, parseFloat(data.monthlyPension) || 0)
  const PENSION_START  = 65

  const rInvest = params.investmentRate / 100
  const rInflat = params.inflationRate  / 100

  // ── 住宅ローン事前計算 ───────────────────────────────
  // planning（これから購入）
  let planningPurchaseAge   = 0
  let planningDownPayment   = 0
  let planningAnnualPayment = 0
  let planningLoanEndAge    = 0
  let validPlanning         = false

  if (data.housingStatus === 'planning') {
    planningPurchaseAge = parseInt(data.housingPurchaseAge) || 0
    planningDownPayment = parseFloat(data.housingDownPayment) || 0
    const housingCost   = parseFloat(data.housingCost) || 0
    const loanYears     = parseInt(data.housingLoanYears) || 35
    const loanRate      = parseFloat(data.housingLoanRate) || 1.5
    const loanAmount    = Math.max(0, housingCost - planningDownPayment)
    planningAnnualPayment = calculateMortgageAnnualPayment(loanAmount, loanYears, loanRate)
    planningLoanEndAge    = planningPurchaseAge + loanYears
    // 購入年齢が現在以前でも「過去に買った・ローン継続中」として計算対象とする
    // planningPurchaseAge === 0 はフィールド未入力扱いのためスキップ
    validPlanning = planningPurchaseAge > 0 && planningPurchaseAge <= MAX_AGE
  }

  // existing（すでに購入済み）
  let existingAnnualPayment = 0
  let existingLoanEndAge    = 0

  if (data.housingStatus === 'existing') {
    const existingBalance      = Math.max(0, parseFloat(data.existingLoanBalance) || 0)
    const existingRemaining    = Math.max(0, parseInt(data.existingLoanRemainingYears) || 0)
    const existingRate         = parseFloat(data.existingLoanRate) || 0
    existingAnnualPayment = calculateMortgageAnnualPayment(existingBalance, existingRemaining, existingRate)
    existingLoanEndAge    = currentAge + existingRemaining
  }

  // ── 住宅売却 事前計算 ───────────────────────────────
  // planning / existing の場合のみ有効
  const canSell = data.housingStatus === 'planning' || data.housingStatus === 'existing'
  const willSell = canSell && data.willSellHouse
  const sellHouseAge      = willSell ? Math.max(currentAge + 1, parseInt(data.sellHouseAge)  || 75) : MAX_AGE + 1
  const sellHousePrice    = willSell ? Math.max(0, parseFloat(data.sellHousePrice)   || 0) : 0
  const relocationCost    = willSell ? Math.max(0, parseFloat(data.relocationCost)   || 0) : 0
  const postSellRentAnnual = willSell ? Math.max(0, parseFloat(data.postSellMonthlyRent) || 0) * 12 : 0

  // ── 介護費用 事前計算 ───────────────────────────────
  const parentCareAge    = data.expectParentCare
    ? Math.max(currentAge, parseInt(data.parentCareAge) || 55) : MAX_AGE + 1
  const parentCareAnnual = data.expectParentCare
    ? Math.max(0, parseFloat(data.parentCareCost) || 0) / CARE_SPREAD_YEARS : 0
  const selfCareAge      = data.expectSelfCare
    ? Math.max(currentAge, parseInt(data.selfCareAge)   || 80) : MAX_AGE + 1
  const selfCareAnnual   = data.expectSelfCare
    ? Math.max(0, parseFloat(data.selfCareCost)   || 0) / CARE_SPREAD_YEARS : 0

  // ── イベントマップ ───────────────────────────────────
  const eventLabelMap  = new Map<number, string[]>()
  const eventAmountMap = new Map<number, number>()

  const retirementLabels: string[] = ['リタイア']
  if (severancePay > 0) retirementLabels.push('退職金')
  eventLabelMap.set(retirementAge, retirementLabels)

  // 住宅購入イベントはシミュレーション期間内（未来）の場合のみ表示
  if (validPlanning && planningPurchaseAge > currentAge) {
    eventLabelMap.set(planningPurchaseAge, [
      ...(eventLabelMap.get(planningPurchaseAge) ?? []),
      '住宅購入',
    ])
  }

  if (willSell && sellHouseAge <= MAX_AGE) {
    eventLabelMap.set(sellHouseAge, [
      ...(eventLabelMap.get(sellHouseAge) ?? []),
      '住宅売却',
    ])
  }

  if (applyDecline && declineAge1 <= MAX_AGE && declineAge1 > currentAge) {
    eventLabelMap.set(declineAge1, [
      ...(eventLabelMap.get(declineAge1) ?? []),
      '収入減少①',
    ])
  }

  // 積立終了イベント（リタイア年齢より早く積立が終わる場合のみ表示）
  if (investmentEndAge < retirementAge && investmentEndAge > currentAge && investmentEndAge <= MAX_AGE) {
    eventLabelMap.set(investmentEndAge, [
      ...(eventLabelMap.get(investmentEndAge) ?? []),
      '積立終了',
    ])
  }
  if (applyDecline && declineAge2 <= MAX_AGE && declineAge2 > currentAge) {
    eventLabelMap.set(declineAge2, [
      ...(eventLabelMap.get(declineAge2) ?? []),
      '収入減少②',
    ])
  }
  if (postWork && postWorkEndAge > retirementAge && postWorkEndAge <= MAX_AGE) {
    eventLabelMap.set(postWorkEndAge, [
      ...(eventLabelMap.get(postWorkEndAge) ?? []),
      '就労終了',
    ])
  }

  if (data.expectParentCare && parentCareAge <= MAX_AGE) {
    eventLabelMap.set(parentCareAge, [
      ...(eventLabelMap.get(parentCareAge) ?? []),
      '親の介護',
    ])
  }

  if (data.expectSelfCare && selfCareAge <= MAX_AGE) {
    eventLabelMap.set(selfCareAge, [
      ...(eventLabelMap.get(selfCareAge) ?? []),
      '自身の介護',
    ])
  }

  for (const expense of data.majorExpenses) {
    if (!expense.enabled) continue
    const age    = parseInt(expense.targetAge)
    const amount = parseFloat(expense.amount) || 0
    if (isNaN(age) || age <= currentAge || age > MAX_AGE) continue
    // 金額が設定されている場合のみチャートにラベルを表示
    if (amount > 0) {
      eventLabelMap.set(age, [...(eventLabelMap.get(age) ?? []), expense.label])
    }
    eventAmountMap.set(age, (eventAmountMap.get(age) ?? 0) + amount)
  }

  // ── 年次計算 ─────────────────────────────────────────
  const yearlyData: YearlyDataPoint[] = []
  // 運用資産を流動性別に分離して追跡
  // liquidInvestmentBalance: DC 以外の流動性資産（60歳前でも取り崩し可能）
  // dcBalance: 確定拠出年金（DC_UNLOCK_AGE 歳まで取り崩し不可）
  let cashBalance             = currentCash
  let liquidInvestmentBalance = Math.max(0, currentInvestments - currentDC)
  let dcBalance               = currentDC
  let depletionAge: number | null = null
  let assetsAtRetirement = currentCash + currentInvestments
  let assetsAt80         = currentCash + currentInvestments

  // 起点（現在年齢）を追加
  yearlyData.push({
    age:          currentAge,
    assets:       Math.round(cashBalance + liquidInvestmentBalance + dcBalance),
    events:       [],
    isRetirement: false,
  })

  for (let age = currentAge + 1; age <= MAX_AGE; age++) {
    const year       = age - currentAge
    const inflFactor = Math.pow(1 + rInflat, year)

    // ① 運用リターン（流動性資産・DC ともに同じ利回りを適用）
    liquidInvestmentBalance *= (1 + rInvest)
    dcBalance               *= (1 + rInvest)

    // ② キャッシュイン → 現金へ加算（インフレ調整）
    // 退職金（リタイア年齢時に一括加算・名目額固定）
    if (age === retirementAge && severancePay > 0) {
      cashBalance += severancePay
    }
    // 本人収入 — 収入カーブを適用した多段階計算
    if (age <= retirementAge) {
      let incomeRate = 1.0
      if (applyDecline) {
        if (age >= declineAge2) {
          incomeRate = declineRate2
        } else if (age >= declineAge1) {
          incomeRate = declineRate1
        }
      }
      cashBalance += netAnnualIncome * incomeRate * inflFactor
    }
    // リタイア後の労働収入（postRetirementAge まで・インフレ調整なし）
    if (postWork && age > retirementAge && age <= postWorkEndAge) {
      cashBalance += postWorkAnnual
    }
    // 配偶者収入（配偶者がいて、かつ配偶者がリタイア前）
    if (data.hasSpouse && spouseCurrentAge > 0) {
      const spouseAgeThisYear = spouseCurrentAge + (age - currentAge)
      if (spouseAgeThisYear <= spouseRetirementAge) {
        cashBalance += netSpouseAnnualIncome * inflFactor
      }
    }
    // 公的年金（65 歳以降・名目額固定）
    if (age >= PENSION_START) {
      cashBalance += monthlyPension * 12
    }

    // ③ キャッシュアウト（生活費・インフレ調整）→ 現金から減算
    cashBalance -= monthlyExpenses * 12 * inflFactor
    // 子どもの成長に伴う追加生活費（中学生・高校生以上）
    let childLivingExtra = 0
    for (const child of data.children) {
      const childCurrentAge = parseInt(child.currentAge) || 0
      const childAge = childCurrentAge + (age - currentAge)
      if (childAge >= 13 && childAge <= 15) {
        childLivingExtra += CHILD_EXPENSE_JUNIOR_HIGH
      } else if (childAge >= 16 && childAge <= 22) {
        childLivingExtra += CHILD_EXPENSE_HIGH_SCHOOL
      }
    }
    if (childLivingExtra > 0) {
      cashBalance -= childLivingExtra * inflFactor
    }

    // ③-b iDeCo 税メリット加算（積立期間中のみ・法的上限は IDECO_MAX_AGE 歳・名目額固定）
    if (idecoEnabled && age <= Math.min(investmentEndAge, IDECO_MAX_AGE) && idecoTaxBenefit > 0) {
      cashBalance += idecoTaxBenefit
    }

    // ④ 積立移動（現金 → 運用資産）
    // investmentEndAge を超えた年齢では積立を停止し、既存残高の運用益のみ計算するフェーズに移行
    // ※ iDeCo・NISA の拠出額は monthlyInvestmentAmount（積立総額）の内数として扱う
    if (age <= investmentEndAge) {
      if (annualInvestmentTransfer > 0) {
        cashBalance              -= annualInvestmentTransfer
        liquidInvestmentBalance  += annualInvestmentTransfer
      }
    }

    // ⑤ 大きな支出（車・その他：ユーザーが入力した名目金額）→ 現金から減算
    cashBalance -= (eventAmountMap.get(age) ?? 0)

    // ⑥ 住宅関連 → 現金から減算
    // 売却年: 売却収入を加算し、住み替え費用を減算（この年はローン・維持費なし）
    if (willSell && age === sellHouseAge) {
      cashBalance += sellHousePrice
      cashBalance -= relocationCost
    }

    // 売却前のみローン返済・維持費を計上
    const housingCostsStopped = willSell && age >= sellHouseAge
    if (!housingCostsStopped) {
      if (data.housingStatus === 'planning' && validPlanning) {
        // 将来の購入か（購入年が現在より先）かで挙動を分岐
        const purchaseFuture = planningPurchaseAge > currentAge
        // ローン・維持費の開始年: 将来購入→購入年、過去/今年購入→シミュレーション初年度
        const loanStart = purchaseFuture ? planningPurchaseAge : currentAge + 1

        // 頭金（将来購入の場合のみ・購入年に一括）
        // 過去・当年購入は頭金支払い済みとみなして差し引かない
        if (purchaseFuture && age === planningPurchaseAge) {
          cashBalance -= planningDownPayment
        }
        // ローン返済（loanStart〜完済年の前年まで）
        if (age >= loanStart && age < planningLoanEndAge) {
          cashBalance -= planningAnnualPayment
        }
        // 住宅維持費（loanStart以降毎年・名目額固定）
        if (age >= loanStart) {
          cashBalance -= HOUSING_MAINTENANCE_ANNUAL
        }
      } else if (data.housingStatus === 'existing') {
        // ローン返済（今年から残り期間まで）
        if (age <= existingLoanEndAge) {
          cashBalance -= existingAnnualPayment
        }
        // 住宅維持費（今年から毎年・名目額固定）
        cashBalance -= HOUSING_MAINTENANCE_ANNUAL
      }
    }

    // 売却後: 家賃発生（売却した翌年から）
    if (willSell && age > sellHouseAge && postSellRentAnnual > 0) {
      cashBalance -= postSellRentAnnual
    }

    // ⑦ 介護費用 → 現金から減算（発生年から CARE_SPREAD_YEARS 年均等）
    if (data.expectParentCare && age >= parentCareAge && age < parentCareAge + CARE_SPREAD_YEARS) {
      cashBalance -= parentCareAnnual
    }
    if (data.expectSelfCare && age >= selfCareAge && age < selfCareAge + CARE_SPREAD_YEARS) {
      cashBalance -= selfCareAnnual
    }

    // ⑧ 教育費（子どもごとに当該年齢を算出して現金から減算）
    for (const child of data.children) {
      const childCurrentAge = parseInt(child.currentAge) || 0
      const childAge = childCurrentAge + (age - currentAge)
      const customAmount = parseFloat(child.customAnnualAmount) || 0
      cashBalance -= getChildAnnualEducationCost(child.educationCourse, childAge, customAmount)
    }

    // ⑨ 現金不足時の投資資産取り崩し（リバランス）
    // 現金残高がマイナスになった場合、投資資産を売却して補填する。
    // まず流動性資産から取り崩す。DC は DC_UNLOCK_AGE 歳以降のみ解禁。
    if (cashBalance < 0 && liquidInvestmentBalance > 0) {
      const withdrawal = Math.min(-cashBalance, liquidInvestmentBalance)
      liquidInvestmentBalance -= withdrawal
      cashBalance             += withdrawal
    }
    // DC は DC_UNLOCK_AGE 歳以降にアンロック（60歳まで取り崩し不可）
    if (cashBalance < 0 && age >= DC_UNLOCK_AGE && dcBalance > 0) {
      const withdrawal = Math.min(-cashBalance, dcBalance)
      dcBalance    -= withdrawal
      cashBalance  += withdrawal
    }

    const totalAssets = cashBalance + liquidInvestmentBalance + dcBalance

    // 資産枯渇チェック
    if (totalAssets < 0 && depletionAge === null) {
      depletionAge = age
    }

    yearlyData.push({
      age,
      assets:       Math.round(totalAssets),
      events:       eventLabelMap.get(age) ?? [],
      isRetirement: age === retirementAge,
    })

    if (age === retirementAge) assetsAtRetirement = totalAssets
    if (age === 80)            assetsAt80         = totalAssets
  }

  // 月間収支 = 世帯手取り月収（現在年齢時点・収入カーブ適用）− 生活費
  const currentIncomeRate = (() => {
    if (!applyDecline) return 1.0
    if (currentAge >= declineAge2) return declineRate2
    if (currentAge >= declineAge1) return declineRate1
    return 1.0
  })()
  const monthlyBalance =
    (netAnnualIncome * currentIncomeRate) / 12 +
    (data.hasSpouse ? netSpouseAnnualIncome / 12 : 0) -
    monthlyExpenses

  return {
    yearlyData,
    currentAge,
    retirementAge,
    assetsAtRetirement: Math.round(assetsAtRetirement),
    assetsAt80:         Math.round(assetsAt80),
    monthlyBalance:     Math.round(monthlyBalance * 10) / 10,
    depletionAge,
  }
}

// ─── フォーマットユーティリティ ─────────────────────────

export function formatMoney(value: number, opts?: { decimals?: number }): string {
  const abs  = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  const dec  = opts?.decimals ?? 1
  if (abs >= 10000) {
    return `${sign}${(abs / 10000).toFixed(dec)}億円`
  }
  return `${sign}${abs.toLocaleString()}万円`
}

export function formatYAxis(value: number): string {
  if (value === 0) return '0'
  const abs  = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(1)}億`
  if (abs >= 1000)  return `${sign}${(abs / 1000).toFixed(0)}千万`
  return `${sign}${abs}万`
}
