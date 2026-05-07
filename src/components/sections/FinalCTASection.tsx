import { motion } from 'framer-motion'
import { finalCtaContent, siteConfig } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'
import { Button } from '../ui/Button'
import { useTracking } from '../../hooks/useTracking'

export function FinalCTASection() {
  const { trackHeroCta, trackLineCta } = useTracking()

  return (
    <SectionWrapper id="final-cta" className="relative text-center">
      {/* 背景光暈 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-neon/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blaze/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold"
        >
          {finalCtaContent.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-3 md:mt-4 text-base sm:text-lg md:text-xl text-mist"
        >
          {finalCtaContent.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Button
            size="lg"
            href={siteConfig.ticketUrl}
            onClick={() => trackHeroCta()}
            data-cta="final-primary"
          >
            {finalCtaContent.primaryCta}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6"
        >
          <Button
            variant="ghost"
            href={siteConfig.lineUrl}
            onClick={() => trackLineCta()}
            data-cta="line"
          >
            {finalCtaContent.ghostCta}
          </Button>
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
