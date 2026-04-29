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
  title: '四次之後，你不會再像以前那樣容易被壓住',
  subtitle: '從低頭吞下壓力，到重新掌握力量、看懂距離、穩穩站住自己',
  description:
    '如果你已經受夠每次都把委屈、壓力和害怕吞回去，這四次循序安排，會帶你慢慢把自己找回來。',
  primaryCta: '快速登入查看',
  secondaryCta: '先看這四次內容如何改變你',
}

export const offersCurriculumSectionContent = {
  title: '這不是四次普通進場，而是四次把自己站回來',
  subtitle:
    '不是要你硬記很多東西，而是透過四次循序設計，讓你一步一步從壓力出口，走到力量、判斷與底氣。',
  description:
    '先讓悶住的情緒有地方出去，再把節奏、力量感、距離感與反應慢慢留在身體裡。你不是靠想通變勇敢，而是透過一次一次的進入狀態，慢慢變成面對壓力時更穩、更敢直視、更不容易被壓住的人。',
  overlayTitle: '登入後查看完整四次內容',
  overlayDescription:
    '解鎖後你會直接看到這四次內容，怎麼一步一步把你從壓抑，帶到力量、判斷與底氣。',
}

export const curriculumModules: CurriculumModule[] = [
  {
    id: 'module-1',
    stage: 1,
    title: '先讓壓力出去',
    description:
      '從呼吸、站姿、節奏與擊打開始，把長期悶在身體裡的緊繃、委屈與壓力先打開，讓你不再只剩下忍耐。',
  },
  {
    id: 'module-2',
    stage: 2,
    title: '把釋放變成力量',
    description:
      '透過節奏、擊打與身體帶動，慢慢找到站穩、打開和把力量感留在自己身上的方式，而不是只會承受。',
  },
  {
    id: 'module-3',
    stage: 3,
    title: '把力量變成判斷',
    description:
      '把距離感、節奏感與反應帶進來，讓你面對靠近、壓迫與突發情況時，開始看得懂、穩得住，不再一慌就亂。',
  },
  {
    id: 'module-4',
    stage: 4,
    title: '把判斷變成底氣',
    description:
      '最後把釋放、力量、距離與反應整合起來，讓你帶走的不只是體驗，而是一個更穩、更有氣勢、更不容易被壓住的自己。',
  },
]

export const offersPlanSectionContent = {
  title: '方案內容',
  subtitle:
    '這裡不只是價格表，而是每一種進場方式真正能帶給你的現場感、情緒出口、後續延續性與改變深度。',
  footnote:
    '真正讓人覺得值得的，不只是當晚很爽，而是離開時你會發現自己同時帶走了釋放、記憶、力量感，還有一段很難被其他活動取代的經驗。',
  overlayDescription:
    '解鎖後你可以直接比較每個入口到底差在哪一層，不只是差在價格，而是差在完整度、收穫感與你會把什麼帶回生活裡。',
}

export const offersPlans: TicketPlan[] = [
  {
    id: 'offers-session-pass',
    name: '初次體驗一堂',
    subtitle: '先試一次，但不是只試表面',
    teaserCopy: '這不是隨便體驗一下，而是用一個晚上親自感受，Fight Night 為什麼會讓人想再回來一次。',
    description:
      '適合第一次接觸 Fight Night，想先親身感受現場帶領、節奏推進、集體同步與情緒釋放，再決定這對你來說只是新鮮，還是真的會讓你想把自己交給下一次的人。',
    price: 'NT$1,800',
    features: [
      '單次 Fight Night 完整進場資格',
      '拳套可租用或自備',
      '從暖場、節奏推進到情緒釋放，完整感受一次真正有編排的現場體驗',
      '第一次來也能跟上的帶領方式，不會有被丟著、跟不上或只能站旁邊看的感覺',
      '當晚就能感受到專注、亢奮、釋放與群體同步這種平常很少遇到的狀態',
      '用最低門檻把「好奇」變成一次真正有感的親身確認',
      '適合想先知道自己要的到底只是新鮮，還是一個真的有效的壓力出口',
    ],
    ctaLabel: '用 LINE 詢問初次一堂',
    ctaVariant: 'secondary',
  },
  {
    id: 'offers-session-glove-pass',
    name: '初次體驗一堂＋拳套',
    subtitle: '把第一次做得更完整',
    teaserCopy: '如果你知道自己不想把第一次做得太隨便，這會是一個更完整、更有記憶點的開始。',
    description:
      '適合第一次進場就想把裝備、手感與儀式感一次到位的人。你不只會參加這一晚，還會把這次開始留下來，讓它在結束後繼續陪你一段時間。',
    price: 'NT$2,800',
    badge: '附專屬拳套',
    features: [
      '包含初次體驗一堂的完整進場內容',
      '附品牌專屬拳套一副（帶走）',
      '第一次進場就有自己的裝備與手感，更容易把自己放進那個狀態裡',
      '結束後不只留下記憶，還留下能延續這份感覺的實體物件',
      '比單次體驗多的不只是拳套，而是更完整的開始感與更強的儀式感',
      '很適合已經知道自己不是來看看而已，而是想把這次開始做漂亮的人',
    ],
    ctaLabel: '用 LINE 詢問一堂＋拳套',
    ctaVariant: 'secondary',
  },
  {
    id: 'offers-transformation-pass',
    name: 'Signature 四次完整體驗',
    subtitle: '最值得的主推版本',
    teaserCopy: '你買的不是四次門票，而是一段會讓你回頭時發現自己真的不一樣的完整安排。',
    description:
      '給不想再只是偶爾釋放一下，而是想把整個人慢慢帶穩的人。四次的價值不只是次數多，而是每一次都在堆疊，讓你從會爽、到會穩、再到開始真的有底氣。',
    price: 'NT$3,800',
    badge: '主推方案',
    features: [
      '四次循序設計的完整內容，不是把同一件事重複四遍',
      '每一次都會把節奏、力量感、距離感與反應感再往更深的地方推進',
      '不是只發洩情緒，而是把壓力出口慢慢變成更穩的身體記憶',
      '從第一次的新鮮，到後面真正進得去、放得開、站得住，感受會完全不一樣',
      '由有高壓對抗背景的帶領者一步一步陪你走，不需要自己硬撐著理解',
      '完整感受到 Fight Night 為什麼值得被做成系列，而不是只停在一次性的活動',
      '最能同時滿足爽感、價值感與改變感的主推選擇',
    ],
    highlight: true,
    ctaLabel: '用 LINE 預留 Signature 四次',
    ctaVariant: 'primary',
  },
  {
    id: 'offers-upgrade-pass',
    name: 'Signature 四次完整體驗＋專屬裝備',
    subtitle: '把改變帶回生活的版本',
    teaserCopy: '如果你要的不是一段回憶，而是想把這份狀態真正留在生活裡，這會是最完整的版本。',
    description:
      '給已經知道自己不想只停在體驗的人。除了完整四次內容，你也會把專屬裝備一起帶走，讓這次建立起來的力量感，不會只留在那幾個晚上，而是能在之後的生活裡一直被想起。',
    price: 'NT$4,800',
    badge: '完整投入',
    features: [
      '包含 Signature 四次完整體驗的全部內容',
      '專屬拳套一副（帶走）',
      '四次的堆疊感，加上活動結束後還能延續的專屬裝備感',
      '不只是當晚進入狀態，之後看到裝備也會記得自己曾經進入過那個狀態',
      '讓這段體驗從一次參與，變成你生活裡真的留得下來的東西',
      '很適合已經知道自己想完整投入，也重視收藏感、紀念感與儀式感的人',
      '在所有方案裡，這是最完整也最容易留下長尾價值的一個版本',
    ],
    ctaLabel: '用 LINE 詢問完整投入方案',
    ctaVariant: 'secondary',
  },
  {
    id: 'offers-private-intro',
    name: 'Private Onboarding',
    subtitle: '先被好好接住，再進場',
    teaserCopy: '如果你不是不想來，而是不想一開始就把自己丟進陌生節奏裡，這會是最友善的入口。',
    description:
      '適合對群體節奏還有顧慮，或希望先熟悉互動方式、身體感與安全感，再進入正式場次的人。它的價值不是讓你慢一點，而是讓你之後真的能更享受、更放得開地進入整個體驗。',
    price: '私訊詢問',
    features: [
      '一對一或小班式的安心入門安排',
      '先熟悉場域、節奏、互動方式與身體感，少一點慌張，多一點掌握感',
      '把怕尷尬、怕跟不上、怕太陌生這些顧慮先放下來',
      '讓你第一次正式進場時更能享受現場，而不是一直分心在緊張',
      '不是降低體驗強度，而是提高你真正能接住這個體驗的能力',
      '特別適合想被照顧更多、想先建立安全感、再完整走進內容的人',
    ],
    ctaLabel: '用 LINE 詢問 Private Onboarding',
    ctaVariant: 'ghost',
  },
]

export const offersCoachSectionContent = {
  title: '帶領與現場專業',
  subtitle:
    '重點不是頭銜好不好看，而是他們能不能把節奏、安全感與進入狀態這件事，真的照顧到第一次來的人身上。',
  description:
    '這裡的專業，不是把你操爆，而是知道怎麼帶一個平常只會忍住、縮起來的人，慢慢放開、站穩、進入狀態，最後長出真正的底氣。',
  overlayDescription:
    '解鎖後直接看這次由誰帶你進場，以及他們怎麼把現場節奏、情緒與安全感照顧好。',
}

export const coaches: Coach[] = [
  {
    id: 'coach-lead',
    name: 'Coach Bruno Saint',
    title: '海外職業選手背景 / 現場主帶人',
    bio: '擅長把高壓對抗裡的力量、節奏與反應感，拆成第一次來也能安心進入的帶領方式，讓人從只是撐住，慢慢走到能掌握自己。',
    tags: ['綜合格鬥', '節奏編排', '團體帶動', '安全控場'],
  },
  {
    id: 'coach-rhythm',
    name: 'Coach BBB',
    title: '節奏編排 / 身體流動帶領',
    bio: '把節奏、移動與身體連結帶進現場，讓原本緊繃、卡住的身體開始流動，力量感不再只是硬撐。',
    tags: ['節奏編排', '團體帶動', '拳擊教學'],
  },
  {
    id: 'coach-safety',
    name: 'Coach CCC',
    title: '安全感照顧 / 現場節奏支持',
    bio: '把距離感、安全邊界與現場照顧轉成新手也聽得懂、跟得上的引導，幫助學員在壓力靠近時，不再只剩慌張與退縮。',
    tags: ['安全控場', '防身術', '團體帶動'],
  },
]

export const offersSessionSectionContent = {
  title: '活動場次',
  subtitle:
    '選好你方便進場的館別與時間，剩下的，就交給這四次內容把你一步一步帶回來。',
  ruleLine: '每月 1 個主題檔期 × 3 個場館同步開放',
  footnote: '各館名額與釋出狀態，以當月實際公告為準。',
  bookCtaLabel: '用 LINE 預留名額',
  overlayDescription:
    '解鎖後直接看哪一館還有名額，選一個你真的進得去的時間。',
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
  title: '下一次面對壓力時，你想繼續忍住，還是想更穩地站住？',
  subtitle:
    '把這次，不再只是忍住的機會留給自己。登入後查看四次內容、帶領者、場次與方案。',
  primaryCta: '快速登入查看',
  secondaryCta: '回到頁面上方',
}

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
      '依方案而定。初次體驗一堂可租用或自備拳套；初次體驗一堂＋拳套與 Signature 四次完整體驗＋專屬裝備都附可帶走的專屬拳套。',
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
