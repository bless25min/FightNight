import { motion } from 'framer-motion'
import {
  weeklyCourses,
  weeklyScheduleSectionContent,
} from '../../data/landingContent'
import type { CourseCategory, WeeklyCourse } from '../../types'
import { SectionHeading } from '../ui/SectionHeading'
import { SectionWrapper } from '../ui/SectionWrapper'

const categoryMeta: Record<
  CourseCategory,
  { label: string; badgeClass: string; lead: string }
> = {
  FIGHT_NIGHT: {
    label: 'FIGHT NIGHT',
    badgeClass: 'border-blaze/40 bg-blaze/15 text-blaze',
    lead: '節奏與體能驅動。跟著音樂與教練吶喊進入狀態，零基礎也跟得上。',
  },
  BOOT_CAMP: {
    label: 'BOOT CAMP',
    badgeClass: 'border-neon/40 bg-neon/15 text-neon',
    lead: '技術與格鬥邏輯。把刺激轉成身體反射，讓壓力來的時候你站得住。',
  },
}

function sortByDateTime(a: WeeklyCourse, b: WeeklyCourse) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  return a.startTime < b.startTime ? -1 : 1
}

const CATEGORY_ORDER: CourseCategory[] = ['FIGHT_NIGHT', 'BOOT_CAMP']

export function WeeklyScheduleSection() {
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: weeklyCourses
      .filter((c) => c.category === category)
      .sort(sortByDateTime),
  })).filter((g) => g.items.length > 0)

  return (
    <SectionWrapper id="weekly-schedule">
      <SectionHeading
        title={weeklyScheduleSectionContent.title}
        subtitle={weeklyScheduleSectionContent.subtitle}
      />

      <div className="space-y-10 md:space-y-14 max-w-5xl mx-auto">
        {groups.map(({ category, items }) => {
          const meta = categoryMeta[category]
          return (
            <div key={category}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2 mb-5 md:mb-7">
                <span
                  className={`self-start inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-heading font-semibold tracking-[0.2em] border ${meta.badgeClass}`}
                >
                  {meta.label}
                </span>
                <p className="text-sm md:text-base text-mist/75 leading-snug">
                  {meta.lead}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {items.map((c, i) => (
                  <motion.article
                    key={c.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.06 }}
                    className="rounded-2xl border border-pearl/10 bg-black/30 p-5 md:p-6 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base md:text-lg font-heading font-semibold text-pearl leading-snug">
                          {c.name}
                        </h3>
                        <p className="text-xs md:text-sm text-mist/60 font-heading tracking-wide truncate">
                          {c.nameEn}
                        </p>
                      </div>
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-xs md:text-sm font-heading text-pearl/80 border border-pearl/15 bg-pearl/5">
                        週{c.weekday}
                      </span>
                    </div>

                    <div className="space-y-0.5 text-sm text-mist">
                      <p className="text-pearl/90 font-heading">
                        {c.date}{' '}
                        <span className="text-mist/60">
                          · {c.startTime} – {c.endTime}
                        </span>
                      </p>
                      <p className="text-xs md:text-sm text-mist/60">
                        {c.venueName} · {c.coach}
                      </p>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs md:text-sm text-mist/50 max-w-2xl mx-auto mt-8 md:mt-12">
        {weeklyScheduleSectionContent.footnote}
      </p>
    </SectionWrapper>
  )
}
