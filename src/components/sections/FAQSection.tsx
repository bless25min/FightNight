import { faqItems } from '../../data/landingContent'
import { SectionWrapper } from '../ui/SectionWrapper'
import { SectionHeading } from '../ui/SectionHeading'
import { Accordion } from '../ui/Accordion'
import { useUIStore } from '../../store/uiStore'
import { useTracking } from '../../hooks/useTracking'

export function FAQSection() {
  const { expandedFaq, toggleFaq } = useUIStore()
  const { trackFaqExpand } = useTracking()

  const handleToggle = (id: string) => {
    if (expandedFaq !== id) trackFaqExpand(id)
    toggleFaq(id)
  }

  return (
    <SectionWrapper id="faq">
      <SectionHeading
        title="常見問題"
        subtitle="先回答你心裡那些「可是...」"
      />

      <div className="max-w-2xl mx-auto glass rounded-2xl p-4 md:p-6">
        {faqItems.map((item) => (
          <Accordion
            key={item.id}
            id={item.id}
            question={item.question}
            answer={item.answer}
            isOpen={expandedFaq === item.id}
            onToggle={() => handleToggle(item.id)}
          />
        ))}
      </div>
    </SectionWrapper>
  )
}
