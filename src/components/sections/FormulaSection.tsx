import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formulaItems, formulaContent } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'
import { SectionHeading } from '../ui/SectionHeading'

export function FormulaSection() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeItem = formulaItems.find((i) => i.id === activeId)

  return (
    <SectionWrapper id="formula" className="relative">
      {/* 背景光暈 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-volt/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative">
        <SectionHeading
          title={formulaContent.title}
          subtitle={formulaContent.subtitle}
        />

        {/* 公式主視覺 */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-center mb-12">
          {formulaItems.map((item, i) => (
            <div key={item.id} className="flex items-center gap-2 md:gap-3">
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveId(activeId === item.id ? null : item.id)}
                className={`px-3 py-2 md:px-4 md:py-2.5 rounded-xl font-heading font-bold text-sm md:text-base transition-all duration-300 cursor-pointer ${
                  activeId === item.id
                    ? 'bg-neon/20 text-neon border border-neon/40 glow-neon'
                    : 'glass text-pearl hover:border-neon/20'
                }`}
              >
                {item.term}
              </motion.button>
              {i < formulaItems.length - 1 && (
                <span className="text-neon/50 font-bold text-lg">×</span>
              )}
            </div>
          ))}

          <span className="text-gold font-bold text-xl md:text-2xl ml-2">=</span>
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-xl md:text-2xl font-heading font-black text-gradient-warm px-4 py-2"
          >
            {formulaContent.resultLabel}
          </motion.span>
        </div>

        {/* 展開說明 */}
        <AnimatePresence>
          {activeItem && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="glass rounded-2xl p-6 md:p-8 max-w-2xl mx-auto text-center">
                <h4 className="text-lg font-heading font-bold text-neon mb-3">
                  {activeItem.term}
                </h4>
                <p className="text-mist leading-relaxed">
                  {activeItem.description}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SectionWrapper>
  )
}
