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
    '你會看到 LINE 會員專屬內容入口。快速登入後，可查看四堂課完整訓練體系、活動場次、費用資訊、教練資訊與可報名名額。',
  footnote:
    '想先確認這是不是一套你想認真投入的訓練系統，再決定要不要進場，這就是你該點的地方。',
  unifiedCtaLabel: '查看活動場次 / 費用資訊',
  teaserHint: 'LINE 會員專屬內容',
  previewTitle: '這個頁面會解鎖什麼？',
  previewItems: ['四堂課訓練體系', '活動場次', '費用資訊', '教練資訊'],
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
  title: '不是只來發洩，而是四堂課後換一個自己',
  subtitle: '從壓力與壓迫裡低頭忍受，到重新掌握力量、判斷與底氣',
  description:
    '完成 LINE Login 後，即可查看這套四堂蛻變系統怎麼運作、為什麼能改善壓力反應、有哪些場次與教練配置，以及適合你的參與方案。',
  primaryCta: '快速登入查看',
  secondaryCta: '先看這套系統怎麼改變你',
}

export const offersCurriculumSectionContent = {
  title: '四堂蛻變系統，怎麼把壓力出口變成真正的底氣',
  subtitle:
    '不是學幾個動作，而是把釋放、力量、判斷與自信，一步一步帶回你身上。',
  description:
    '這套系統不是要你硬撐或逞強，而是先讓長期悶住的壓力有出口，再把出力、距離、節奏與反應反覆帶進身體裡。四堂課走完，你帶走的不只是流汗後的暫時輕鬆，而是更能掌握力量、看懂情況、穩住自己的狀態。',
  overlayTitle: '登入後查看四堂蛻變系統',
}

export const curriculumModules: CurriculumModule[] = [
  {
    id: 'module-1',
    stage: 1,
    title: '先讓壓力有出口，不再只是低頭忍住',
    description:
      '從呼吸、站姿、出力與節奏開始，把長期悶在身體裡的緊繃、壓力與負面情緒慢慢打開。',
  },
  {
    id: 'module-2',
    stage: 2,
    title: '把釋放變成力量，找回自己的掌握感',
    description:
      '透過拳擊與踢拳基礎，學會怎麼站穩、怎麼出力、怎麼讓力量真的從自己身上長出來，而不是只剩下承受。',
  },
  {
    id: 'module-3',
    stage: 3,
    title: '把力量變成判斷，不再一慌就亂',
    description:
      '把距離、節奏、防身觀念與反應帶進來，讓你面對靠近、壓迫與突發情況時，開始看得懂、穩得住。',
  },
  {
    id: 'module-4',
    stage: 4,
    title: '把判斷變成底氣，帶走全新的狀態',
    description:
      '最後把釋放、力量、距離與反應整合起來，讓你帶走的不只是體驗，而是一個更有氣勢、更不容易被壓住的自己。',
  },
]

export const offersPlanSectionContent = {
  title: '方案內容',
  subtitle: '依你想先進場感受、直接投入完整四堂，或帶走更完整裝備與紀念，選擇適合你的版本。',
  footnote: '如果你要的是明顯的狀態改變，會更推薦直接進入完整四堂系統。',
}

export const offersPlans: TicketPlan[] = [
  {
    id: 'offers-session-pass',
    name: '單次進場體驗',
    subtitle: '先感受 Fight Night 的出力與釋放',
    teaserCopy: '先讓自己進場，感受這套系統的第一道出口。',
    description: '適合想先感受節奏、釋放與現場氛圍的人。',
    price: 'NT$1,800',
    features: [
      '單次 Fight Night 進場資格',
      '拳套可租用或自備',
      '在高能量帶領中先打開壓力出口',
      '適合先確認自己喜不喜歡這套體驗',
    ],
    ctaLabel: '用 LINE 詢問單次體驗',
    ctaVariant: 'secondary',
  },
  {
    id: 'offers-transformation-pass',
    name: '四堂蛻變系統',
    subtitle: '主推方案',
    teaserCopy: '不是只來一次，而是讓狀態真的往前走。',
    description: '給想真正改善壓力反應、力量感與底氣的人。',
    price: 'NT$3,000',
    badge: '主推方案',
    features: [
      '四堂循序設計的完整訓練系統',
      '從壓力釋放到力量、距離與判斷的建立',
      '女性新手也能跟上的節奏帶領與動作拆解',
      '比單次體驗更能感受到整體狀態改變',
    ],
    highlight: true,
    ctaLabel: '用 LINE 預留四堂方案',
    ctaVariant: 'primary',
  },
  {
    id: 'offers-upgrade-pass',
    name: '四堂蛻變系統＋專屬裝備',
    subtitle: '完整進場版本',
    teaserCopy: '把這段改變，真正帶回你的生活裡。',
    description: '給想把這次力量感與新狀態延續回日常的人。',
    price: 'NT$3,600',
    badge: '附專屬拳套',
    features: [
      '包含四堂蛻變系統完整內容',
      '專屬拳套一副（帶走）',
      '把這次力量感與新狀態延續回日常',
      '適合想更完整投入這次改變的你',
    ],
    ctaLabel: '用 LINE 詢問完整進場',
    ctaVariant: 'secondary',
  },
]

export const offersCoachSectionContent = {
  title: '教練資訊',
  subtitle: '不是只看頭銜，而是看誰真的能把力量、距離與判斷教到新手身上。',
  description:
    '這裡的專業，不是把人操到極限，而是讓原本只會低頭忍受的人，透過有節奏的帶領、正確的出力與清楚的反應設計，慢慢長出穩定、底氣與判斷。',
}

export const coaches: Coach[] = [
  {
    id: 'coach-lead',
    name: 'Coach Ray',
    title: '海外職業綜合格鬥選手 / 系統主帶教練',
    bio: '擅長把原本只存在在職業訓練裡的力量、節奏與反應邏輯，拆成女性新手也能理解的步驟，讓人從壓力反應裡重新找回掌握感。',
    tags: ['綜合格鬥', '拳擊教學', '防身術', '安全控場'],
  },
  {
    id: 'coach-rhythm',
    name: 'Coach Aya',
    title: '踢拳節奏編排 / 身體流動訓練',
    bio: '負責把節奏、移動與拳腳連結帶進課程，讓原本緊繃、卡住的身體，慢慢學會流動、出力與順暢反應。',
    tags: ['節奏編排', '團體帶動', '拳擊教學'],
  },
  {
    id: 'coach-safety',
    name: 'Coach Jin',
    title: '防身反應 / 安全控場',
    bio: '把距離判斷、安全邊界與防身觀念轉成新手聽得懂的練習，幫助學員在壓力靠近時，不再只剩下慌張與退縮。',
    tags: ['安全控場', '防身術', '拳擊教學'],
  },
]

export const offersSessionSectionContent = {
  title: '活動場次',
  subtitle:
    '每月只開一晚。第一個星期五，晚上 10:00。登入後查看三館同步開放的可報名狀態。',
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
    coachIds: ['coach-lead', 'coach-rhythm'],
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
    coachIds: ['coach-lead', 'coach-safety'],
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
    coachIds: ['coach-rhythm', 'coach-safety'],
  },
]

export const offersVenueSectionContent = {
  title: '場館地點',
  subtitle: '登入後查看各館入口、地點與對應資訊。',
  ctaLabel: '加入這個場館的 LINE',
}

export const offersFinalCtaContent = {
  title: '準備好，不再只把一切吞下去。',
  subtitle:
    '登入後查看四堂蛻變系統、場次、教練與方案，選一個讓自己真的改變的入口。',
  primaryCta: '快速登入查看',
  secondaryCta: '回到頁面上方',
}

export const offersStatusCopy = {
  notLoggedIn: 'LINE Login 後解鎖四堂課訓練體系、活動場次、費用資訊與可報名名額。',
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
