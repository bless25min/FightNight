import { motion } from 'framer-motion'
import { identityContent } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'

export function IdentitySection() {
  return (
    <SectionWrapper id="identity" className="relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blaze/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative text-center max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-2xl sm:text-3xl md:text-5xl font-heading font-bold leading-tight"
        >
          {identityContent.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-3 md:mt-4 text-xl sm:text-2xl md:text-3xl font-heading font-semibold text-gradient"
        >
          {identityContent.subtitle}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-5 md:mt-8 text-base sm:text-lg text-mist leading-relaxed"
        >
          {identityContent.description}
        </motion.p>
      </div>
    </SectionWrapper>
  )
}
