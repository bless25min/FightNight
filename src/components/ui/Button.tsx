import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type Props = {
  children: ReactNode
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  href?: string
  target?: string
  rel?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  'data-cta'?: string
  'data-ticket'?: string
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-blaze to-neon text-white font-semibold shadow-lg shadow-blaze/25 hover:shadow-blaze/40 hover:brightness-110',
  secondary:
    'border border-pearl/20 bg-pearl/5 text-pearl font-medium hover:bg-pearl/10 hover:border-pearl/30',
  ghost: 'text-mist font-medium hover:text-pearl',
}

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  href,
  target,
  rel,
  type = 'button',
  disabled = false,
  className = '',
  ...props
}: Props) {
  const classes = `interaction-hint inline-flex items-center justify-center gap-2 rounded-xl font-heading tracking-wide transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-55 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

  if (href) {
    return (
      <motion.a
        href={href}
        target={target ?? (href.startsWith('http') ? '_blank' : undefined)}
        rel={rel ?? (href.startsWith('http') ? 'noopener noreferrer' : undefined)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={classes}
        onClick={onClick}
        data-interaction-hint
        aria-disabled={disabled || undefined}
        {...props}
      >
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={classes}
      data-interaction-hint
      {...props}
    >
      {children}
    </motion.button>
  )
}
