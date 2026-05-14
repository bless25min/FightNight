import { motion } from 'framer-motion'
import formulaPoster from '../../assets/landing/formula-poster.jpg'
import { SectionWrapper } from '../ui/SectionWrapper'
import { ZoomableImage } from '../ui/ZoomableImage'

const formulaContent = {
  title: '為什麼你會被帶進去？',
  resultLabel: '集體亢奮',
  items: ['共同注意力', '身體同步', '預期堆疊', '腦內啡的釋放', '你屬於這裡', '情緒感染'],
}

export function FormulaSection() {
  return (
    <SectionWrapper id="formula" className="relative">
      <div className="absolute top-1/2 left-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-volt/5 blur-[100px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <motion.figure
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="overflow-hidden rounded-2xl md:rounded-[2rem] border border-pearl/10 bg-black/40 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
        >
          <ZoomableImage src={formulaPoster} alt={formulaContent.title} className="w-full h-auto" loading="lazy" />
          <figcaption className="sr-only">
            <p>{formulaContent.title}</p>
            <ul>
              {formulaContent.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>{formulaContent.resultLabel}</p>
          </figcaption>
        </motion.figure>
      </div>
    </SectionWrapper>
  )
}
