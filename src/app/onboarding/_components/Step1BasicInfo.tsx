'use client'

import { Calendar, MapPin, Users, Baby, User, Heart } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { useOnboardingStore } from '@/store/useOnboardingStore'

// ─── 都道府県リスト ───────────────────────────────────────

const PREFECTURES = [
  '北海道',
  '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県',
  '沖縄県',
] as const

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

      {/* 居住都道府県 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-navy mb-2.5">
          <MapPin className="w-4 h-4" />
          居住都道府県
        </label>
        <div className="relative">
          <select
            value={data.prefecture}
            onChange={(e) => setField('prefecture', e.target.value)}
            className={[
              'w-full appearance-none rounded-xl border-2 px-4 py-3 pr-10 text-sm',
              'bg-white outline-none transition-colors duration-150',
              data.prefecture
                ? 'border-navy text-navy font-medium'
                : 'border-border-base text-muted',
              'focus:border-navy',
            ].join(' ')}
          >
            <option value="">選択してください</option>
            {PREFECTURES.map((pref) => (
              <option key={pref} value={pref}>{pref}</option>
            ))}
          </select>
          {/* カスタム矢印 */}
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <p className="text-xs text-muted mt-1.5">
          生活費・年収の初期値に反映されます（後から変更可能）
        </p>
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
