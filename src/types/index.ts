export type TicketPlan = {
  id: string
  name: string
  subtitle: string
  teaserCopy: string
  description: string
  price: string
  features: string[]
  highlight?: boolean
  badge?: string
  ctaLabel: string
  ctaVariant: 'primary' | 'secondary' | 'ghost'
}

export type CoachTag =
  | '拳擊教學'
  | '團體帶動'
  | '節奏編排'
  | '安全控場'
  | '綜合格鬥'
  | '防身術'

export type Coach = {
  id: string
  name: string
  title: string
  bio: string
  tags: CoachTag[]
  photo?: string
}

export type SessionCapacity = '仍可報名' | '名額緊張' | '即將額滿' | '本月已額滿'

export type Session = {
  id: string
  venueId: string
  venueName: string
  date: string
  weekday: string
  time: string
  capacity: SessionCapacity
  lineUrl: string
}

export type CurriculumModule = {
  id: string
  stage: number
  title: string
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
