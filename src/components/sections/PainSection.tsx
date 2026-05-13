import { motion } from 'framer-motion'
import painPoster from '../../assets/landing/pain-poster.png'
import { painPoints, painSectionContent } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'
import { ZoomableImage } from '../ui/ZoomableImage'

export function PainSection() {
  return (
    <SectionWrapper id="pain">
      <motion.figure
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-6xl mx-auto overflow-hidden rounded-2xl md:rounded-[2rem] border border-pearl/10 bg-black/40 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
      >
        <ZoomableImage
          src={painPoster}
          alt={`${painSectionContent.title} ${painSectionContent.subtitle}`}
          className="w-full h-auto"
          loading="lazy"
        />
        <figcaption className="sr-only">
          <p>{painSectionContent.title}</p>
          <p>{painSectionContent.subtitle}</p>
          <p>{painSectionContent.description}</p>
          <ul>
            {painPoints.map((point) => (
              <li key={point.id}>
                {point.situation} {point.reality}
              </li>
            ))}
          </ul>
        </figcaption>
      </motion.figure>
    </SectionWrapper>
  )
}
