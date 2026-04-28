import { motion } from 'framer-motion'
import belongingCard from '../../assets/landing/belonging-card.png'
import collectiveEuphoriaCard from '../../assets/landing/collective-euphoria-card.png'
import electronicOpiumCard from '../../assets/landing/electronic-opium-card.png'
import grindTrainingCard from '../../assets/landing/grind-training-card.png'
import { frameworkCards, oldFrameworkContent } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'
import { SectionHeading } from '../ui/SectionHeading'

const frameworkImageMap: Record<string, string> = {
  'fw-1': electronicOpiumCard,
  'fw-2': grindTrainingCard,
  'fw-3': collectiveEuphoriaCard,
  'fw-4': belongingCard,
}

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
            className="overflow-hidden rounded-[1.75rem] border border-pearl/10 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.3)] transition-transform duration-300 hover:-translate-y-1"
          >
            <img
              src={frameworkImageMap[card.id]}
              alt={`${card.label} ${card.description}`}
              className="w-full h-auto"
              loading="lazy"
            />
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  )
}
