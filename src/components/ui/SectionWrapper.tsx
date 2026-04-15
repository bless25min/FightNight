import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  id: string
  children: ReactNode
  className?: string
  fullWidth?: boolean
  padding?: string
}

export function SectionWrapper({
  id,
  children,
  className = '',
  fullWidth = false,
  padding = 'py-20 md:py-28',
}: Props) {
  return (
    <motion.section
      id={id}
      data-section={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={`${padding} ${fullWidth ? '' : 'max-w-6xl mx-auto px-5 sm:px-8'} ${className}`}
    >
      {children}
    </motion.section>
  )
}
