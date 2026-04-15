import { useState } from 'react'
import { motion } from 'framer-motion'
import { audiencePoints, audienceSectionContent } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'
import { SectionHeading } from '../ui/SectionHeading'

export function AudienceFitSection() {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <SectionWrapper id="audience">
      <SectionHeading
        title={audienceSectionContent.title}
        subtitle={audienceSectionContent.subtitle}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-3xl mx-auto">
        {audiencePoints.map((point, i) => {
          const isOn = checked.has(point.id)
          return (
            <motion.button
              key={point.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              onClick={() => toggle(point.id)}
              className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-300 cursor-pointer ${
                isOn
                  ? 'glass border-neon/30 bg-neon/5'
                  : 'glass hover:border-pearl/20'
              }`}
            >
              <motion.div
                animate={{ scale: isOn ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3 }}
                className="text-xl flex-shrink-0"
              >
                {isOn ? '✅' : point.icon}
              </motion.div>
              <span className={`text-sm ${isOn ? 'text-pearl' : 'text-mist'}`}>
                {point.text}
              </span>
            </motion.button>
          )
        })}
      </div>

      {checked.size >= 3 && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-8 text-neon font-heading font-medium"
        >
          看來你就是我們在等的人 👊
        </motion.p>
      )}
    </SectionWrapper>
  )
}
