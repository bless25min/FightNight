import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { glovesContent } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'

export function GlovesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [30, -30])

  return (
    <SectionWrapper id="gloves" className="overflow-hidden">
      <div
        ref={sectionRef}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center"
      >
        {/* 拳套視覺區 */}
        <motion.div style={{ y }} className="flex items-center justify-center">
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            {/* 背景光暈 */}
            <div className="absolute inset-0 bg-blaze/10 rounded-full blur-[60px]" />
            {/* 拳套佔位視覺 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[120px] md:text-[160px] select-none">
                🥊
              </span>
            </div>
          </div>
        </motion.div>

        {/* 文案區 */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-heading font-bold mb-4"
          >
            {glovesContent.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lg text-mist mb-6 leading-relaxed"
          >
            {glovesContent.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-3"
          >
            {glovesContent.features.map((f) => (
              <span
                key={f}
                className="px-4 py-2 rounded-full glass text-sm text-pearl/80 font-medium"
              >
                {f}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </SectionWrapper>
  )
}
