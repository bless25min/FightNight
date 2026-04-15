import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  variant?: 'default' | 'highlight' | 'gold'
  className?: string
}

const variantStyles = {
  default: 'bg-pearl/10 text-pearl/80 border-pearl/10',
  highlight: 'bg-neon/15 text-neon border-neon/30',
  gold: 'bg-gold/15 text-gold border-gold/30',
}

export function Badge({ children, variant = 'default', className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-heading font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
