import type {
  PainPoint,
  FrameworkCard,
  FormulaItem,
  FlowStep,
  AudiencePoint,
  TicketPlan,
  FAQItem,
  CurriculumModule,
  CourseCategory,
  BootCampRoute,
} from '../types'

// ── 全域設定 ──────────────────────────────────────
export const siteConfig = {
  brandName: 'UFCGYM TAIWAN',
  eventName: 'Fight Night',
  lineUrl: 'https://page.line.me/488ujlbg',
  // 方案卡負責帶到可購買場次；指定場次付款由 SHOPLINE checkout session 建立。
  ticketUrl: '#ticket',
  offersUrl: '/offers',
  bootCampUrl: '/boot-camp',
}

// ── Hero ─────────────────────────────────────────
export const heroContent = {
  title: '今晚，一起進入狀態。',
  subtitle: '這是一張讓你脫離日常的入場券。',
  primaryCta: '選日期購買',
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
      '同樣口令，同樣動作，身體的同步會啟動大腦的鏡像系統，不需要語言就能製造深層連結。',
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
      '透過教練高能量的口令引導，隨著回合與強度的堆疊，你也不自覺地跟著大家一起出拳、一起進入狀態。',
    emotionLevel: 7,
  },
  {
    id: 'flow-4',
    stage: 4,
    title: '全力專注並釋放情緒',
    description:
      '隨著動作與回合的堆疊，你漸漸專注到只剩下教練口令、身體反應和眼前的沙包，只剩下純粹的情緒釋放。',
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
  { id: 'aud-3', text: '喜歡被教練帶動、跟著回合一步步進入狀態', icon: '🥊' },
  { id: 'aud-4', text: '想跟朋友做一件不一樣的事，不是又吃飯又唱歌', icon: '🤝' },
  { id: 'aud-5', text: '想認識一群有能量、不混日子的人', icon: '⚡' },
  { id: 'aud-6', text: '覺得最近需要一個出口，什麼形式都好', icon: '🔓' },
]

// ── 票種區（首頁 teaser + 登入後完整資訊共用資料） ─────
export const ticketSectionContent = {
  title: 'Fight Night Pass',
  subtitle: '先替今晚的自己留一個出口。',
  description:
    '如果你只想先嘗試一次，直接選一個方便到場的場次，把今晚留下來。',
  unifiedCtaLabel: '選日期購買',
  previewItems: ['目前可購買場次', '指定日期保留', '今晚重新進入狀態'],
}

export const fightNightPassPlan: TicketPlan = {
  id: 'fight-night-pass',
  name: 'Fight Night Pass',
  subtitle: '今晚先讓自己回到有狀態的樣子',
  teaserCopy: '買的不是內容，是今晚重新被點燃的期待。',
  description:
    '適合想先體驗一次 Fight Night 的人。你不是要先學會什麼技術，而是讓身體確認：自己還可以流汗、被帶動、釋放，從日常裡走出來。',
  price: 'NT$680 起',
  badge: '首頁限定',
  features: [
    '指定日期 Fight Night 入場資格',
    '教練口令、拳套與沙包回合',
    '新手可跟，不對打、不被打',
  ],
  highlight: true,
  checkoutUrl: siteConfig.lineUrl,
  ctaLabel: '選日期購買',
  ctaVariant: 'primary',
}

// ── /offers 頁面文案 ──────────────────────────────
export const offersHeroContent = {
  title: 'Boot Camp 完整方案',
  subtitle: '把那個想改變的期待，變成每週會出現的自己。',
  description:
    'Boot Camp 不是把你變成拳擊手或泰拳手，而是替那個想更穩、更敢、更有行動感的自己，先保留一段連續出現的時間。',
  primaryCta: '快速登入查看',
  secondaryCta: '先看完整系統',
}

export const offersCurriculumSectionContent = {
  title: '你買的不是四堂課，而是接下來四週的自己。',
  subtitle:
    '職業 Fighter 最迷人的地方，不是會多少招式，而是在壓力靠近時還能保持存在感。',
  description:
    'Boot Camp 的重點是先把接下來幾週的同一個時段保留下來。你不用每週重新決定要不要運動，而是從基礎或體適能課開始，讓固定訓練真的發生。',
}

export const curriculumModules: CurriculumModule[] = [
  {
    id: 'module-1',
    stage: 1,
    title: '更多體驗與刺激',
    description:
      '每一次都是不同的體驗，讓教練口令、動作節奏、沙包、回合與群體能量逐次加深。你不只知道它很嗨，還會知道自己怎麼進入狀態。',
  },
  {
    id: 'module-2',
    stage: 2,
    title: '讓刺激變得有意義',
    description:
      '刺激如果只停在當下，很快就散掉。課程的編排會把 Fighter 面對壓力的經驗轉成你能跟上的身體流程，讓那份刺激變成反射記憶。',
  },
  {
    id: 'module-3',
    stage: 3,
    title: '物理性適應壓力靠近',
    description:
      '在安全邊界內感受速度、靠近感與壓迫，讓身心都學會：壓力靠近時，不只能僵住或逃開。',
  },
  {
    id: 'module-4',
    stage: 4,
    title: '壓力下做出下一步',
    description:
      '你會開始理解如何在混亂、緊張和疲累裡做出下一步。這不是紙上談兵，而是身體真的練過一遍。',
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

export const bootCampFaqItems: FAQItem[] = [
  {
    id: 'bootcamp-faq-1',
    question: 'Boot Camp 和 Fight Night 差在哪？',
    answer:
      'Fight Night 是單次入場，體驗這種高能量的運動娛樂，如何觸動你的情緒。Boot Camp 則會用固定的頻率、習慣、系統化的課程編排，由內到外的改變你。',
  },
  {
    id: 'bootcamp-faq-2',
    question: '四堂課會不會只是重複上同一套？',
    answer:
      '不會，系統化的訓練能保障你每一次課程循序漸進。每週固定頻率，讓身體一次比一次更容易進入狀態。',
  },
  {
    id: 'bootcamp-faq-3',
    question: '所以 Boot Camp 是學拳擊或泰拳技術嗎？',
    answer:
      '拳擊與泰拳是進入方式，核心是向職業 Fighter 學壓力應對：壓力靠近時，怎麼穩住、怎麼呼吸、怎麼做下一步。',
  },
  {
    id: 'bootcamp-faq-4',
    question: '拳擊 Boot Camp 和泰拳／踢拳 Boot Camp 怎麼選？',
    answer:
      '常把壓力往肚裡吞、需要邊界感，選拳擊。悶太久、想點燃全身打開狀態，選泰拳／踢拳。',
  },
  {
    id: 'bootcamp-faq-5',
    question: '沒有拳擊基礎，適合直接選 Boot Camp 嗎？',
    answer:
      '可以，我們建議從【體適能 / 基礎】開始，隨著進度可以升階至【技巧】以上的課程。',
  },
  {
    id: 'bootcamp-faq-6',
    question: '兩堂或四堂 Boot Camp 會怎麼安排？',
    answer:
      '你會先選第一堂的館別、日期、時間與路徑；後續課程會安排在同館同時段。完成購買前可以先確認每一堂日期。',
  },
  {
    id: 'bootcamp-faq-7',
    question: '教練是固定同一位嗎？',
    answer:
      '是的，你選擇的課程教練，就如同課程卡片中所描述，詳細資訊可見教練介紹。',
  },
  {
    id: 'bootcamp-faq-refund',
    question: 'Boot Camp 可以取消、改期或退款嗎？',
    answer:
      '若付款後尚未使用課程，可於付款日起七日內依退款與取消政策提出申請；若已開始上課、已報到或未滿 24 小時取消，會依實際使用與名額安排狀況處理。',
    linkHref: '/refund-policy',
    linkLabel: '查看退款與取消政策',
  },
]

export const offersPlanSectionContent = {
  title: '選擇你想留下的改變路徑',
  subtitle: '所有 Boot Camp 都是向職業 Fighter 學習應對壓力；拳擊與泰拳只是兩種不同的期待入口。',
  footnote: '剩餘名額會依線上訂單即時更新；售完後該場次就不再開放線上購買。',
}

export const bootCampCoreContent = {
  eyebrow: 'BOOT CAMP CORE',
  title: '面對壓力的技巧變成身體記憶',
  description:
    '職業格鬥選手終其一生都在練習：如何面對恐懼、壓力、打擊，以及重新站起來的能力。',
  pillars: [
    {
      title: '進入壓力',
      description: '可承受範圍內面對壓力。',
    },
    {
      title: '被教練接住',
      description: '用技術反應找回節奏。',
    },
    {
      title: '形成記憶',
      description: '讓習慣，變成身體反應留下來。',
    },
  ],
}

export const bootCampRouteContent: Record<
  BootCampRoute,
  {
    label: string
    shortLabel: string
    badge: string
    hint: string
    fighterLesson: string
    headline: string
    summary: string
    bestFor: string
    skills: string[]
    weekPlan: string[]
  }
> = {
  BOXING: {
    label: '拳擊 Boot Camp',
    shortLabel: '拳擊',
    badge: '拳擊入門',
    hint: '站姿、出拳、移動、沙包回合',
    fighterLesson: '從站姿、出拳和沙包回合開始，練到清楚有力。',
    headline: '適合想從拳擊基本動作開始的人。',
    summary:
      '拳擊路徑會從站姿、出拳、移動和沙包回合開始。你不用先會打拳，教練會把動作拆小，讓你知道自己為什麼這樣做。',
    bestFor: '適合第一次想試拳擊，或想用沙包訓練大量流汗的人。',
    skills: ['站姿', '出拳', '移動', '沙包回合'],
    weekPlan: [
      '站姿、出拳和基本防守',
      '腳步移動和沙包回合',
      '組合拳與體能回合',
      '把前幾週動作接成完整訓練',
    ],
  },
  MUAY_THAI: {
    label: '泰拳／踢拳 Boot Camp',
    shortLabel: '泰拳／踢拳',
    badge: '踢拳入門',
    hint: '踢拳組合、高流汗、沙包回合',
    fighterLesson: '用踢拳組合和體能回合，讓全身一起流汗。',
    headline: '適合想要更高流汗量的人。',
    summary:
      '泰拳／踢拳路徑會加入拳、踢、膝和重心轉換，流汗量更高。教練會把組合拆開帶，不需要先有泰拳底子。',
    bestFor: '適合想試泰拳或踢拳，喜歡全身動起來、流汗量更高的人。',
    skills: ['踢拳組合', '重心轉換', '沙包回合', '體能回合'],
    weekPlan: [
      '站姿、出拳和基本踢擊',
      '踢拳組合與重心轉換',
      '沙包回合與體能回合',
      '把踢拳組合接成完整訓練',
    ],
  },
}

export const offersOutcomeSectionContent = {
  title: '不只是很嗨的夜晚。',
  subtitle:
    'Fight Night是讓人期待的入口，但真正價值來自一套從感官刺激到身心變化的完整結構。',
  formulaLabel: 'Boot Camp完整系統的結構',
  formulaInputs: ['刺激進場', '壓力排空', '身體適應', '心理成長'],
  formulaResult: '從釋放壓力的痛快，變成帶得走的能力',
}

// Plan ID → 對應的課表入口。方案卡只負責帶使用者去選場次，不再直接代表購買完成。
export const planScheduleTargetMap: Record<
  string,
  { category: CourseCategory; route?: BootCampRoute }
> = {
  'offers-bootcamp-boxing-2': { category: 'BOOT_CAMP', route: 'BOXING' },
  'offers-bootcamp-muaythai-2': { category: 'BOOT_CAMP', route: 'MUAY_THAI' },
  'offers-bootcamp-boxing-4': { category: 'BOOT_CAMP', route: 'BOXING' },
  'offers-bootcamp-muaythai-4': { category: 'BOOT_CAMP', route: 'MUAY_THAI' },
}

// 課表卡上「可用方案」摘要：每個 category 顯示入門價
// BOOT_CAMP 不能單堂買，最低是兩堂套票，所以價格帶「起」並用 hint 提示升級路徑
export const planSummaryByCategory: Record<
  CourseCategory,
  { label: string; price: string; hint?: string }
> = {
  FIGHT_NIGHT: {
    label: 'Fight Night Pass',
    price: 'NT$680 起',
  },
  BOOT_CAMP: {
    label: 'Boot Camp 路徑',
    price: 'NT$1,280 起',
    hint: '兩堂/四堂',
  },
}

export const offersPlans: TicketPlan[] = [
  {
    id: 'offers-bootcamp-boxing-2',
    name: '拳擊 Boot Camp｜兩堂入門',
    subtitle: '拳擊入門：站姿、出拳、沙包回合',
    teaserCopy: '用兩堂先確認拳擊是不是你能固定來的訓練。',
    description:
      '適合第一次想試拳擊的人。先從站姿、出拳和沙包回合開始，讓你知道自己能不能跟上、喜不喜歡這種訓練。',
    price: 'NT$1,280 起',
    features: [
      '兩堂同館同時段',
      '新手可上，不對打',
      '站姿、出拳、沙包回合',
      '售完就不再開放線上購買',
    ],
    checkoutUrl: siteConfig.lineUrl,
    ctaLabel: '選拳擊兩堂場次',
    ctaVariant: 'secondary',
  },
  {
    id: 'offers-bootcamp-muaythai-2',
    name: '泰拳／踢拳 Boot Camp｜兩堂入門',
    subtitle: '踢拳入門：拳、踢、體能回合',
    teaserCopy: '想要更高流汗量，先用兩堂感受踢拳訓練。',
    description:
      '適合想試泰拳或踢拳的人。拳、踢、移動和體能回合會讓全身一起動，但不需要先有泰拳底子。',
    price: 'NT$1,280 起',
    features: [
      '兩堂同館同時段',
      '新手可上，不對打',
      '踢拳組合、沙包與體能回合',
      '售完就不再開放線上購買',
    ],
    checkoutUrl: siteConfig.lineUrl,
    ctaLabel: '選泰拳／踢拳兩堂場次',
    ctaVariant: 'secondary',
  },
  {
    id: 'offers-bootcamp-boxing-4',
    name: '拳擊 Boot Camp｜四堂養成',
    subtitle: '主推：每週固定練拳擊',
    teaserCopy: '保留接下來四週同一個時間，把拳擊排進生活。',
    description:
      '適合想固定運動的人。四堂課會從拳擊基礎、沙包回合和體能回合開始，讓你每週都有人帶著完成訓練。',
    price: 'NT$2,680 起',
    badge: '主推路徑',
    features: [
      '四堂同館同時段',
      '拳擊基礎、沙包與體能回合',
      '適合想建立固定運動習慣',
      '售完就不再開放線上購買',
    ],
    highlight: true,
    checkoutUrl: siteConfig.lineUrl,
    ctaLabel: '選拳擊四堂場次',
    ctaVariant: 'primary',
  },
  {
    id: 'offers-bootcamp-muaythai-4',
    name: '泰拳／踢拳 Boot Camp｜四堂養成',
    subtitle: '主推：每週固定練踢拳',
    teaserCopy: '保留接下來四週同一個時間，用踢拳回合建立運動節奏。',
    description:
      '適合想要更高流汗量的人。四堂課會用踢拳組合、沙包和體能回合，讓你每週固定完成一場全身訓練。',
    price: 'NT$2,680 起',
    badge: '全身路徑',
    features: [
      '四堂同館同時段',
      '踢拳組合、沙包與體能回合',
      '適合想要更高流汗量',
      '售完就不再開放線上購買',
    ],
    checkoutUrl: siteConfig.lineUrl,
    ctaLabel: '選泰拳／踢拳四堂場次',
    ctaVariant: 'secondary',
  },
  {
    id: 'offers-private-intro',
    name: 'Private Onboarding｜私人預備課',
    subtitle: '給想先被接住的人',
    teaserCopy: '不是降低強度，是先把安全感建立起來。',
    description:
      '一對一或小班式預備體驗。先熟悉場域、節奏、邊界與互動方式，正式進場時把注意力留給訓練本身。',
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

export const offersStatusCopy = {
  notLoggedIn: 'LINE 登入後即可查看可購買日期、即時剩餘名額與價格。',
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
    question: '這到底是拳擊課、團課，還是防身課？',
    answer:
      'Fight Night 是精心編排的入門娛樂體驗課，不是傳統技術課，也不是實戰對打或防身課。你會跟著教練口令、沙包與基礎動作進入狀態，先用一晚確認這是不是你的壓力出口。',
  },
  {
    id: 'faq-2',
    question: '會不會對打？會不會被打？',
    answer:
      '不會。現場不安排學員互相攻防，也不會讓你被打。主要動作會放在拳套、沙包、節奏與教練帶動上，教練會控場並提醒安全邊界。',
  },
  {
    id: 'faq-3',
    question: '沒打過拳、平常沒在運動可以嗎？',
    answer:
      '可以。動作會從零基礎能跟上的內容開始，強度也可以自己調整。你不需要先有拳擊經驗；更重要的是願意跟著節奏動起來。',
  },
  {
    id: 'faq-4',
    question: '一個人去會不會尷尬？',
    answer:
      '不會。這種活動反而很適合一個人來，因為大部分時間都在跟著教練口令、動作編排和全場節奏走。你不需要先認識誰，也不需要自己找話題進入狀態。',
  },
  {
    id: 'faq-5',
    question: '需要帶什麼？穿什麼？',
    answer:
      '穿適合流汗與活動的運動服、運動鞋即可。建議自備水與替換衣物；館內提供 UFC GYM 專屬大毛巾，拳套依方案可租用、自備，或選擇附專屬拳套的方案。',
  },
  {
    id: 'faq-6',
    question: '有更衣室、淋浴和置物空間嗎？',
    answer:
      '有。場館提供感應式手環智能置物櫃，不需要自備鎖頭；淋浴間備有星級酒店御用的 SPA 沐浴用品，課後可以整理好再離開。',
  },
  {
    id: 'faq-8',
    question: '可以退款、轉讓或改期嗎？',
    answer:
      '若付款後尚未使用課程，可於付款日起七日內依退款與取消政策提出申請；若已開始上課、已報到或未滿 24 小時取消，會依實際使用與名額安排狀況處理。',
    linkHref: '/refund-policy',
    linkLabel: '查看退款與取消政策',
  },
]

// ── Final CTA ─────────────────────────────────────
export const finalCtaContent = {
  title: '先進場一次，再決定要不要走完整旅程。',
  subtitle: '',
  primaryCta: '選日期購買',
  ghostCta: '先加 LINE 取得通知',
}

// ── 場館資訊 ──────────────────────────────────────
export type Venue = {
  id: string
  name: string
  address: string
  transit: string
  lineUrl: string
  mapEmbedUrl: string
}

export const venues: Venue[] = [
  {
    id: 'venue-dunnan',
    name: '台北 — 敦南旗艦館',
    address: '台北市大安區安和路一段27號 B1',
    transit: '捷運忠孝敦化站5號出口，步行2分鐘',
    lineUrl: 'https://page.line.me/488ujlbg',
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.8455611296736!2d121.54767441193627!3d25.03931467772036!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3442abcf90bf71ab%3A0x7d7e74bdafe72664!2zVUZDIEd5bSDmlabljZfml5foiabppKg!5e0!3m2!1szh-TW!2stw!4v1778650670170!5m2!1szh-TW!2stw',
  },
  {
    id: 'venue-neihu',
    name: '台北 — 內科模範館',
    address: '台北市內湖區洲子街55號1F',
    transit: '捷運港墘站2號出口，步行1分鐘',
    lineUrl: 'https://page.line.me/488ujlbg',
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3613.6660747640794!2d121.57099151193722!3d25.079304677694402!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3442ac650cf40e81%3A0xf48b85ba2f238dfc!2zVUZDIEdZTeWFp-enkeaooeevhOmkqA!5e0!3m2!1szh-TW!2stw!4v1778650720964!5m2!1szh-TW!2stw',
  },
  {
    id: 'venue-taichung',
    name: '台中 — 台中勤美旗艦館',
    address: '台中市西區公益路68號12、13F',
    transit:
      '台中高鐵站免費接駁專車（往中國醫藥大學），至科博館站，步行5分鐘',
    lineUrl: 'https://page.line.me/488ujlbg',
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3640.584226597405!2d120.66126771191507!3d24.151235378309035!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x34693d2593548857%3A0x42da96286faa6a85!2zVUZDIEdZTSDlj7DkuK3li6Tnvo7ml5foiabppKg!5e0!3m2!1szh-TW!2stw!4v1778650738687!5m2!1szh-TW!2stw',
  },
]
