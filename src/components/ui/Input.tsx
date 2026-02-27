'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 入力欄の右に表示する単位ラベル（例: 歳, 万円） */
  suffix?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', suffix, ...props }, ref) => (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        className={[
          'flex-1 px-4 py-3 rounded-lg border-2 bg-surface',
          'text-navy placeholder:text-subtle text-sm',
          'border-border-base transition-colors duration-150',
          'focus:outline-none focus:border-navy',
          className,
        ].join(' ')}
        {...props}
      />
      {suffix && (
        <span className="text-sm text-navy shrink-0">{suffix}</span>
      )}
    </div>
  )
)

Input.displayName = 'Input'

export { Input }
