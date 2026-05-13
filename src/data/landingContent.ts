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
} from '../types'

// ── 全域設定 ──────────────────────────────────────
export const siteConfig = {
  brandName: 'UFCGYM TAIWAN',
  eventName: 'Fight Night',
  lineUrl: 'https://page.line.me/340uxvgb',
  // TODO: 正式付款連結完成後，將各 plan.checkoutUrl 從 LINE fallback 換成付款 URL。
  ticketUrl: '#ticket',
  offersUrl: '/offers',
}

// ── Hero ─────────────────────────────────────────
export const heroContent = {
  title: '今晚，一起進入狀態。',
  subtitle: '這是一張讓你脫離日常的入場券。',
  primaryCta: '購買 Fight Night Pass',
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
  subtitle: '',
  description:
    '如果你只想先嘗試一次，這張 pass 就是最直接的入口。',
  unifiedCtaLabel: '購買 Fight Night Pass',
  previewItems: ['完整方案權益', '活動場次狀態', '預留名額方式'],
}

export const fightNightPassPlan: TicketPlan = {
  id: 'fight-night-pass-980',
  name: 'Fight Night Pass',
  subtitle: '單場入場，一晚進入狀態',
  teaserCopy: 'NT$980，先讓身體確認這是不是你的壓力出口。',
  description:
    '適合想先體驗一次 Fight Night 的人。你會跟著教練口令、拳套、沙包與全場節奏進入完整夜場體驗，把日常裡卡住的壓力直接打開。',
  price: 'NT$980',
  badge: '首頁限定',
  features: [
    '單次 Fight Night 入場資格',
    '完整夜場節奏體驗與教練帶動',
    '適合零基礎、第一次進場與朋友同行',
    '完成 LINE Login 並加入好友後查看可報名名額',
  ],
  highlight: true,
  checkoutUrl: siteConfig.lineUrl,
  ctaLabel: '購買 Fight Night Pass',
  ctaVariant: 'primary',
}

// ── /offers 頁面文案 ──────────────────────────────
export const offersHeroContent = {
  title: 'Boot Camp 完整方案',
  subtitle: '把 Fight Night 的刺激，變成真的身體記憶。',
  description:
    '如果你已經想從單次體驗往前走，這裡是 Boot Camp 的系統方案。從兩堂入門到四堂完整旅程，完整內容需完成 LINE Login 並加入好友後解鎖。',
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
      '每一次都是不同的體驗，讓教練口令、動作節奏、沙包、回合與群體能量逐次加深。你不只知道它很嗨，還會知道自己怎麼進入狀態。',
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
      '在安全邊界內感受距離、速度、靠近感與壓迫，讓身心都學會如何面對恐懼與應對壓力。',
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

export const bootCampFaqItems: FAQItem[] = [
  {
    id: 'bootcamp-faq-1',
    question: 'Boot Camp 和 Fight Night 差在哪？',
    answer:
      'Fight Night 是單次進場的拳擊節奏體驗，適合先確認自己喜不喜歡這種狀態。Boot Camp 則是四次系統旅程，會把拳擊、踢拳、防身概念與壓力適應整理成更完整的訓練。',
  },
  {
    id: 'bootcamp-faq-2',
    question: '四堂課會不會只是重複上同一套？',
    answer:
      '不會。Boot Camp 的價值不只是多來幾次，而是每一次都有不同重點：從進入狀態、身體適應、距離與防禦，到把壓力反應轉成更穩定的身體記憶。',
  },
  {
    id: 'bootcamp-faq-3',
    question: '沒有拳擊基礎，適合直接選 Boot Camp 嗎？',
    answer:
      '可以，但要看你的目標。如果你只是想先體驗一次，先選單次會更輕鬆；如果你已經知道自己想建立一套更完整的訓練節奏，Boot Camp 會比單次更適合。',
  },
  {
    id: 'bootcamp-faq-4',
    question: '四堂 Boot Camp 是連續四週嗎？缺席怎麼辦？',
    answer:
      'Boot Camp 會依當月場次規劃安排，報名後專員會與您確認當月梯次、上課節奏、課程安排。',
  },
]

export const offersPlanSectionContent = {
  title: 'Boot Camp 方案',
  subtitle: '從 Boot Camp 兩堂入門，到四堂完整旅程，登入加好友後查看完整內容。',
  footnote: '完整內容、活動場次與名額狀態，以實際公告為準。',
}

export const offersOutcomeSectionContent = {
  title: '不只是很嗨的夜晚。',
  subtitle:
    'Fight Night是讓人期待的入口，但真正價值來自一套從感官刺激到身心變化的完整結構。',
  formulaLabel: 'Boot Camp完整系統的結構',
  formulaInputs: ['刺激進場', '壓力排空', '身體適應', '心理成長'],
  formulaResult: '從釋放壓力的痛快，變成帶得走的能力',
}

// Plan ID → 對應的課表 category。沒列在這裡的 plan 不會出現「查看近期場次」連結
export const planScheduleCategoryMap: Record<string, CourseCategory> = {
  'offers-bootcamp-2': 'BOOT_CAMP',
  'offers-bootcamp-2-gear': 'BOOT_CAMP',
  'offers-bootcamp-4': 'BOOT_CAMP',
  'offers-bootcamp-4-gear': 'BOOT_CAMP',
}

// 課表卡上「可用方案」摘要：每個 category 顯示入門價
// BOOT_CAMP 不能單堂買，最低是兩堂套票，所以價格帶「起」並用 hint 提示升級路徑
export const planSummaryByCategory: Record<
  CourseCategory,
  { label: string; price: string; hint?: string }
> = {
  FIGHT_NIGHT: {
    label: 'Fight Night Pass',
    price: 'NT$980 / 堂',
  },
  BOOT_CAMP: {
    label: 'Boot Camp 兩堂',
    price: 'NT$1,800 起',
    hint: '或四堂 NT$3,800',
  },
}

export const offersPlans: TicketPlan[] = [
  {
    id: 'offers-bootcamp-2',
    name: 'Boot Camp 兩堂｜入門套票',
    subtitle: '兩堂試系統訓練',
    teaserCopy: '兩堂讓身體開始記住一件事。',
    description:
      '兩堂 Boot Camp 課程（技術與格鬥邏輯）。適合先試結構化訓練，再決定要不要走完整四堂。',
    price: 'NT$1,800',
    features: [
      '兩堂 Boot Camp 入場資格',
      '可從泰拳、拳擊、踢拳、MMA、BJJ 中任選兩堂',
      '從技術到格鬥邏輯，循序進場',
      '想完整體驗請選四堂方案',
    ],
    checkoutUrl: siteConfig.lineUrl,
    ctaLabel: '購買 Boot Camp 兩堂',
    ctaVariant: 'secondary',
  },
  {
    id: 'offers-bootcamp-2-gear',
    name: 'Boot Camp 兩堂 ＋ 專屬拳套',
    subtitle: '兩堂 + 一副自己的拳套',
    teaserCopy: '兩堂加上一副屬於你的拳套。',
    description:
      '兩堂 Boot Camp，附品牌專屬拳套一副。讓第一次的投入留下一個帶得走的物件。',
    price: 'NT$2,800',
    badge: '附專屬拳套',
    features: [
      '包含 Boot Camp 兩堂內容',
      '附品牌專屬拳套一副，活動後帶走',
      '從第一堂開始用自己的拳套，手感更穩定',
      '比單純兩堂多 NT$1,000 = 一副拳套',
    ],
    checkoutUrl: siteConfig.lineUrl,
    ctaLabel: '購買 Boot Camp 兩堂 ＋ 拳套',
    ctaVariant: 'secondary',
  },
  {
    id: 'offers-bootcamp-4',
    name: 'Boot Camp 四堂｜完整旅程',
    subtitle: '主推：走完完整系統',
    teaserCopy: '看到刺激如何變成身體反射。',
    description:
      '四堂 Boot Camp 系統訓練，循序累積技術、壓力適應、防身反應與自信。這是最完整體驗的版本。',
    price: 'NT$3,800',
    badge: '主推方案',
    features: [
      '四堂 Boot Camp 入場資格',
      '可任意組合泰拳、拳擊、踢拳、MMA、BJJ',
      '循序累積：從釋放、穩定到建立底氣',
      '主推給想留下真正變化，不只新鮮感的人',
    ],
    highlight: true,
    checkoutUrl: siteConfig.lineUrl,
    ctaLabel: '購買 Boot Camp 四堂',
    ctaVariant: 'primary',
  },
  {
    id: 'offers-bootcamp-4-gear',
    name: 'Boot Camp 四堂 ＋ 專屬拳套',
    subtitle: '完整四堂 + 一副自己的拳套',
    teaserCopy: '四堂完整旅程，加上一副屬於你的拳套。',
    description:
      '四堂 Boot Camp 完整系統，附品牌專屬拳套。所有方案中最完整、最有長尾價值的版本。',
    price: 'NT$4,800',
    badge: '完整投入',
    features: [
      '包含 Boot Camp 四堂全部內容',
      '附品牌專屬拳套一副，活動後帶走',
      '從第一堂開始用自己的拳套，建立完整身體記憶',
      '所有方案中最完整，也最有長尾價值的版本',
    ],
    checkoutUrl: siteConfig.lineUrl,
    ctaLabel: '購買 Boot Camp 四堂 ＋ 拳套',
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
      '穿適合流汗與活動的運動服、運動鞋即可。建議自備水、毛巾與替換衣物。拳套依方案可租用、自備，或選擇附專屬拳套的方案。',
  },
  {
    id: 'faq-6',
    question: '有更衣室、淋浴和置物空間嗎？',
    answer:
      '場館基本會提供更衣與置物空間，實際設備會依場館而定。報名前建議確認你選擇的場館資訊，尤其是淋浴、置物與活動後行程安排。',
  },
  {
    id: 'faq-7',
    question: '場次日期和名額是真的嗎？',
    answer:
      '每月場次與名額會依場館、教練與當月開放狀態調整。頁面上的名額提示是報名前判斷用，最終可報名狀態以當月確認與官方回覆為準。',
  },
  {
    id: 'faq-8',
    question: '可以退款、轉讓或改期嗎？',
    answer:
      '報名前會先確認當月規則。若臨時無法參加，請盡早聯繫官方協助確認是否能改期、轉讓或依當月規則處理；越接近活動日，能調整的空間通常越少。',
  },
]

// ── Final CTA ─────────────────────────────────────
export const finalCtaContent = {
  title: '先進場一次，再決定要不要走完整旅程。',
  subtitle: '',
  primaryCta: '購買 Fight Night Pass',
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
    lineUrl: 'https://lin.ee/dTCkydS',
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.8455611296736!2d121.54767441193627!3d25.03931467772036!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3442abcf90bf71ab%3A0x7d7e74bdafe72664!2zVUZDIEd5bSDmlabljZfml5foiabppKg!5e0!3m2!1szh-TW!2stw!4v1778650670170!5m2!1szh-TW!2stw',
  },
  {
    id: 'venue-neihu',
    name: '台北 — 內科模範館',
    address: '台北市內湖區洲子街55號1F',
    transit: '捷運港墘站2號出口，步行1分鐘',
    lineUrl: 'https://lin.ee/baMDUpI',
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3613.6660747640794!2d121.57099151193722!3d25.079304677694402!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3442ac650cf40e81%3A0xf48b85ba2f238dfc!2zVUZDIEdZTeWFp-enkeaooeevhOmkqA!5e0!3m2!1szh-TW!2stw!4v1778650720964!5m2!1szh-TW!2stw',
  },
  {
    id: 'venue-taichung',
    name: '台中 — 台中勤美旗艦館',
    address: '台中市西區公益路68號12、13F',
    transit:
      '台中高鐵站免費接駁專車（往中國醫藥大學），至科博館站，步行5分鐘',
    lineUrl: 'https://lin.ee/Hhi6BCP',
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3640.584226597405!2d120.66126771191507!3d24.151235378309035!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x34693d2593548857%3A0x42da96286faa6a85!2zVUZDIEdZTSDlj7DkuK3li6Tnvo7ml5foiabppKg!5e0!3m2!1szh-TW!2stw!4v1778650738687!5m2!1szh-TW!2stw',
  },
]
