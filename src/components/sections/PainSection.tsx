import { motion } from 'framer-motion'
import { painPoints, painSectionContent } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'
import { SectionHeading } from '../ui/SectionHeading'

export function PainSection() {
  return (
    <SectionWrapper id="pain">
      <SectionHeading
        title={painSectionContent.title}
        subtitle={painSectionContent.subtitle}
      />

      <p className="text-center text-mist max-w-2xl mx-auto mb-12 md:mb-16 leading-relaxed">
        {painSectionContent.description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
        {painPoints.map((point, i) => (
          <motion.div
            key={point.id}
            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="glass rounded-xl p-5 md:p-6"
          >
            <p className="text-pearl font-medium mb-2">{point.situation}</p>
            <p className="text-blaze/80 text-sm">→ {point.reality}</p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  )
}
