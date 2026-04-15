import { motion } from 'framer-motion'
import { newModelContent } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'

export function NewModelSection() {
  return (
    <SectionWrapper id="new-model" className="relative">
      {/* 背景光暈 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-neon/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative text-center max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold text-gradient leading-tight"
        >
          {newModelContent.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 text-lg md:text-xl text-mist leading-relaxed"
        >
          {newModelContent.description}
        </motion.p>

        {/* 浮動關鍵詞 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          {newModelContent.keywords.map((keyword, i) => (
            <motion.span
              key={keyword}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
              className="px-5 py-2.5 rounded-full glass border border-neon/20 text-neon font-heading font-medium text-sm animate-float"
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              {keyword}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
