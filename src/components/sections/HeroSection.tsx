import { motion } from 'framer-motion'
import heroPoster from '../../assets/landing/hero-poster.jpg'
import { heroContent } from '../../data/landingContent'
import { ZoomableImage } from '../ui/ZoomableImage'

export function HeroSection() {
  return (
    <section
      id="hero"
      data-section="hero"
      className="relative md:min-h-screen flex items-center justify-center overflow-hidden"
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
      <div className="relative z-10 w-full max-w-6xl mx-auto px-3 sm:px-8 pt-20 pb-6 sm:py-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mx-auto overflow-hidden rounded-2xl md:rounded-[2rem] border border-pearl/10 bg-black/40 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
        >
          <ZoomableImage
            src={heroPoster}
            alt={`${heroContent.title} ${heroContent.subtitle}`}
            className="w-full h-auto"
            loading="eager"
          />
        </motion.div>

        <div className="sr-only">
          <h1>{heroContent.title}</h1>
          <p>{heroContent.subtitle}</p>
          <ul>
            {heroContent.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 向下滾動指示（僅桌機顯示） */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2"
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
