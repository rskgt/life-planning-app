import type { Child, OnboardingData } from '@/store/useOnboardingStore'
import { calculateNetAnnualIncome } from './calculateSimulation'

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

// ─── 毎月の生活費推計（総務省「家計調査」参考） ──────────────────────

/**
 * 家族構成から毎月の基本生活費を推計する（万円/月）。
 */
function estimateMonthlyExpenses(hasSpouse: boolean, numChildren: number): number {
  let base = hasSpouse ? 24 : 18
  if (numChildren >= 1) base += 4
  if (numChildren >= 2) base += 4
  if (numChildren >= 3) base += 4
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
  age:       number,
  hasSpouse: boolean,
  spouseAge: number,
  children:  Child[],
): Partial<OnboardingData> {
  const numChildren = children.length

  // 年収
  const annualIncome       = estimateAnnualIncome(age)
  const spouseAnnualIncome = hasSpouse
    ? Math.round(estimateAnnualIncome(spouseAge) * 0.75)
    : 0

  // 資産
  const currentCash        = estimateCash(age)
  const currentInvestments = estimateInvestments(age)

  // 生活費・積立
  const monthlyExpenses = estimateMonthlyExpenses(hasSpouse, numChildren)
  const netAnnual       = calculateNetAnnualIncome(annualIncome)
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
