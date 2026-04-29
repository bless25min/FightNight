import { motion } from 'framer-motion'

type Props = {
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({
  title,
  subtitle,
  align = 'center',
  className = '',
}: Props) {
  const alignClass = align === 'center' ? 'text-center' : 'text-left'

  return (
    <div className={`mb-7 md:mb-16 ${alignClass} ${className}`}>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold tracking-tight"
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-3 md:mt-4 text-base sm:text-lg md:text-xl text-mist max-w-2xl mx-auto"
        >
          {subtitle}
        </motion.p>
      )}

      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className={`section-divider mt-4 md:mt-6 ${align === 'left' ? 'mx-0' : ''}`}
      />
    </div>
  )
}
