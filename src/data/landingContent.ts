import type {
  PainPoint,
  FrameworkCard,
  FormulaItem,
  FlowStep,
  AudiencePoint,
  TicketPlan,
  FAQItem,
  Session,
  CurriculumModule,
} from '../types'

// ── 全域設定 ──────────────────────────────────────
export const siteConfig = {
  brandName: 'UFCGYM TAIWAN',
  eventName: 'Fight Night',
  lineUrl: 'https://page.line.me/340uxvgb',
  ticketUrl: '#ticket',
  offersUrl: '/offers',
}

// ── Hero ─────────────────────────────────────────
export const heroContent = {
  title: '今晚，一起進入狀態。',
  subtitle: '這是一張讓你脫離日常的入場券。',
  primaryCta: '查看活動場次 / 費用資訊',
  secondaryCta: '這一晚會發生什麼',
  tags: ['🥊 拳套入場', '👥 集體同步', '🔥 壓力釋放'],
}

// ── 共同困境 ──────────────────────────────────────
export const painSectionContent = {
  title: '對生活提不起勁。',
  subtitle: '你缺的是一個讓你「進入狀態」的機會。',
  description:
    '每天都在找事情填滿時間，但填完之後還是覺得悶，彷彿「沒有一件事能讓你脫離枯燥窒息的日常」。',
}

export const painPoints: PainPoint[] = [
  {
    id: 'pain-1',
    situation: '下班後追劇、滑手機到凌晨',
    reality: '隔天更累，什麼都沒改變',
  },
  {
    id: 'pain-2',
    situation: '和朋友吃飯、逛街、聚會',
    reality: '熱鬧完回到家，卻覺得更空虛無力',
  },
  {
    id: 'pain-3',
    situation: '勉強完成一小時的健身訓練',
    reality: '完成任務的感覺，但沒有爽過',
  },
  {
    id: 'pain-4',
    situation: '報名各種課程、活動、體驗',
    reality: '新鮮感一次就沒了',
  },
]

// ── 舊框架崩解 ────────────────────────────────────
export const oldFrameworkContent = {
  title: '不是每種熱鬧都能釋放壓力。',
  subtitle: '不是每種運動都會讓你上癮。',
}

export const frameworkCards: FrameworkCard[] = [
  {
    id: 'fw-1',
    label: '電子鴉片',
    description: '看劇、滑手機、打遊戲。短暫逃避，但你知道那不是真正的釋放。',
    type: 'old',
  },
  {
    id: 'fw-2',
    label: '苦撐式訓練',
    description: '撐完了，得到的只有痠痛與疲憊。',
    type: 'old',
  },
  {
    id: 'fw-3',
    label: '集體亢奮',
    description: '個人情緒會被群體感染。你會不由自主地被帶入，不需要自己硬撐。',
    type: 'new',
  },
  {
    id: 'fw-4',
    label: '歸屬感',
    description: '短暫離開原本那個很悶的自己，融入這個群體氛圍中。',
    type: 'new',
  },
]

// ── 新模型 ────────────────────────────────────────
export const newModelContent = {
  title: 'TRAIN DIFFERENT，可被帶入的集體情緒體驗',
  description:
    'Fight Night 不是拳擊課，也不是團體健身。它是一個精心設計的情境，用激勵、同化、節奏編排，讓你得到從未有過的體驗。',
  keywords: ['同步', '釋放', '歸屬', '進場', '身份'],
}

// ── 公式區 ────────────────────────────────────────
export const formulaContent = {
  title: '為什麼你會被帶進去？',
  subtitle: '這不是偶然的嗨。每一個環節都經過設計。',
  resultLabel: '集體亢奮',
}

export const formulaItems: FormulaItem[] = [
  {
    id: 'f-attention',
    term: '共同注意力',
    description:
      '全場目光鎖定同一個焦點，專注力開始聚焦在簡單的動作上，個體意識漸漸消融。',
  },
  {
    id: 'f-sync',
    term: '身體同步',
    description:
      '同樣節拍，同樣動作，身體的同步會啟動大腦的鏡像系統，不需要語言就能製造深層連結。',
  },
  {
    id: 'f-anticipation',
    term: '預期堆疊',
    description:
      '節奏在加快、強度在拉高，這種預期本身就會將情緒不斷堆疊。',
  },
  {
    id: 'f-release',
    term: '腦內啡的釋放',
    description:
      '感覺時間的流動變慢，心情極度愉悅，疲勞、疼痛、壓力煙消雲散。',
  },
  {
    id: 'f-identity',
    term: '你屬於這裡',
    description:
      '戴上拳套的那一刻，你就不再只是觀眾，你是今晚這個群體的一份子。',
  },
  {
    id: 'f-seed',
    term: '情緒感染',
    description:
      '當一個人的情緒被點燃，周圍的人也會被帶動，整個群體的狀態會快速擴散。',
  },
]

// ── 情緒流程區 ────────────────────────────────────
export const flowSectionContent = {
  title: '安全並且精心編排的失控',
  subtitle: '你可能會出神，事後忘記過程做了什麼，但不會受傷。',
}

export const flowSteps: FlowStep[] = [
  {
    id: 'flow-1',
    stage: 1,
    title: '新手也能做到的動作',
    description: '從任何人都能做到的簡單動作開始，讓教練快速判別每個人的身體能力差異。',
    emotionLevel: 3,
  },
  {
    id: 'flow-2',
    stage: 2,
    title: '程度分組與鏡像動作',
    description: '根據暖身時的狀況，進行分組，讓大家專注在編排好的動作與節奏上。',
    emotionLevel: 5,
  },
  {
    id: 'flow-3',
    stage: 3,
    title: '堆疊同步與專注',
    description:
      '透過教練高能量的吶喊聲引導，隨著節奏與強度的堆疊，你也不自覺地跟著大家一起出拳、一起吶喊。',
    emotionLevel: 7,
  },
  {
    id: 'flow-4',
    stage: 4,
    title: '全力專注並釋放情緒',
    description:
      '隨著動作與節奏的堆疊，你漸漸專注到聽不見教練的吶喊聲，彷彿世界只剩下你跟沙包，只剩下純粹的情緒釋放。',
    emotionLevel: 9,
  },
  {
    id: 'flow-5',
    stage: 5,
    title: '歸屬與延續',
    description:
      '你完成了平常不會做的事，你與運動夥伴互相激勵，全力克服共同的挑戰後，獲得了新的身份。',
    emotionLevel: 6,
  },
]

// ── 適合誰 ────────────────────────────────────────
export const audienceSectionContent = {
  title: '這個體驗適合你嗎？',
  subtitle: '如果這些項目其中有符合你的，那你就是我們在等的人。',
}

export const audiencePoints: AudiencePoint[] = [
  { id: 'aud-1', text: '上班悶到爆，下班只想躺但又覺得浪費', icon: '😮‍💨' },
  { id: 'aud-2', text: '試過各種運動，但沒有一種讓你真的「進入狀態」', icon: '🏃' },
  { id: 'aud-3', text: '喜歡音樂、節奏、低音重的震動亢奮感', icon: '🎵' },
  { id: 'aud-4', text: '想跟朋友做一件不一樣的事，不是又吃飯又唱歌', icon: '🤝' },
  { id: 'aud-5', text: '想認識一群有能量、不混日子的人', icon: '⚡' },
  { id: 'aud-6', text: '覺得最近需要一個出口，什麼形式都好', icon: '🔓' },
]

// ── 票種區（首頁 teaser + 登入後完整資訊共用資料） ─────
export const ticketSectionContent = {
  title: '查看活動場次 / 費用資訊',
  subtitle: '首頁不直接顯示價格與方案。進入頁面後，再用 LINE Login 解鎖完整內容。',
  description:
    '你會看到 LINE 會員專屬內容入口。快速登入後，可查看四次完整內容、活動場次、費用資訊、帶領者資訊與可報名名額。',
  footnote:
    '想先確認這是不是一個你想認真參與的完整體驗，再決定要不要進場，這就是你該點的地方。',
  unifiedCtaLabel: '查看活動場次 / 費用資訊',
  teaserHint: 'LINE 會員專屬內容',
  previewTitle: '這個頁面會解鎖什麼？',
  previewItems: ['四次完整內容', '活動場次', '費用資訊', '帶領者資訊'],
}

// ── /offers 頁面文案 ──────────────────────────────
export const offersHeroContent = {
  title: '全球頂尖的運動娛樂體驗，只是開始',
  subtitle: 'Fight Night只是開始，完成Boot Camp才會真正的讓你蛻變。',
  description:
    '刺激、音樂、人群、拳套和沙包，是入口。讓壓力被排空，讓刺激變得有意義，讓身體逐步適應恐懼、壓迫、距離和反應，最後把自信與穩定帶回生活。',
  primaryCta: '快速登入查看',
  secondaryCta: '先看完整系統',
}

export const offersCurriculumSectionContent = {
  title: 'Boot Camp 如何運作？',
  subtitle:
    '職業格鬥選手終其一生都在練習：如何面對恐懼、壓力、打擊，以及重新站起來的能力。',
  description:
    'Fight Night 先讓你感受到刺激與釋放；Boot Camp 則借用格鬥選手面對壓力的底層邏輯，把恐懼、壓迫、打擊的應對技巧，轉成身體反射記憶。你會開始知道，原來壓力靠近時，自己可以站得住、看得見，也做得出下一步。',
}

export const curriculumModules: CurriculumModule[] = [
  {
    id: 'module-1',
    stage: 1,
    title: '更多體驗與刺激',
    description:
      '每一次都是不同的體驗，讓音樂、節奏、沙包、回合與群體能量逐次加深。你不只知道它很嗨，還會知道自己怎麼進入狀態。',
  },
  {
    id: 'module-2',
    stage: 2,
    title: '讓刺激變得有意義',
    description:
      '刺激如果只停在當下，很快就散掉。課程的編排會把技術與經驗串起來，讓那份刺激變成身體反射的記憶。',
  },
  {
    id: 'module-3',
    stage: 3,
    title: '物理性適應恐懼與壓迫',
    description:
      '在安全邊界內感受聲音、靠近感、速度與壓迫，讓身心都學會如何面對恐懼與應對壓力。',
  },
  {
    id: 'module-4',
    stage: 4,
    title: '物理性的防身技巧',
    description:
      '你會開始理解距離、站姿、防禦、閃躲和掙脫反應。這不是紙上談兵，而是身體真的練過一遍。',
  },
  {
    id: 'module-5',
    stage: 5,
    title: '內心層面的自信成長',
    description:
      '自信是身體完成過一件事之後留下的證據。完成Boot Camp後，會發現自己變得更堅定。',
  },
  {
    id: 'module-6',
    stage: 6,
    title: '克服壓力與焦慮的身體記憶',
    description:
      '從容是內心習慣流程化應對壓力的結果。完成Boot Camp後，壓力不再像過去那樣影響你。',
  },
]

export const offersPlanSectionContent = {
  title: '選一個你真的會記住的入口',
  subtitle: '選擇你要把這個體驗從夜晚帶到多深的旅程。',
  footnote:
    '被帶進狀態、被安全接住，以及離開後身體仍在應對壓力有記憶。',
}

export const offersOutcomeSectionContent = {
  title: '不只是很嗨的夜晚。',
  subtitle:
    'Fight Night是讓人期待的入口，但真正價值來自一套從感官刺激到身心變化的完整結構。',
  formulaLabel: 'Boot Camp完整系統的結構',
  formulaInputs: ['刺激進場', '壓力排空', '身體適應', '心理成長'],
  formulaResult: '從釋放壓力的痛快，變成帶得走的能力',
}

export const offersPlans: TicketPlan[] = [
  {
    id: 'offers-session-pass',
    name: 'First Round｜初次進場',
    subtitle: '先讓身體確認一次',
    teaserCopy: '一晚就夠你知道，這不是又一個週末活動。',
    description:
      '適合第一次靠近 Fight Night 的人。你會進入完整場域，跟著節奏、拳套、聲音和群體，把平常壓在身體裡的東西真正打開一次。',
    price: 'NT$1,800',
    features: [
      '單次 Fight Night 完整進場資格',
      '拳套可租用或自備',
      '從暖場、節奏推進到高峰釋放，完整走過一次情緒曲線',
      '適合想先確認這是不是自己的壓力出口',
    ],
    checkoutUrl: siteConfig.lineUrl,
    ctaLabel: '購買 First Round Pass',
    ctaVariant: 'secondary',
  },
  {
    id: 'offers-session-glove-pass',
    name: 'First Round Gear｜初次進場＋專屬拳套',
    subtitle: '把第一次變成一個開始',
    teaserCopy: '不是加購裝備，是替這個夜晚留下重量。',
    description:
      '適合你已經不想只是來看看。自己的拳套會讓進場更有儀式感，也讓結束後的狀態不只停在現場。',
    price: 'NT$2,800',
    badge: '附專屬拳套',
    features: [
      '包含 First Round 完整進場內容',
      '附品牌專屬拳套一副，活動後帶走',
      '第一次就使用自己的裝備，手感、投入感和記憶點更完整',
      '適合重視儀式感，也想把開始留下來的人',
    ],
    checkoutUrl: siteConfig.lineUrl,
    ctaLabel: '購買 First Round Gear Pass',
    ctaVariant: 'secondary',
  },
  {
    id: 'offers-transformation-pass',
    name: 'Boot Camp｜四次完整旅程',
    subtitle: '主推：真正走完整套設計',
    teaserCopy: '如果你要看到完整系統，選這個。',
    description:
      '四次不同的系統化課程編排，把刺激、壓力排空、恐懼適應、防身反應、自信成長和焦慮耐受串成一段完整經驗。這是最完整體驗的版本。',
    price: 'NT$3,800',
    badge: '主推方案',
    features: [
      '四次循序進場，從釋放、穩定到建立底氣',
      '每次都累積不同的身體記憶，不只是重複流汗',
      '適合想把壓力出口變成可回到生活裡的力量感',
      '主推給不想只買新鮮感，而是想留下真正變化的人',
    ],
    highlight: true,
    checkoutUrl: siteConfig.lineUrl,
    ctaLabel: '購買 Signature Four Pass',
    ctaVariant: 'primary',
  },
  {
    id: 'offers-upgrade-pass',
    name: 'Boot Camp Gear｜四次完整旅程＋專屬拳套',
    subtitle: '把完整體驗帶回生活',
    teaserCopy: '四次旅程，加上一副屬於你的拳套。',
    description:
      '給已經決定完整投入的人。你買的不是紀念品，而是一個能被看見、被拿起、把那段狀態找回來的物件。',
    price: 'NT$4,800',
    badge: '完整投入',
    features: [
      '包含 Signature Four 全部四次完整內容',
      '附品牌專屬拳套一副，活動後帶走',
      '讓儀式感、力量感和收藏感延續到日常',
      '所有方案中最完整，也最有長尾價值的版本',
    ],
    checkoutUrl: siteConfig.lineUrl,
    ctaLabel: '購買 Signature Gear Pass',
    ctaVariant: 'secondary',
  },
  {
    id: 'offers-private-intro',
    name: 'Private Onboarding｜私人預備進場',
    subtitle: '給想先被接住的人',
    teaserCopy: '不是降低強度，是先把安全感建立起來。',
    description:
      '適合對群體節奏、身體互動或陌生場域有顧慮的人。先用更細緻的方式熟悉節奏與邊界，正式進場時才不用把注意力浪費在緊張上。',
    price: '私訊詢問',
    features: [
      '一對一或小班式預備體驗',
      '先熟悉場域、節奏、互動方式與安全邊界',
      '把怕尷尬、怕跟不上、怕太陌生先降下來',
      '適合想被更細緻照顧，再進入正式場次的人',
    ],
    checkoutUrl: siteConfig.lineUrl,
    ctaLabel: '購買 Private Onboarding',
    ctaVariant: 'ghost',
  },
]

export const offersSessionSectionContent = {
  title: '選一個讓自己鬆開的夜晚',
  subtitle:
    '選一個願意留給自己的夜晚。到了現場，剩下交給我們。',
  ruleLine: '每月 1 個梯次 × 3 個場館限量開放',
  footnote: '各館名額與釋出狀態，以當月實際公告為準。',
  bookCtaLabel: '用 LINE 預留名額',
}

export const sessions: Session[] = [
  {
    id: 'session-dunnan',
    venueId: 'venue-dunnan',
    venueName: '台北 — 敦南旗艦館',
    date: '2026 年 X 月 X 日',
    weekday: 'Fri',
    time: '22:00 - 23:30',
    capacity: '仍可報名',
    lineUrl: 'https://lin.ee/dTCkydS',
    coachIds: ['coach-lead', 'coach-rhythm'],
  },
  {
    id: 'session-neihu',
    venueId: 'venue-neihu',
    venueName: '台北 — 內科模範館',
    date: '2026 年 X 月 X 日',
    weekday: 'Fri',
    time: '22:00 - 23:30',
    capacity: '名額緊張',
    lineUrl: 'https://lin.ee/baMDUpI',
    coachIds: ['coach-lead', 'coach-safety'],
  },
  {
    id: 'session-taichung',
    venueId: 'venue-taichung',
    venueName: '台中 — 台中勤美旗艦館',
    date: '2026 年 X 月 X 日',
    weekday: 'Fri',
    time: '22:00 - 23:30',
    capacity: '即將額滿',
    lineUrl: 'https://lin.ee/Hhi6BCP',
    coachIds: ['coach-rhythm', 'coach-safety'],
  },
]

export const offersStatusCopy = {
  notLoggedIn: 'LINE Login 後解鎖四次完整內容、活動場次、費用資訊與可報名名額。',
  noSession: '本月名額已滿。先加入 LINE，下一次開放時會優先通知你。',
  almostFull: '這個場館名額不多了，想進場就不要再等等。',
  awaitingRelease: '本月場次即將開放，先加入 LINE，我們會先通知你。',
}

// ── 群體身份區 ────────────────────────────────────
export const identityContent = {
  title: '你買的不只是脫離生活的入場券。',
  subtitle: '而是今晚你屬於哪一群人。',
  description:
    '這是決定今晚你要不要走進場，成為這個夜晚的一部分。進場的人都是來進入狀態的。',
}

// ── FAQ ───────────────────────────────────────────
export const faqItems: FAQItem[] = [
  {
    id: 'faq-1',
    question: '沒打過拳可以嗎？',
    answer:
      '完全可以。Fight Night 不是技術課，而是節奏引導的集體體驗。所有動作都會被現場帶著走，你只要跟著節奏進入狀態就好。零基礎完全沒問題。',
  },
  {
    id: 'faq-2',
    question: '女生適合嗎？',
    answer:
      '非常適合。過去場次女性參與者超過四成。拳擊節奏體驗不分性別——只要你想釋放，這裡就是你的場地。',
  },
  {
    id: 'faq-3',
    question: '拳套可以帶走嗎？',
    answer:
      '依方案而定。First Round 可租用或自備拳套；First Round Gear 與 Signature Gear 都附可帶走的專屬拳套。',
  },
  {
    id: 'faq-4',
    question: '平常沒在運動，會不會跟不上？',
    answer:
      '不會。全程有教練帶動節奏，強度可以自己調整。這不是體能測驗，是情緒體驗——重點不是你打多用力，而是你有沒有進入狀態。',
  },
  {
    id: 'faq-5',
    question: '可以跟朋友一起參加嗎？',
    answer:
      '當然可以。雖然現在沒有雙人綁定方案，但你們可以各自選擇適合自己的入口，一起預約同一場進場。',
  },
  {
    id: 'faq-6',
    question: '結束後直接散場嗎？',
    answer:
      '不會。活動結束後有「後場社交時段」，在ARM BAR 享受音樂、飲品、亢奮後的餘韻。很多人在這個環節認識了後來持續約出來的朋友。',
  },
]

// ── Final CTA ─────────────────────────────────────
export const finalCtaContent = {
  title: '不是每個夜晚都值得出門。',
  subtitle: '先看活動場次與費用資訊，再決定這一場是不是你要的入口。',
  primaryCta: '查看活動場次 / 費用資訊',
  ghostCta: '先加 LINE 取得通知',
}

// ── 場館資訊 ──────────────────────────────────────
export type Venue = {
  id: string
  name: string
  address: string
  transit: string
  lineUrl: string
}

export const venues: Venue[] = [
  {
    id: 'venue-dunnan',
    name: '台北 — 敦南旗艦館',
    address: '台北市大安區安和路一段27號 B1',
    transit: '捷運忠孝敦化站5號出口，步行2分鐘',
    lineUrl: 'https://lin.ee/dTCkydS',
  },
  {
    id: 'venue-neihu',
    name: '台北 — 內科模範館',
    address: '台北市內湖區洲子街55號1F',
    transit: '捷運港墘站2號出口，步行1分鐘',
    lineUrl: 'https://lin.ee/baMDUpI',
  },
  {
    id: 'venue-taichung',
    name: '台中 — 台中勤美旗艦館',
    address: '台中市西區公益路68號12、13F',
    transit:
      '台中高鐵站免費接駁專車（往中國醫藥大學），至科博館站，步行5分鐘',
    lineUrl: 'https://lin.ee/Hhi6BCP',
  },
]
