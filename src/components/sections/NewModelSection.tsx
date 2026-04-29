import { motion } from 'framer-motion'
import trainDifferentPoster from '../../assets/landing/train-different-poster.png'
import { newModelContent } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'

export function NewModelSection() {
  return (
    <SectionWrapper id="new-model" className="relative">
      {/* 背景光暈 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-neon/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <motion.figure
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="overflow-hidden rounded-2xl md:rounded-[2rem] border border-pearl/10 bg-black/40 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
        >
          <img
            src={trainDifferentPoster}
            alt={`${newModelContent.title} ${newModelContent.description}`}
            className="w-full h-auto"
            loading="lazy"
          />
          <figcaption className="sr-only">
            <p>{newModelContent.title}</p>
            <p>{newModelContent.description}</p>
            <ul>
              {newModelContent.keywords.map((keyword) => (
                <li key={keyword}>{keyword}</li>
              ))}
            </ul>
          </figcaption>
        </motion.figure>
      </div>
    </SectionWrapper>
  )
}
