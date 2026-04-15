import { motion } from 'framer-motion'
import { mechanisms, mechanismSectionContent } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'
import { SectionHeading } from '../ui/SectionHeading'
import { Card } from '../ui/Card'

export function MechanismSection() {
  return (
    <SectionWrapper id="mechanism">
      <SectionHeading
        title={mechanismSectionContent.title}
        subtitle={mechanismSectionContent.subtitle}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {mechanisms.map((mech, i) => (
          <motion.div
            key={mech.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <Card className="h-full">
              <div className="text-3xl mb-3">{mech.icon}</div>
              <h3 className="text-lg font-heading font-bold mb-2">
                {mech.title}
              </h3>
              <p className="text-mist text-sm leading-relaxed">
                {mech.description}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  )
}
