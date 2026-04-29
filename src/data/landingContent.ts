import type {
  PainPoint,
  FrameworkCard,
  FormulaItem,
  FlowStep,
  AudiencePoint,
  TicketPlan,
  FAQItem,
  Coach,
  Session,
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
  primaryCta: '立即搶位',
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
  title: '選你的入場方式',
  subtitle: '方案還在，但價格、名額與場次，只開放給準備進場的人看。',
  description: 'LINE 登入後可查看完整方案、教練資訊、可報名場次與即時名額。',
  footnote: '不是每個人都需要先知道價格。先看你是不是準備好進場。',
  unifiedCtaLabel: 'LINE 登入查看方案與報價',
  maskedPrice: 'NT$ ••••',
  teaserHint: '登入後查看完整內容',
}

export const ticketPlans: TicketPlan[] = [
  {
    id: 'starter-pass',
    name: 'Starter Pass',
    subtitle: '租用 / 自備拳套',
    teaserCopy: '第一次進場，先用最輕的方式進來。',
    description: '適合第一次進場，想先感受 Fight Night 的人。',
    price: 'NT$1,800',
    features: [
      'Fight Night 入場資格',
      '拳套可租用或自備',
      '完整TRAIN DIFFERENT體驗',
      'Pro Fighter 職業選手合照與簽名',
    ],
    ctaLabel: '用 LINE 預留 Starter Pass',
    ctaVariant: 'secondary',
  },
  {
    id: 'boutique-pass',
    name: 'Boutique Pass',
    subtitle: '單人附專屬拳套',
    teaserCopy: '一個人來，也可以完整擁有自己的儀式感。',
    description: '給想完整參與，也想把這次體驗帶回生活裡的人。',
    price: 'NT$3,000',
    badge: '附專屬拳套',
    features: [
      'Fight Night 入場資格',
      '專屬拳套一副（帶走）',
      '單人體驗紀念',
      '完整TRAIN DIFFERENT體驗',
      'Pro Fighter 職業選手合照與簽名',
    ],
    highlight: true,
    ctaLabel: '用 LINE 預留 Boutique Pass',
    ctaVariant: 'primary',
  },
  {
    id: 'signature-pass',
    name: 'Signature Pass',
    subtitle: '個人',
    teaserCopy: '給想把這一晚，變成自己身份的人。',
    description: '給想用最完整的方式進場的人。',
    price: 'NT$3,600',
    badge: 'VIP體驗',
    features: [
      'Fight Night VIP 入場',
      '限定色系拳套一副（帶走）',
      '專屬VIP紀念品',
      '完整TRAIN DIFFERENT體驗',
      'Pro Fighter 職業選手合照與簽名',
      'VIP專屬休息區',
    ],
    ctaLabel: '用 LINE 預留 Signature Pass',
    ctaVariant: 'secondary',
  },
]

// ── /offers 頁面文案 ──────────────────────────────
export const offersHeroContent = {
  title: '你已進入 Fight Night 入場資訊',
  subtitle: '這裡有完整方案、報價、教練與本月可報名場次。',
  description:
    '每月只開一晚。第一個星期五，晚上 10:00。三館同步開放，額滿就等下個月。',
  primaryCta: '查看本月仍有名額的場次',
  secondaryCta: '往下看完整方案',
}

export const offersPlanSectionContent = {
  title: '方案與報價',
  subtitle: '選你要怎麼進場。差別不只是票價，而是你想用什麼方式記住這一晚。',
  footnote: '票種會影響你怎麼進場，但不影響你會不會被帶進去。',
}

export const offersCoachSectionContent = {
  title: '今晚帶你進場的教練',
  subtitle: '不是帶你做完一堂課，而是把你安全地帶進那個會上癮的狀態。',
  description:
    '從暖身、分組、節奏堆疊到情緒釋放，整套流程都不是即興，而是經過編排。高能量帶動，但控制精準；讓每一個人都能在安全邊界內，被帶進去。',
}

export const coaches: Coach[] = [
  {
    id: 'coach-lead',
    name: 'Coach Ray',
    title: '主帶教練',
    bio: '十年以上拳擊與團體節奏帶動經驗，專注於把高能量現場帶到精準控制的安全邊界內。',
    tags: ['拳擊教學', '團體帶動', '節奏編排', '安全控場'],
  },
  {
    id: 'coach-rhythm',
    name: 'Coach Mia',
    title: '節奏編排',
    bio: '把每一場 Fight Night 的節奏堆疊曲線設計到精準秒數，讓情緒波形被安全地推上去。',
    tags: ['節奏編排', '團體帶動'],
  },
  {
    id: 'coach-safety',
    name: 'Coach Jin',
    title: '安全控場',
    bio: '負責現場分組與安全邊界，讓零基礎的人也能在不受傷的前提下被完全帶進去。',
    tags: ['安全控場', '拳擊教學'],
  },
]

export const offersSessionSectionContent = {
  title: '本月仍有名額的場次',
  subtitle:
    '每月只開一晚。第一個星期五，晚上 10:00。三個場館同步開放，名額滿了就等下個月。',
  ruleLine: '1 個場次 × 3 個場館地點',
  footnote: '名額狀態依各館實際釋出為準。',
  bookCtaLabel: '用 LINE 預留名額',
}

export const sessions: Session[] = [
  {
    id: 'session-dunnan',
    venueId: 'venue-dunnan',
    venueName: '台北 — 敦南旗艦館',
    date: '2026 年 5 月 1 日',
    weekday: 'Fri',
    time: '22:00 - 23:30',
    capacity: '仍可報名',
    lineUrl: 'https://lin.ee/dTCkydS',
  },
  {
    id: 'session-neihu',
    venueId: 'venue-neihu',
    venueName: '台北 — 內科模範館',
    date: '2026 年 5 月 1 日',
    weekday: 'Fri',
    time: '22:00 - 23:30',
    capacity: '名額緊張',
    lineUrl: 'https://lin.ee/baMDUpI',
  },
  {
    id: 'session-taichung',
    venueId: 'venue-taichung',
    venueName: '台中 — 台中勤美旗艦館',
    date: '2026 年 5 月 1 日',
    weekday: 'Fri',
    time: '22:00 - 23:30',
    capacity: '即將額滿',
    lineUrl: 'https://lin.ee/Hhi6BCP',
  },
]

export const offersVenueSectionContent = {
  title: '你要在哪裡進場？',
  subtitle: '選一個你最容易出現的地方，剩下的交給我們。',
  ctaLabel: '加入這個場館的 LINE',
}

export const offersFinalCtaContent = {
  title: '如果你已經看到這裡，就差最後一步。',
  subtitle: '選方案、選場館、預留名額。剩下的，交給這一晚把你帶進去。',
  primaryCta: '用 LINE 預留我的名額',
  secondaryCta: '回到方案與報價',
}

export const offersStatusCopy = {
  notLoggedIn: 'LINE 登入後查看完整方案、報價與可報名場次。',
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
      '完全可以。Fight Night 不是拳擊教學，是節奏引導的集體體驗。所有動作都會被教練帶領，你只要跟著節奏出拳就好。零基礎完全沒問題。',
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
      '依票種而定。Starter Pass 可租用或自備拳套；Boutique Pass 與 Signature Pass 都附專屬拳套，活動結束後可以直接帶走。',
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
      '當然可以。你們可以各自選擇適合自己的 Pass 一起進場；如果想要附專屬拳套，可以選 Boutique Pass 或 Signature Pass。',
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
  subtitle: '但如果你最近真的需要一個出口，這一場，值得。',
  primaryCta: '選擇你的 Pass',
  ghostCta: '先加 LINE 聊聊',
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
