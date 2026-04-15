import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  glowColor?: 'neon' | 'blaze' | 'volt'
  hover?: boolean
}

const glowMap = {
  neon: 'hover:shadow-[0_0_30px_rgba(191,90,242,0.2)] hover:border-neon/30',
  blaze: 'hover:shadow-[0_0_30px_rgba(255,59,92,0.2)] hover:border-blaze/30',
  volt: 'hover:shadow-[0_0_30px_rgba(0,212,255,0.2)] hover:border-volt/30',
}

export function Card({
  children,
  className = '',
  glowColor = 'neon',
  hover = true,
}: Props) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ duration: 0.3 }}
      className={`glass rounded-2xl p-6 md:p-8 transition-all duration-300 ${hover ? glowMap[glowColor] : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
