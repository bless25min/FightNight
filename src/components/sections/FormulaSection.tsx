import { motion } from 'framer-motion'
import formulaPoster from '../../assets/landing/formula-poster.png'
import { formulaItems, formulaContent } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'

export function FormulaSection() {
  return (
    <SectionWrapper id="formula" className="relative">
      {/* 背景光暈 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-volt/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <motion.figure
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="overflow-hidden rounded-[2rem] border border-pearl/10 bg-black/40 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
        >
          <img
            src={formulaPoster}
            alt={`${formulaContent.title} ${formulaContent.subtitle}`}
            className="w-full h-auto"
            loading="lazy"
          />
          <figcaption className="sr-only">
            <p>{formulaContent.title}</p>
            <p>{formulaContent.subtitle}</p>
            <ul>
              {formulaItems.map((item) => (
                <li key={item.id}>{item.term}</li>
              ))}
            </ul>
            <p>{formulaContent.resultLabel}</p>
          </figcaption>
        </motion.figure>
      </div>
    </SectionWrapper>
  )
}
