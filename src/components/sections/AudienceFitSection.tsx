import { motion } from 'framer-motion'
import audiencePoster from '../../assets/landing/audience-poster.png'
import { audiencePoints, audienceSectionContent } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'

export function AudienceFitSection() {
  return (
    <SectionWrapper id="audience">
      <motion.figure
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-6xl mx-auto overflow-hidden rounded-[2rem] border border-pearl/10 bg-black/40 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
      >
        <img
          src={audiencePoster}
          alt={`${audienceSectionContent.title} ${audienceSectionContent.subtitle}`}
          className="w-full h-auto"
          loading="lazy"
        />
        <figcaption className="sr-only">
          <p>{audienceSectionContent.title}</p>
          <p>{audienceSectionContent.subtitle}</p>
          <ul>
            {audiencePoints.map((point) => (
              <li key={point.id}>
                {point.icon} {point.text}
              </li>
            ))}
          </ul>
        </figcaption>
      </motion.figure>
    </SectionWrapper>
  )
}
