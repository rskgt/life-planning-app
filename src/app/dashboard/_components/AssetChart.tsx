'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts'
import { YearlyDataPoint, formatMoney, formatYAxis } from '@/lib/calculateSimulation'

// ─── カスタムツールチップ ────────────────────────────────

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: YearlyDataPoint }>
}) {
  if (!active || !payload?.length) return null
  const d          = payload[0].payload
  const isNegative = d.assets < 0
  const hasEvents  = d.events.length > 0

  return (
    <div
      className="bg-white rounded-xl shadow-xl p-3 text-sm min-w-[150px] border-2"
      style={{ borderColor: hasEvents ? '#d4af37' : '#003366' }}
    >
      <p className="font-semibold text-navy mb-1.5">{d.age} 歳</p>
      <p className={`font-medium ${isNegative ? 'text-red-500' : 'text-navy'}`}>
        {formatMoney(d.assets)}
      </p>
      {hasEvents && (
        <div className="mt-2 pt-2 border-t border-border-base space-y-0.5">
          {d.events.map((ev) => (
            <p key={ev} className="text-xs font-medium" style={{ color: '#d4af37' }}>
              ● {ev}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── カスタムドット（イベント年のみ） ───────────────────

interface DotProps {
  cx?: number
  cy?: number
  payload?: YearlyDataPoint
}

function EventDot({ cx, cy, payload }: DotProps) {
  if (!payload?.events.length) return null
  const isRetirement = payload.isRetirement
  const r = isRetirement ? 8 : 6
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={isRetirement ? '#003366' : '#d4af37'}
      stroke="#ffffff"
      strokeWidth={2}
    />
  )
}

// ─── コンポーネント ──────────────────────────────────────

interface AssetChartProps {
  data:           YearlyDataPoint[]
  retirementAge:  number
  depletionAge:   number | null
}

export function AssetChart({ data, retirementAge, depletionAge }: AssetChartProps) {
  if (!data.length) return null

  const currentAge = data[0].age
  const maxAssets  = Math.max(...data.map((d) => d.assets))
  const minAssets  = Math.min(...data.map((d) => d.assets))

  // Y 軸ドメイン：上下にパディングを設ける
  const yMax = Math.ceil(Math.max(maxAssets * 1.12, 500)  / 500) * 500
  const yMin = depletionAge !== null
    ? Math.floor(Math.min(minAssets * 1.1, -200) / 500) * 500
    : 0

  // X 軸: 現在年齢 + 5 年ごとのティック
  const xTicks: number[] = [currentAge]
  let tick = Math.ceil(currentAge / 5) * 5
  if (tick === currentAge) tick += 5
  while (tick <= 100) { xTicks.push(tick); tick += 5 }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 16, right: 20, left: 8, bottom: 4 }}>
        <defs>
          {/* Navy グラデーション（資産プラス領域） */}
          <linearGradient id="gradAsset" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#003366" stopOpacity={0.16} />
            <stop offset="95%" stopColor="#003366" stopOpacity={0.01} />
          </linearGradient>
          {/* Red グラデーション（資産マイナス領域） */}
          <linearGradient id="gradDeficit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.10} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e2e8f0"
          vertical={false}
        />

        <XAxis
          dataKey="age"
          ticks={xTicks}
          tickFormatter={(v: number) => `${v}歳`}
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />

        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          width={72}
          domain={[yMin, yMax]}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#003366', strokeWidth: 1, strokeOpacity: 0.25 }}
        />

        {/* リタイア縦ライン */}
        <ReferenceLine
          x={retirementAge}
          stroke="#d4af37"
          strokeDasharray="5 4"
          strokeWidth={1.5}
          label={{
            value: `${retirementAge}歳`,
            position: 'insideTopRight',
            fill: '#d4af37',
            fontSize: 10,
            fontWeight: 700,
            offset: 6,
          }}
        />

        {/* 資産ゼロライン（枯渇する場合のみ） */}
        {depletionAge !== null && (
          <ReferenceLine
            y={0}
            stroke="#ef4444"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{
              value: '資産ゼロ',
              position: 'insideTopLeft',
              fill: '#ef4444',
              fontSize: 10,
              fontWeight: 700,
            }}
          />
        )}

        {/* メインエリア（スライダー連動でリアルタイム更新のためアニメーション無効） */}
        <Area
          type="monotone"
          dataKey="assets"
          stroke="#003366"
          strokeWidth={2.5}
          fill="url(#gradAsset)"
          isAnimationActive={false}
          dot={(props: DotProps) => <EventDot key={`dot-${props.payload?.age}`} {...props} />}
          activeDot={{ r: 5, fill: '#003366', stroke: '#ffffff', strokeWidth: 2 }}
        />

        {/* 枯渇ポイントのマーカー */}
        {depletionAge !== null && (() => {
          const dp = data.find((d) => d.age === depletionAge)
          return dp ? (
            <ReferenceDot
              x={dp.age}
              y={0}
              r={5}
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth={2}
              label={{
                value: `${dp.age}歳`,
                position: 'top',
                fill: '#ef4444',
                fontSize: 10,
                fontWeight: 700,
              }}
            />
          ) : null
        })()}
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── 凡例コンポーネント ──────────────────────────────────

interface ChartLegendProps {
  depletionAge: number | null
}

export function ChartLegend({ depletionAge }: ChartLegendProps) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-4 border-t border-border-base">
      {/* 資産推移ライン */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-0.5 bg-navy rounded-full" />
        <span className="text-xs text-muted">資産推移</span>
      </div>
      {/* リタイアライン */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-0" style={{
          borderTop: '2px dashed #d4af37',
        }} />
        <span className="text-xs text-muted">リタイア</span>
      </div>
      {/* ライフイベント */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: '#d4af37' }} />
        <span className="text-xs text-muted">ライフイベント</span>
      </div>
      {/* 資産ゼロライン（枯渇する場合のみ） */}
      {depletionAge !== null && (
        <div className="flex items-center gap-2">
          <div className="w-7 h-0" style={{
            borderTop: '2px dashed #ef4444',
          }} />
          <span className="text-xs text-muted">資産ゼロライン</span>
        </div>
      )}
    </div>
  )
}
