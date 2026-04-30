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
  title: '你會被這種夜晚吸引，不只是因為它很嗨',
  subtitle: '熱鬧、低音、人群和拳套，先抓住的是好奇心；真正被叫醒的，是那個太久沒有出口的自己。',
  description:
    '從首頁進來，你可能只是想看看這到底有多刺激。那就是入口。這一頁要說的，是 Fight Night 怎麼把那份想逃離日常、想重新有感覺的衝動，接成一個安全、強烈、值得的體驗。',
  primaryCta: '快速登入查看',
  secondaryCta: '先看這四次內容如何改變你',
}

export const offersCurriculumSectionContent = {
  title: '接下來才是格鬥：把壓力變成可控動作',
  subtitle:
    '不是要你變成選手，也不是把課程變硬。格鬥在這裡是一套方法，讓看不見的壓力有地方出去。',
  description:
    '職業格鬥選手最專業的地方，不是比較不害怕，而是能在壓力逼近時，還知道怎麼呼吸、站穩、看見距離、做出下一個反應。Fight Night 把這套邏輯變成一般人也能進入的體驗：不是硬撐，而是被帶著把混亂交給身體處理。',
  overlayTitle: '登入後查看四次如何一層一層堆上去',
  overlayDescription:
    '解鎖後你會看到四次內容如何從進場、釋放、穩住到帶走，把刺激感變成真正留下來的身體記憶。',
}

export const curriculumModules: CurriculumModule[] = [
  {
    id: 'module-1',
    stage: 1,
    title: '先進場：讓身體醒過來',
    description:
      '音樂、人群、拳套和現場節奏先把你從腦袋拉回身體。你不用表現很會，只要跟著進入狀態。',
  },
  {
    id: 'module-2',
    stage: 2,
    title: '再釋放：把悶住的東西交出去',
    description:
      '拳套和沙包讓壓力有一個安全的去處。不是亂打，而是在節奏裡把累積很久的悶、怒、緊繃打出去。',
  },
  {
    id: 'module-3',
    stage: 3,
    title: '接著穩住：在混亂裡找回控制',
    description:
      '當聲音、速度和疲勞一起上來，現場會把你帶回呼吸、站姿、距離和下一個動作。你會發現自己不是一亂就只能退開。',
  },
  {
    id: 'module-4',
    stage: 4,
    title: '最後帶走：留下新的身體證據',
    description:
      '真正留下來的不是變強幻想，而是身體知道：我可以被帶進狀態，也可以從高點回來。這會比單純爽一晚更有重量。',
  },
]

export const offersPlanSectionContent = {
  title: '選一個你真的會記住的入口',
  subtitle: '不是買堂數，是選擇你要把這個夜晚帶到多深。',
  footnote:
    '高價值感來自三件事：被帶進狀態、被安全接住，以及離開後仍然記得自己有多能站住。',
  overlayDescription:
    '解鎖後可以比較每個入口的深度、儀式感，以及你會把什麼帶回生活裡。',
}

export const offersOutcomeSectionContent = {
  title: '所以它值得，不是因為內容很多，而是每一層都接得上',
  subtitle:
    '從首頁的好奇、到壓力被承接、到拳套與沙包提供出口、再到四次內容堆疊，價值不是突然被喊高，而是一步一步成立。',
  formulaLabel: '價值堆疊公式',
  formulaInputs: ['被吸引', '被接住', '打得出去', '帶得回來'],
  formulaResult: '不是只嗨一晚，而是重新有感覺',
  summaryCards: [
    {
      id: 'experience-layer',
      label: '體驗層',
      title: '先滿足你想要的熱鬧刺激',
      description:
        '它必須先好玩、強烈、讓人想進場。沒有這一層，後面的釋放都只是道理。',
    },
    {
      id: 'problem-layer',
      label: '問題層',
      title: '再承接你真正需要的出口',
      description:
        '有些壓力不是聊天就能說完，也不是休息就會消失。它需要一個能承受聲音、動作、衝擊和情緒的場。',
    },
    {
      id: 'value-layer',
      label: '收穫層',
      title: '最後留下可記得、可帶走的狀態',
      description:
        '你會記得自己不是只能麻掉、忍住或假裝沒事。你曾經進場、出拳、釋放，然後安全地回來。',
    },
  ],
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
    name: 'Signature Four｜四次完整進場',
    subtitle: '主推：真正走完整套設計',
    teaserCopy: '如果你要的不只是釋放一次，選這個。',
    description:
      '四次不是把同一晚重複四遍，而是逐步把壓力出口、身體節奏、面對打擊和重新站起來串成一段完整經驗。這是最能看見 Fight Night 價值的版本。',
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
    name: 'Signature Gear｜四次完整進場＋專屬拳套',
    subtitle: '把完整體驗帶回生活',
    teaserCopy: '四次進場，加上一副屬於你的拳套。',
    description:
      '給已經決定完整投入的人。你買的不是紀念品，而是一個能被看見、被拿起、把那段狀態召回來的物件。',
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
  title: '下一場，你要在哪裡進場',
  subtitle:
    '選一個你願意真正出現的夜晚。剩下的，交給現場把你帶進去。',
  ruleLine: '每月 1 個主題檔期 × 3 個場館限量開放',
  footnote: '各館名額與釋出狀態，以當月實際公告為準。',
  bookCtaLabel: '用 LINE 預留名額',
  overlayDescription:
    '解鎖後直接看哪一館還有名額，選一個你願意真的出現的夜晚。',
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
