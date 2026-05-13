import { motion } from 'framer-motion'
import flowOverviewPoster from '../../assets/landing/flow-overview-poster.png'
import flowStep1Poster from '../../assets/landing/flow-step-1.png'
import flowStep2Poster from '../../assets/landing/flow-step-2.png'
import flowStep3Poster from '../../assets/landing/flow-step-3.png'
import flowStep4Poster from '../../assets/landing/flow-step-4.png'
import flowStep5Poster from '../../assets/landing/flow-step-5.png'
import { flowSteps } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'
import { ZoomableImage } from '../ui/ZoomableImage'

const flowOverviewContent = {
  title: '安全並且精心編排的失控',
  subtitle: '你可能會出神，事後忘記過程做了什麼，但不會受傷。',
}

const flowImageMap: Record<string, string> = {
  'flow-1': flowStep1Poster,
  'flow-2': flowStep2Poster,
  'flow-3': flowStep3Poster,
  'flow-4': flowStep4Poster,
  'flow-5': flowStep5Poster,
}

export function ExperienceFlowSection() {
  return (
    <SectionWrapper id="experience-flow">
      <div className="max-w-6xl mx-auto space-y-3 md:space-y-6">
        <motion.figure
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="overflow-hidden rounded-2xl md:rounded-[2rem] border border-pearl/10 bg-black/40 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
        >
          <ZoomableImage
            src={flowOverviewPoster}
            alt={`${flowOverviewContent.title} ${flowOverviewContent.subtitle}`}
            className="w-full h-auto"
            loading="lazy"
          />
          <figcaption className="sr-only">
            <p>{flowOverviewContent.title}</p>
            <p>{flowOverviewContent.subtitle}</p>
          </figcaption>
        </motion.figure>

        {flowSteps.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="overflow-hidden rounded-2xl md:rounded-[2rem] border border-pearl/10 bg-black/40 shadow-[0_24px_60px_rgba(0,0,0,0.3)]"
          >
            <ZoomableImage
              src={flowImageMap[step.id]}
              alt={`${step.stage}. ${step.title} ${step.description}`}
              className="w-full h-auto"
              loading="lazy"
            />
          </motion.div>
        ))}

        <div className="sr-only">
          <ol>
            {flowSteps.map((step) => (
              <li key={step.id}>
                {step.stage}. {step.title} {step.description}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </SectionWrapper>
  )
}
