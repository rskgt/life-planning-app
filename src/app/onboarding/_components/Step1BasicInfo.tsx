'use client'

import { Calendar, Users, Baby, User, Heart } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { useOnboardingStore } from '@/store/useOnboardingStore'

// ─── ToggleGroup（内部専用）────────────────────────────

interface ToggleOption {
  value: string
  label: string
}

function ToggleGroup({
  value,
  options,
  onChange,
}: {
  value: string
  options: ToggleOption[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            'px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-200',
            value === opt.value
              ? 'bg-navy text-white border-navy shadow-sm'
              : 'bg-white text-muted border-border-base hover:border-navy hover:text-navy',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── コンポーネント ──────────────────────────────────────

export function Step1BasicInfo() {
  const { data, setField, setChildrenCount, updateChild } = useOnboardingStore()


  // children 配列長から表示用の count 値を導出（3人以上は '3' に統一）
  const countValue = data.children.length >= 3 ? '3' : String(data.children.length)

  return (
    <div className="space-y-7">
      {/* 現在の年齢 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-navy mb-2.5">
          <Calendar className="w-4 h-4" />
          現在の年齢
        </label>
        <Input
          type="number"
          value={data.age}
          onChange={(e) => setField('age', e.target.value)}
          placeholder="30"
          suffix="歳"
          min="18"
          max="80"
        />
      </div>

      {/* 配偶者の有無 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-navy mb-3">
          <Users className="w-4 h-4" />
          配偶者の有無
        </label>
        <ToggleGroup
          value={data.hasSpouse ? 'yes' : 'no'}
          onChange={(v) => setField('hasSpouse', v === 'yes')}
          options={[
            { value: 'yes', label: '配偶者あり' },
            { value: 'no',  label: '配偶者なし' },
          ]}
        />
      </div>

      {/* 配偶者の年齢（配偶者ありの場合のみ） */}
      {data.hasSpouse && (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-navy mb-2.5">
            <Heart className="w-4 h-4" />
            配偶者の現在の年齢
          </label>
          <Input
            type="number"
            value={data.spouseAge}
            onChange={(e) => setField('spouseAge', e.target.value)}
            placeholder="30"
            suffix="歳"
            min="18"
            max="80"
          />
        </div>
      )}

      {/* 子供の人数 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-navy mb-3">
          <Baby className="w-4 h-4" />
          子供の人数
        </label>
        <ToggleGroup
          value={countValue}
          onChange={(v) => setChildrenCount(parseInt(v))}
          options={[
            { value: '0', label: '0人' },
            { value: '1', label: '1人' },
            { value: '2', label: '2人' },
            { value: '3', label: '3人以上' },
          ]}
        />
      </div>

      {/* 子どもごとの現在の年齢入力 */}
      {data.children.map((child, index) => (
        <div key={child.id}>
          <label className="flex items-center gap-2 text-sm font-medium text-navy mb-2.5">
            <User className="w-4 h-4" />
            {index + 1}人目のお子さんの現在の年齢
          </label>
          <Input
            type="number"
            value={child.currentAge}
            onChange={(e) => updateChild(child.id, { currentAge: e.target.value })}
            placeholder="5"
            suffix="歳"
            min="0"
            max="25"
          />
        </div>
      ))}
    </div>
  )
}
