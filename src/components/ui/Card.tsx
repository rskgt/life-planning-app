import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: 'navy' | 'gold' | 'none'
}

function Card({ className = '', accent = 'none', children, ...props }: CardProps) {
  const accentStyles = {
    navy: 'border-l-4 border-navy',
    gold: 'border-l-4 border-gold',
    none: '',
  }

  return (
    <div
      className={`bg-surface rounded-2xl shadow-lg ${accentStyles[accent]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export { Card }
