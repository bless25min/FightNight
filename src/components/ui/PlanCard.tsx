import { motion } from 'framer-motion'
import type { TicketPlan } from '../../types'
import { Badge } from './Badge'
import { Button } from './Button'

type Props = {
  plan: TicketPlan
  index?: number
  onCtaAction: (redirectUrl: string, planId: string) => void
  className?: string
}

export function PlanCard({
  plan,
  index = 0,
  onCtaAction,
  className = '',
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.12 }}
      className={`relative rounded-2xl p-5 md:p-8 border transition-all duration-300 ${
        plan.highlight
          ? 'glass border-neon/40 glow-neon md:scale-105'
          : 'glass border-pearl/10 hover:border-pearl/20'
      } ${className}`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant={plan.highlight ? 'highlight' : 'gold'}>
            {plan.badge}
          </Badge>
        </div>
      )}

      <h3 className="text-2xl font-heading font-bold mt-1 md:mt-2 mb-1">
        {plan.name}
      </h3>
      <p className="text-sm text-mist mb-3">{plan.subtitle}</p>
      <p className="text-sm md:text-base text-neon/90 leading-relaxed mb-3">
        {plan.teaserCopy}
      </p>
      <p className="text-sm md:text-base text-pearl/85 leading-relaxed mb-5 md:mb-6">
        {plan.description}
      </p>

      <div className="mb-5 md:mb-6">
        <span className="text-3xl md:text-4xl font-heading font-black text-pearl">
          {plan.price}
        </span>
      </div>

      <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-mist">
            <span className="text-neon mt-0.5 flex-shrink-0">•</span>
            {feature}
          </li>
        ))}
      </ul>

      <Button
        variant={plan.ctaVariant}
        className="w-full"
        onClick={() => onCtaAction(plan.checkoutUrl, plan.id)}
        data-cta={`plan-${plan.id}`}
      >
        {plan.ctaLabel}
      </Button>
    </motion.div>
  )
}
