import { motion } from 'framer-motion'
import { heroContent, siteConfig } from '../../data/landingContent'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useTracking } from '../../hooks/useTracking'

export function HeroSection() {
  const { trackHeroCta, trackSecondaryCta } = useTracking()

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="hero"
      data-section="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* 背景視覺效果 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-abyss via-obsidian to-abyss" />
        {/* 中心光暈 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-blaze/5 rounded-full blur-[100px]" />
        {/* 底部過渡 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-abyss to-transparent" />
      </div>

      {/* 主要內容 */}
      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
        {/* Quick Tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {heroContent.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </motion.div>

        {/* 主標題 */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight leading-tight"
        >
          <span className="text-gradient">{heroContent.title}</span>
        </motion.h1>

        {/* 副標題 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-6 text-lg sm:text-xl md:text-2xl text-mist max-w-2xl mx-auto leading-relaxed"
        >
          {heroContent.subtitle}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            size="lg"
            onClick={() => {
              trackHeroCta()
              scrollTo('ticket')
            }}
            data-cta="hero-primary"
          >
            {heroContent.primaryCta}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              trackSecondaryCta()
              scrollTo('experience-flow')
            }}
            data-cta="hero-secondary"
          >
            {heroContent.secondaryCta}
          </Button>
        </motion.div>

        {/* 品牌標示 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          className="mt-12 text-xs text-mist/50 tracking-widest uppercase"
        >
          Presented by {siteConfig.brandName}
        </motion.p>
      </div>

      {/* 向下滾動指示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-pearl/20 flex items-start justify-center pt-2"
        >
          <div className="w-1 h-2 rounded-full bg-pearl/40" />
        </motion.div>
      </motion.div>
    </section>
  )
}
