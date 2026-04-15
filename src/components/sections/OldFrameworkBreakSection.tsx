import { motion } from 'framer-motion'
import { frameworkCards, oldFrameworkContent } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'
import { SectionHeading } from '../ui/SectionHeading'

export function OldFrameworkBreakSection() {
  return (
    <SectionWrapper id="old-framework">
      <SectionHeading
        title={oldFrameworkContent.title}
        subtitle={oldFrameworkContent.subtitle}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
        {frameworkCards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`rounded-2xl p-6 md:p-8 border transition-all duration-300 ${
              card.type === 'old'
                ? 'bg-smoke/50 border-pearl/5 opacity-60'
                : 'glass border-neon/20 glow-neon'
            }`}
          >
            {/* 標籤 */}
            <span
              className={`inline-block text-xs font-heading font-medium px-3 py-1 rounded-full mb-4 ${
                card.type === 'old'
                  ? 'bg-pearl/5 text-mist'
                  : 'bg-neon/15 text-neon'
              }`}
            >
              {card.type === 'old' ? '過去的方式' : '全新體驗'}
            </span>

            <h3
              className={`text-xl font-heading font-bold mb-3 ${
                card.type === 'old' ? 'text-mist' : 'text-pearl'
              }`}
            >
              {card.label}
            </h3>

            <p
              className={`text-sm leading-relaxed ${
                card.type === 'old' ? 'text-mist/70' : 'text-mist'
              }`}
            >
              {card.description}
            </p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  )
}
