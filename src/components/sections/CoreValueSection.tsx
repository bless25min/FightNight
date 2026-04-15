import { motion } from 'framer-motion'
import { coreValues, coreValueSectionContent } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'
import { SectionHeading } from '../ui/SectionHeading'
import { Card } from '../ui/Card'

const glowColors: Array<'blaze' | 'neon' | 'volt'> = ['blaze', 'neon', 'volt']

export function CoreValueSection() {
  return (
    <SectionWrapper id="core-value">
      <SectionHeading
        title={coreValueSectionContent.title}
        subtitle={coreValueSectionContent.subtitle}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {coreValues.map((value, i) => (
          <motion.div
            key={value.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
          >
            <Card glowColor={glowColors[i]} className="h-full">
              <div className="text-4xl mb-4">{value.icon}</div>
              <h3 className="text-2xl font-heading font-bold mb-2">
                {value.title}
              </h3>
              <p className="text-neon text-sm font-medium mb-4">
                {value.subtitle}
              </p>
              <p className="text-mist text-sm leading-relaxed">
                {value.description}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  )
}
