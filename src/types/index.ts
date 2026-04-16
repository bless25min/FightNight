export type TicketPlan = {
  id: string
  name: string
  subtitle: string
  price: string
  features: string[]
  highlight?: boolean
  badge?: string
  ctaLabel: string
  ctaVariant: 'primary' | 'secondary' | 'ghost'
}

export type CoreValue = {
  id: string
  icon: string
  title: string
  subtitle: string
  description: string
}

export type FormulaItem = {
  id: string
  term: string
  description: string
}

export type FlowStep = {
  id: string
  stage: number
  title: string
  description: string
  emotionLevel: number
}

export type FAQItem = {
  id: string
  question: string
  answer: string
}

export type PainPoint = {
  id: string
  situation: string
  reality: string
}

export type FrameworkCard = {
  id: string
  label: string
  description: string
  type: 'old' | 'new'
}

export type AudiencePoint = {
  id: string
  text: string
  icon: string
}
