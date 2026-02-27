'use client'

import { TrendingUp, Flame } from 'lucide-react'

// ─── 個別スライダー ──────────────────────────────────────

interface RateSliderProps {
  icon:        React.ElementType
  label:       string
  description: string
  value:       number
  min:         number
  max:         number
  step:        number
  color:       string        // hex: thumb border / fill color
  trackColor:  string        // hex: unfilled track color
  /** バッジに表示する単位（デフォルト '%'） */
  unit?:       string
  /** バッジの小数点桁数（デフォルト 1） */
  decimals?:   number
  onChange:    (v: number) => void
}

function RateSlider({
  icon: Icon,
  label,
  description,
  value,
  min,
  max,
  step,
  color,
  trackColor,
  unit = '%',
  decimals = 1,
  onChange,
}: RateSliderProps) {
  const pct = ((value - min) / (max - min)) * 100

  // トラック背景をグラデーションで "fill" 表現
  const trackBackground = `linear-gradient(
    to right,
    ${color} ${pct}%,
    ${trackColor} ${pct}%
  )`

  return (
    <div className="space-y-2">
      {/* ヘッダー行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <div>
            <p className="text-sm font-medium text-navy">{label}</p>
            <p className="text-[11px] text-muted">{description}</p>
          </div>
        </div>

        {/* 現在値バッジ */}
        <div
          className="min-w-[52px] text-center px-2.5 py-1 rounded-full text-sm font-bold text-white tabular-nums"
          style={{ backgroundColor: color }}
        >
          {value.toFixed(decimals)}{unit}
        </div>
      </div>

      {/* スライダー本体 */}
      <div className="relative flex items-center h-8">
        {/* カスタムトラック */}
        <div
          className="absolute w-full h-1.5 rounded-full"
          style={{ background: trackBackground }}
        />

        {/* カスタムサム（装飾のみ・pointer-events なし） */}
        <div
          className="absolute w-5 h-5 rounded-full bg-white shadow-md pointer-events-none"
          style={{
            left:        `calc(${pct}% - 10px)`,
            border:      `2.5px solid ${color}`,
            transition:  'left 0s',
          }}
        />

        {/* インタラクティブな input（透明・最前面） */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute w-full cursor-pointer"
          style={{
            opacity: 0,
            height: '32px',
          }}
          aria-label={label}
        />
      </div>

      {/* 目盛りラベル */}
      <div className="flex justify-between text-[11px] text-subtle px-0.5">
        <span>{min}{unit}</span>
        <span>{((max + min) / 2).toFixed(decimals)}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

// ─── RateAdjuster（公開コンポーネント） ─────────────────

interface RateAdjusterProps {
  investmentRate:     number
  inflationRate:      number
  onInvestmentChange: (v: number) => void
  onInflationChange:  (v: number) => void
}

export function RateAdjuster({
  investmentRate,
  inflationRate,
  onInvestmentChange,
  onInflationChange,
}: RateAdjusterProps) {
  return (
    <div className="space-y-5">
      {/* 運用利回り */}
      <RateSlider
        icon={TrendingUp}
        label="想定運用利回り"
        description="運用資産（株式・投資信託など）の年間リターン"
        value={investmentRate}
        min={0}
        max={10}
        step={0.5}
        decimals={1}
        color="#003366"          /* navy */
        trackColor="#e2e8f0"
        onChange={onInvestmentChange}
      />

      <div className="border-t border-border-base" />

      {/* インフレ率 */}
      <RateSlider
        icon={Flame}
        label="想定インフレ率"
        description="生活費・収入が毎年上昇する割合"
        value={inflationRate}
        min={0}
        max={5}
        step={0.25}
        decimals={1}
        color="#d4af37"          /* gold */
        trackColor="#e2e8f0"
        onChange={onInflationChange}
      />

      {/* 注記 */}
      <p className="text-[11px] text-subtle leading-relaxed">
        ※ スライダーを動かすとグラフがリアルタイムで更新されます。<br />
        利回りは「運用資産」部分にのみ適用されます（現金預金は利回り 0%）。<br />
        インフレ率は手取り収入・生活費の双方に適用されます（住宅・大きな支出は名目額のまま）。
      </p>
    </div>
  )
}
