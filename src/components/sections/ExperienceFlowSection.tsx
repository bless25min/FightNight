import { motion } from 'framer-motion'
import flowOverviewPoster from '../../assets/landing/flow-overview-poster.png'
import flowStep1Poster from '../../assets/landing/flow-step-1.png'
import flowStep2Poster from '../../assets/landing/flow-step-2.png'
import flowStep3Poster from '../../assets/landing/flow-step-3.png'
import flowStep4Poster from '../../assets/landing/flow-step-4.png'
import flowStep5Poster from '../../assets/landing/flow-step-5.png'
import { flowSteps } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'

const flowOverviewContent = {
  title: '安全並且精心編排的失控',
  subtitle:
    '這份失控感不是即興，而是教練事前把節奏、安全邊界與挑戰順序都設計好，讓你能放心進入狀態。',
  points: ['課前節奏編排', '安全邊界設定', '挑戰順序設計'],
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
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="overflow-hidden rounded-[2rem] border border-pearl/10 bg-black/40 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
        >
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col justify-center gap-6 p-8 sm:p-10 lg:p-12">
              <div className="h-1 w-14 rounded-full bg-rage" />
              <h2 className="max-w-md text-4xl font-black leading-[0.95] text-pearl sm:text-5xl lg:text-6xl">
                {flowOverviewContent.title}
              </h2>
              <p className="max-w-xl text-lg leading-relaxed text-pearl/74 sm:text-xl">
                {flowOverviewContent.subtitle}
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {flowOverviewContent.points.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-pearl/10 bg-pearl/5 px-4 py-4 text-sm font-medium text-pearl/82 sm:text-base"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <figure className="relative min-h-[320px] lg:min-h-full">
              <img
                src={flowOverviewPoster}
                alt={flowOverviewContent.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-transparent lg:to-black/10" />
              <figcaption className="sr-only">
                <p>{flowOverviewContent.title}</p>
                <p>{flowOverviewContent.subtitle}</p>
              </figcaption>
            </figure>
          </div>
        </motion.div>

        {flowSteps.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="overflow-hidden rounded-[2rem] border border-pearl/10 bg-black/40 shadow-[0_24px_60px_rgba(0,0,0,0.3)]"
          >
            <img
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
