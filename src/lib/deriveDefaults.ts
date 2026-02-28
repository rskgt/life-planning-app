import type { Child, OnboardingData } from '@/store/useOnboardingStore'
import { calculateNetAnnualIncome } from './calculateSimulation'

// ─── 都道府県別 地域係数 ──────────────────────────────────────────────────
//
// 生活費倍率: 総務省「消費者物価地域差指数」2022 ＋ 住居費実勢を加味
//   東京の住居費は全国平均比 2〜3倍のため CPI 指数より大きめに設定
// 年収倍率 : 厚生労働省「賃金構造基本統計調査」2023
//   全国平均 432万円を 1.00 として各都道府県を算出（全産業・男女計）
//
// ティア定義:
//   tokyo      : 東京都                                           expense×1.35 / income×1.30
//   urban_high : 神奈川県                                         expense×1.20 / income×1.14
//   urban      : 大阪府・愛知県                                   expense×1.10 / income×1.05
//   suburban   : 埼玉・千葉・京都・兵庫・静岡・広島・滋賀・奈良   expense×1.04 / income×1.00
//   standard   : 宮城・福岡・茨城・栃木・群馬・新潟ほか地方中核    expense×0.97 / income×0.93
//   rural      : 北海道・東北・四国・山陰・九州（福岡除く）        expense×0.93 / income×0.88
//   okinawa    : 沖縄県                                           expense×0.90 / income×0.80

type PrefectureTier = 'tokyo' | 'urban_high' | 'urban' | 'suburban' | 'standard' | 'rural' | 'okinawa'

interface TierMultipliers {
  income:  number // 年収倍率（全国平均比）
  expense: number // 生活費倍率（全国平均比）
}

const TIER_MULTIPLIERS: Record<PrefectureTier, TierMultipliers> = {
  tokyo:      { income: 1.30, expense: 1.35 },
  urban_high: { income: 1.14, expense: 1.20 },
  urban:      { income: 1.05, expense: 1.10 },
  suburban:   { income: 1.00, expense: 1.04 },
  standard:   { income: 0.93, expense: 0.97 },
  rural:      { income: 0.88, expense: 0.93 },
  okinawa:    { income: 0.80, expense: 0.90 },
}

const PREFECTURE_TIER: Record<string, PrefectureTier> = {
  // 東京圏
  '東京都': 'tokyo',
  // 首都圏（高コスト）
  '神奈川県': 'urban_high',
  // 大都市
  '大阪府': 'urban',
  '愛知県': 'urban',
  // 近郊都市
  '埼玉県': 'suburban',
  '千葉県': 'suburban',
  '京都府': 'suburban',
  '兵庫県': 'suburban',
  '静岡県': 'suburban',
  '広島県': 'suburban',
  '滋賀県': 'suburban',
  '奈良県': 'suburban',
  // 地方中核都市（標準）
  '宮城県': 'standard',
  '福島県': 'standard',
  '茨城県': 'standard',
  '栃木県': 'standard',
  '群馬県': 'standard',
  '新潟県': 'standard',
  '富山県': 'standard',
  '石川県': 'standard',
  '長野県': 'standard',
  '岐阜県': 'standard',
  '三重県': 'standard',
  '和歌山県': 'standard',
  '岡山県': 'standard',
  '山梨県': 'standard',
  '福岡県': 'standard',
  // 地方（低コスト）
  '北海道': 'rural',
  '青森県': 'rural',
  '岩手県': 'rural',
  '秋田県': 'rural',
  '山形県': 'rural',
  '福井県': 'rural',
  '鳥取県': 'rural',
  '島根県': 'rural',
  '山口県': 'rural',
  '徳島県': 'rural',
  '香川県': 'rural',
  '愛媛県': 'rural',
  '高知県': 'rural',
  '佐賀県': 'rural',
  '長崎県': 'rural',
  '熊本県': 'rural',
  '大分県': 'rural',
  '宮崎県': 'rural',
  '鹿児島県': 'rural',
  // 沖縄
  '沖縄県': 'okinawa',
}

function getPrefectureMultipliers(prefecture: string): TierMultipliers {
  const tier = PREFECTURE_TIER[prefecture] ?? 'standard'
  return TIER_MULTIPLIERS[tier]
}

// ─── 年収推計（国税庁「民間給与実態統計調査」参考・万円/年） ──────────

/**
 * 年齢から額面年収を推計する。
 * 正規雇用・会社員を想定したモデル値。
 */
function estimateAnnualIncome(age: number): number {
  if (age < 25) return 300
  if (age < 30) return 380
  if (age < 35) return 450
  if (age < 40) return 520
  if (age < 45) return 580
  if (age < 50) return 640
  if (age < 55) return 660
  if (age < 60) return 650
  if (age < 65) return 500
  return 0 // 65歳以上はリタイア想定
}

// ─── 現金預金推計（金融広報中央委員会「家計の金融行動に関する世論調査」参考） ──

/**
 * 年齢から現金預金残高を推計する（万円）。
 */
function estimateCash(age: number): number {
  if (age < 30) return 100
  if (age < 40) return 200
  if (age < 50) return 400
  if (age < 60) return 700
  return 1000
}

// ─── 運用資産推計（同調査参考） ──────────────────────────────────────

/**
 * 年齢から運用資産残高を推計する（万円）。
 * NISA・DC・特定口座などの合計。
 */
function estimateInvestments(age: number): number {
  if (age < 30) return 30
  if (age < 40) return 100
  if (age < 50) return 250
  if (age < 60) return 500
  return 800
}

// ─── 毎月の生活費推計（総務省「家計調査」世帯主年収5分位別・参考） ──────

/**
 * 家族構成と世帯手取り月収から毎月の基本生活費（娯楽費含む）を推計する（万円/月）。
 *
 * 総務省「家計調査年報」2023 年収5分位別消費支出（二人以上世帯）をベースに、
 * 単身世帯は同調査の単身データ（二人以上の約62%）を参考にモデル化。
 *   第1五分位（〜349万）: ≒22万 / 第2（350〜525万）: ≒26万
 *   第3（526〜709万）: ≒29万 / 第4（710〜999万）: ≒32万 / 第5（1000万〜）: ≒39万
 * 子ども1人につき+3万円（食費・被服・習い事など）
 */
function estimateMonthlyExpenses(
  hasSpouse: boolean,
  numChildren: number,
  householdNetMonthly: number, // 世帯手取り月収（万円）
): number {
  let base: number
  if (hasSpouse) {
    // 二人以上世帯
    if      (householdNetMonthly < 30) base = 22
    else if (householdNetMonthly < 40) base = 25
    else if (householdNetMonthly < 50) base = 28
    else if (householdNetMonthly < 65) base = 31
    else                               base = 36
  } else {
    // 単身世帯（二人以上の約62%水準）
    if      (householdNetMonthly < 20) base = 14
    else if (householdNetMonthly < 25) base = 17
    else if (householdNetMonthly < 30) base = 19
    else if (householdNetMonthly < 40) base = 22
    else                               base = 25
  }
  base += numChildren * 3
  return base
}

// ─── 公的年金推計（厚生労働省「令和4年度 厚生年金保険・国民年金事業の概況」参考） ──

/**
 * 家族構成・配偶者収入から世帯月額の公的年金を推計する（万円/月、65歳以降）。
 */
function estimateMonthlyPension(hasSpouse: boolean, spouseIncome: number): number {
  if (!hasSpouse) return 15          // 単身（会社員）
  if (spouseIncome >= 100) return 25 // 共働きモデル
  return 21                          // 専業主婦/夫モデル
}

// ─── メイン関数 ──────────────────────────────────────────────────────

/**
 * 5つの基本情報（年齢・配偶者・子供）から、シミュレーションに必要な
 * すべての項目を自動設定する。
 *
 * 自動設定のルール:
 *
 * [年収]
 *   本人：年齢ベースで推計（国税庁統計参考）
 *   配偶者：配偶者年齢ベースで推計 × 0.75（男女賃金差の平均）
 *
 * [資産]
 *   現金預金：年齢ベースで推計（金融広報中央委員会調査参考）
 *   運用資産：年齢ベースで推計（同調査参考）
 *   DC・NISA残高：0円（内訳なし）
 *
 * [支出]
 *   生活費：家族構成で決定（単身18万・夫婦24万・子+4万/人）
 *   積立額：手取り年収の10%を月割り（最低1万円）
 *
 * [老後]
 *   リタイア年齢：65歳
 *   配偶者リタイア年齢：65歳
 *   公的年金：家族構成で決定（単身15万・共働き25万・専業主婦21万）
 *   退職金：1,000万円（60歳未満の場合）
 *
 * [その他]
 *   住宅・介護・収入カーブ・iDeCo・NISA等：すべて無効（ユーザーが後から設定）
 */
export function deriveDefaultsFromBasicInfo(
  age:        number,
  hasSpouse:  boolean,
  spouseAge:  number,
  children:   Child[],
  prefecture: string = '',
): Partial<OnboardingData> {
  const numChildren = children.length
  const mult        = getPrefectureMultipliers(prefecture)

  // 年収（都道府県別倍率を適用）
  const annualIncome       = Math.round(estimateAnnualIncome(age) * mult.income)
  const spouseAnnualIncome = hasSpouse
    ? Math.round(estimateAnnualIncome(spouseAge) * 0.75 * mult.income)
    : 0

  // 資産（地域差は小さいため倍率は適用しない）
  const currentCash        = estimateCash(age)
  const currentInvestments = estimateInvestments(age)

  // 生活費・積立（都道府県別倍率を適用）
  const netAnnual           = calculateNetAnnualIncome(annualIncome)
  const spouseNetAnnual     = hasSpouse ? calculateNetAnnualIncome(spouseAnnualIncome) : 0
  const householdNetMonthly = Math.round((netAnnual + spouseNetAnnual) / 12 * 10) / 10
  const monthlyExpenses     = Math.round(
    estimateMonthlyExpenses(hasSpouse, numChildren, householdNetMonthly) * mult.expense
  )
  // 手取りの10%を月割り（最低1万円）
  const monthlyInvestmentAmount = Math.max(1, Math.round((netAnnual * 0.10 / 12) * 10) / 10)

  // 年金・退職金
  const monthlyPension = estimateMonthlyPension(hasSpouse, spouseAnnualIncome)
  const severancePay   = age < 65 ? 1000 : 0

  return {
    // 収入
    annualIncome:         String(annualIncome),
    spouseAnnualIncome:   hasSpouse ? String(spouseAnnualIncome) : '',
    spouseRetirementAge:  '65',

    // 資産
    currentCash:          String(currentCash),
    currentInvestments:   String(currentInvestments),
    currentDC:            '0',
    currentNISABalance:   '0',

    // 支出・積立
    monthlyExpenses:          String(monthlyExpenses),
    monthlyInvestmentAmount:  String(monthlyInvestmentAmount),
    autoStopInvestment:       true,
    customInvestmentEndAge:   '',

    // iDeCo・NISA
    idecoEnabled:       false,
    idecoMonthlyAmount: '2.3',
    nisaEnabled:        false,
    nisaAnnualAmount:   '20',

    // 老後
    retirementAge:   '65',
    monthlyPension:  String(monthlyPension),
    pensionStartAge: '65',
    severancePay:    String(severancePay),

    // 住宅・介護・その他：オフ（購入予定年齢は現在年齢+3年後か35歳の遅い方）
    housingStatus:       'none',
    housingPurchaseAge:  String(Math.max(35, age + 3)),
    applyIncomeDecline:  false,
    postRetirementWork:  false,
    expectParentCare:    false,
    expectSelfCare:      false,
  }
}

// ─── 自動設定ルールのサマリー（UI表示用） ──────────────────────────────

export interface DeriveSummaryItem {
  label: string
  value: string
}

/**
 * 自動設定された値のサマリーを返す（シミュレーション開始後の確認表示用）。
 */
export function buildDeriveSummary(
  derived: Partial<OnboardingData>,
  hasSpouse: boolean,
): DeriveSummaryItem[] {
  const items: DeriveSummaryItem[] = [
    { label: '年収（本人）', value: `${derived.annualIncome}万円/年` },
  ]
  if (hasSpouse && derived.spouseAnnualIncome) {
    items.push({ label: '配偶者の年収', value: `${derived.spouseAnnualIncome}万円/年` })
  }
  items.push(
    { label: '現金預金',   value: `${derived.currentCash}万円` },
    { label: '運用資産',   value: `${derived.currentInvestments}万円` },
    { label: '生活費',     value: `${derived.monthlyExpenses}万円/月` },
    { label: '毎月の積立', value: `${derived.monthlyInvestmentAmount}万円/月` },
    { label: '公的年金',   value: `${derived.monthlyPension}万円/月` },
    { label: '退職金',     value: `${Number(derived.severancePay).toLocaleString()}万円` },
  )
  return items
}
