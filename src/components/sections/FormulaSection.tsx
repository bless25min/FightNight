import { motion } from 'framer-motion'
import formulaPoster from '../../assets/landing/formula-poster.png'
import { SectionWrapper } from '../ui/SectionWrapper'

const formulaContent = {
  title: '為什麼你會被帶進去？',
  subtitle: '實際上在課程中，是透過大家一起協力完成一件訓練挑戰。',
  highlight: '共同完成挑戰',
  description:
    '你會被帶進去，不是因為偶然的嗨，而是因為全場都在一起跟上同一段節奏、一起撐過同一個挑戰。',
  resultLabel: '集體亢奮',
}

const formulaItems = [
  '共同注意力',
  '身體同步',
  '預期堆疊',
  '腦內啡的釋放',
  '你屬於這裡',
  '情緒感染',
]

export function FormulaSection() {
  return (
    <SectionWrapper id="formula" className="relative">
      <div className="absolute top-1/2 left-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-volt/5 blur-[100px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="overflow-hidden rounded-[2rem] border border-pearl/10 bg-black/40 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
        >
          <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
            <div className="flex flex-col justify-between gap-8 p-8 sm:p-10 lg:p-12">
              <div className="space-y-5">
                <div className="h-1 w-14 rounded-full bg-rage" />
                <h2 className="max-w-md text-4xl font-black leading-[0.95] text-pearl sm:text-5xl lg:text-6xl">
                  {formulaContent.title}
                </h2>
                <p className="max-w-lg text-lg leading-relaxed text-pearl/74 sm:text-xl">
                  {formulaContent.subtitle}
                </p>
                <div className="inline-flex w-fit items-center rounded-full border border-rage/35 bg-rage/10 px-5 py-2 text-sm font-semibold tracking-[0.18em] text-rage sm:text-base">
                  {formulaContent.highlight}
                </div>
                <p className="max-w-xl text-base leading-7 text-pearl/68 sm:text-lg">
                  {formulaContent.description}
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {formulaItems.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-pearl/10 bg-pearl/5 px-4 py-3 text-sm font-medium text-pearl/82 sm:text-base"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="inline-flex items-center gap-3 rounded-full border border-rage/30 bg-black/30 px-5 py-3 text-sm font-semibold text-pearl/88 sm:text-base">
                  <span className="text-pearl/45">結果</span>
                  <span className="text-rage">{formulaContent.resultLabel}</span>
                </div>
              </div>
            </div>

            <figure className="relative min-h-[320px] lg:min-h-full">
              <img
                src={formulaPoster}
                alt={formulaContent.highlight}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-transparent lg:to-black/20" />
              <figcaption className="sr-only">
                <p>{formulaContent.title}</p>
                <p>{formulaContent.subtitle}</p>
                <ul>
                  {formulaItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p>{formulaContent.resultLabel}</p>
              </figcaption>
            </figure>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
