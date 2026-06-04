import { faqItems } from '../../data/landingContent'
import type { FAQItem } from '../../types'
import { SectionWrapper } from '../ui/SectionWrapper'
import { SectionHeading } from '../ui/SectionHeading'
import { Accordion } from '../ui/Accordion'
import { useUIStore } from '../../store/uiStore'
import { useTracking } from '../../hooks/useTracking'

type Props = {
  id?: string
  title?: string
  subtitle?: string
  items?: FAQItem[]
  compact?: boolean
}

export function FAQSection({
  id = 'faq',
  title = '常見問題',
  subtitle = '先回答你心裡那些「可是...」',
  items = faqItems,
  compact = false,
}: Props = {}) {
  const { expandedFaq, toggleFaq } = useUIStore()
  const { trackFaqExpand } = useTracking()

  const handleToggle = (id: string) => {
    if (expandedFaq !== id) trackFaqExpand(id)
    toggleFaq(id)
  }

  if (compact) {
    return (
      <SectionWrapper
        id={id}
        className="max-w-[430px] px-4 sm:px-4"
        padding="py-9"
      >
        <div className="mb-6">
          <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-blaze/82">
            FAQ
          </p>
          <h2 className="mt-3 font-heading text-[2rem] font-black leading-tight text-pearl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-base leading-relaxed text-mist/76">
              {subtitle}
            </p>
          )}
        </div>

        <div className="mx-auto rounded-xl border border-pearl/10 bg-black/30 p-3">
          {items.map((item) => (
            <Accordion
              key={item.id}
              id={item.id}
              question={item.question}
              answer={item.answer}
              linkHref={item.linkHref}
              linkLabel={item.linkLabel}
              isOpen={expandedFaq === item.id}
              onToggle={() => handleToggle(item.id)}
            />
          ))}
        </div>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper id={id}>
      <SectionHeading
        title={title}
        subtitle={subtitle}
      />

      <div className="max-w-2xl mx-auto glass rounded-2xl p-3 md:p-6">
        {items.map((item) => (
          <Accordion
            key={item.id}
            id={item.id}
            question={item.question}
            answer={item.answer}
            linkHref={item.linkHref}
            linkLabel={item.linkLabel}
            isOpen={expandedFaq === item.id}
            onToggle={() => handleToggle(item.id)}
          />
        ))}
      </div>
    </SectionWrapper>
  )
}
