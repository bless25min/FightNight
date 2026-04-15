import { motion } from 'framer-motion'
import { flowSteps, flowSectionContent } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'
import { SectionHeading } from '../ui/SectionHeading'

export function ExperienceFlowSection() {
  return (
    <SectionWrapper id="experience-flow">
      <SectionHeading
        title={flowSectionContent.title}
        subtitle={flowSectionContent.subtitle}
      />

      <div className="relative max-w-2xl mx-auto">
        {/* 中軸線 */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-neon/30 to-transparent" />

        {flowSteps.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="relative flex items-start gap-6 mb-10 last:mb-0"
          >
            {/* 節點 */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-heading font-bold text-sm border-2"
                style={{
                  background: `rgba(191, 90, 242, ${step.emotionLevel * 0.08})`,
                  borderColor: `rgba(191, 90, 242, ${0.2 + step.emotionLevel * 0.06})`,
                  boxShadow:
                    step.emotionLevel >= 8
                      ? '0 0 20px rgba(191, 90, 242, 0.4)'
                      : 'none',
                }}
              >
                {step.stage}
              </div>
            </div>

            {/* 內容 */}
            <div className="flex-1 pt-1">
              <h3 className="text-lg font-heading font-bold mb-2 text-pearl">
                {step.title}
              </h3>
              <p className="text-sm text-mist leading-relaxed">
                {step.description}
              </p>
              {/* 情緒強度條 */}
              <div className="mt-3 h-1 rounded-full bg-pearl/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${step.emotionLevel * 10}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-neon to-blaze"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  )
}
