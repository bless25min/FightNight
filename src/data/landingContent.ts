import type {
  PainPoint,
  FrameworkCard,
  CoreValue,
  FormulaItem,
  Mechanism,
  FlowStep,
  AudiencePoint,
  TicketPlan,
  FAQItem,
} from '../types'

// ── 全域設定 ──────────────────────────────────────
export const siteConfig = {
  brandName: 'UFCGYM TAIWAN',
  eventName: 'Fight Night',
  lineUrl: 'https://page.line.me/340uxvgb',
  ticketUrl: '#ticket',
}

// ── Hero ─────────────────────────────────────────
export const heroContent = {
  title: '今晚，一起進入狀態。',
  subtitle: '這是一張讓你脫離日常的入場券。',
  primaryCta: '立即搶位',
  secondaryCta: '這一晚會發生什麼',
  tags: ['🥊 拳套入場', '🎧 DJ 現場', '👥 集體同步', '🔥 壓力釋放'],
}

// ── 共同困境 ──────────────────────────────────────
export const painSectionContent = {
  title: '對生活提不起勁。',
  subtitle: '你只是缺一個真正讓你「進入狀態」的機會。',
  description:
    '每天都在找事情填滿時間，但填完之後還是覺得悶。因為問題從來不是「沒事做」，而是「沒有一件事能真的讓你從日常裡切出去」。',
}

export const painPoints: PainPoint[] = [
  {
    id: 'pain-1',
    situation: '下班後追劇、滑手機到凌晨',
    reality: '隔天更累，什麼都沒釋放',
  },
  {
    id: 'pain-2',
    situation: '約朋友吃飯、逛街、跑夜店',
    reality: '熱鬧完回到家，更覺得空',
  },
  {
    id: 'pain-3',
    situation: '硬撐完一小時健身房',
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
  title: '不是每種熱鬧都叫釋放。',
  subtitle: '不是每種運動都會上頭。',
}

export const frameworkCards: FrameworkCard[] = [
  {
    id: 'fw-1',
    label: '分心式娛樂',
    description: '看劇、滑手機、吃到飽。有趣，但你知道那不是釋放。',
    type: 'old',
  },
  {
    id: 'fw-2',
    label: '苦撐式運動',
    description: '跑步機上數著倒計時。撐完了，但沒有爽過。',
    type: 'old',
  },
  {
    id: 'fw-3',
    label: '集體同步',
    description: '全場同一個節奏、同一個呼吸。你被拉進去，不是自己硬撐。',
    type: 'new',
  },
  {
    id: 'fw-4',
    label: '集體釋放',
    description: '當整個空間一起到達高點，你會知道——這跟自己嗨完全不同。',
    type: 'new',
  },
]

// ── 新模型 ────────────────────────────────────────
export const newModelContent = {
  title: '可被帶入的集體情緒體驗',
  description:
    'Fight Night 不是拳擊教學，不是團體健身，不是派對。它是一個精心設計的空間——用節奏把你拉進去，用群體幫你撐住，用釋放讓你帶走一個不一樣的自己。',
  keywords: ['同步', '釋放', '歸屬', '進場', '身份'],
}

// ── 三大核心價值 ──────────────────────────────────
export const coreValueSectionContent = {
  title: '你真正需要的',
  subtitle: '是被一個設計好的空間，接住。',
}

export const coreValues: CoreValue[] = [
  {
    id: 'cv-release',
    icon: '🔥',
    title: '釋放',
    subtitle: '合法失控的安全場域',
    description:
      '不需要理由，不需要對象。一副拳套、一個夜晚。把壓力打出去，把悶住的東西轟出來。你被允許用力，被允許吶喊，被允許把那些日常裡不能表達的情緒，全部都丟出去。',
  },
  {
    id: 'cv-belonging',
    icon: '👥',
    title: '歸屬',
    subtitle: '不是你一個人在嗨',
    description:
      '左邊的人跟你一起出拳，右邊的人跟你一起喘氣。整個場都在同一個頻率上。這種「被群體接住」的感覺，自己運動永遠得不到。你不需要認識任何人，但你會感覺到：這裡有一群人跟你一樣。',
  },
  {
    id: 'cv-transcend',
    icon: '⚡',
    title: '自我超越',
    subtitle: '短暫離開那個悶住的自己',
    description:
      '在這裡你不是上班族、不是誰的誰、不用回訊息、不用表現得體。你只是一個正在全力揮拳的人。那段時間，你會忘記日常，忘記身份，只記得你還能這樣活著。',
  },
]

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
      '全場目光鎖定同一個焦點。當所有人看向同一個方向，個體意識開始消融，集體能量場開始成型。',
  },
  {
    id: 'f-sync',
    term: '身體同步',
    description:
      '同一個節拍，同一組動作。身體的同步會啟動大腦的鏡像系統，不需要語言就能製造深層連結。',
  },
  {
    id: 'f-anticipation',
    term: '預期堆高',
    description:
      '你知道高潮要來了。節奏在加快、強度在拉高——這種預期本身就是快感的一部分。',
  },
  {
    id: 'f-release',
    term: '延遲釋放',
    description:
      '撐住、撐住、再撐一下——然後，放。延遲後的釋放，衝擊力是即時滿足的三倍。',
  },
  {
    id: 'f-identity',
    term: '群體身份',
    description:
      '戴上拳套的那一刻，你就不再只是觀眾。你是今晚這個群體的一份子。身份感讓投入感加倍。',
  },
  {
    id: 'f-seed',
    term: '種子帶動',
    description:
      '場內有人比你更投入、更用力、更大聲。他們的能量會感染你，把你拉到你自己去不了的狀態。',
  },
]

// ── 六大體驗機制 ──────────────────────────────────
export const mechanismSectionContent = {
  title: '六個環節，每一個都有作用。',
  subtitle: '每一步都在往「進入狀態」推進。',
}

export const mechanisms: Mechanism[] = [
  {
    id: 'mech-1',
    icon: '👁️',
    title: '共同注意力',
    description: '燈光、音樂、教練指令——全場焦點收攏到同一個方向。個體消融，集體成型。',
  },
  {
    id: 'mech-2',
    icon: '🫀',
    title: '身體同步',
    description: '同一拍出拳、同一拍收回。當身體進入同步，大腦會自動產生連結感與歸屬感。',
  },
  {
    id: 'mech-3',
    icon: '📈',
    title: '預期堆高',
    description: '節奏漸進拉升、強度層層堆疊。你知道高峰要來——而這份預期本身就是快感。',
  },
  {
    id: 'mech-4',
    icon: '💥',
    title: '延遲釋放',
    description: '不給你即時滿足。撐住、壓住、再壓一下——然後全部炸開。衝擊力翻倍。',
  },
  {
    id: 'mech-5',
    icon: '🎭',
    title: '群體身份',
    description: '拳套不只是道具。戴上它的那一秒，你就從觀眾變成參與者。身份感驅動投入感。',
  },
  {
    id: 'mech-6',
    icon: '🌊',
    title: '種子帶動',
    description: '場內安排了比你更拚的人。他們的嘶吼、他們的節奏，會把你拉到你自己到不了的地方。',
  },
]

// ── 拳套區 ────────────────────────────────────────
export const glovesContent = {
  title: '這是你今晚的入場券。',
  subtitle: '戴上它，你就不再是旁觀者。',
  description:
    '它是你進場的象徵，是你今晚身份的表態。戴上它，你就不再是旁觀者——你是這個夜晚的一部分。',
  features: ['專屬設計', '活動限定配色', '帶走收藏'],
}

// ── 情緒流程區 ────────────────────────────────────
export const flowSectionContent = {
  title: '這一晚的情緒曲線',
  subtitle: '不是課表，是一段你會記住的過程。',
}

export const flowSteps: FlowStep[] = [
  {
    id: 'flow-1',
    stage: 1,
    title: '進場聚焦',
    description: '燈光壓低，音樂收攏。從你走進場地的那一刻起，外面的世界就被切掉了。',
    emotionLevel: 3,
  },
  {
    id: 'flow-2',
    stage: 2,
    title: '節奏同步',
    description: 'DJ 起拍，教練帶動作。你的身體自然開始跟上，不需要想，不需要努力。',
    emotionLevel: 5,
  },
  {
    id: 'flow-3',
    stage: 3,
    title: '情緒堆高',
    description:
      '節奏加快，強度拉高，呼吸變重。你聽到旁邊的人也在喘，也在用力。能量在空氣裡蔓延。',
    emotionLevel: 7,
  },
  {
    id: 'flow-4',
    stage: 4,
    title: '高峰釋放',
    description:
      '全場最高的那一刻。所有人同時出拳、同時吶喊。你感覺到場館在震動，你自己也在震動。',
    emotionLevel: 10,
  },
  {
    id: 'flow-5',
    stage: 5,
    title: '後場延續',
    description:
      '音樂放緩，但能量還在。拳套還在手上，你跟剛才一起戰鬥過的人對到眼。這個夜晚不會就地結束。',
    emotionLevel: 6,
  },
]

// ── 適合誰 ────────────────────────────────────────
export const audienceSectionContent = {
  title: '這個夜晚適合你嗎？',
  subtitle: '如果你中了三項以上，那你就是我們在等的人。',
}

export const audiencePoints: AudiencePoint[] = [
  { id: 'aud-1', text: '上班悶到爆，下班只想躺但又覺得浪費', icon: '😮‍💨' },
  { id: 'aud-2', text: '試過各種運動，但沒有一種讓你真的「進入狀態」', icon: '🏃' },
  { id: 'aud-3', text: '喜歡音樂、節奏、低音重的震動感', icon: '🎵' },
  { id: 'aud-4', text: '想跟朋友做一件不一樣的事，不是又吃飯又唱歌', icon: '🤝' },
  { id: 'aud-5', text: '想認識一群有能量、不混日子的人', icon: '⚡' },
  { id: 'aud-6', text: '覺得最近需要一個出口，什麼形式都好', icon: '🔓' },
]

// ── 票種區 ────────────────────────────────────────
export const ticketSectionContent = {
  title: '選擇你的入場方式',
  subtitle: '不叫方案，叫 Pass。因為這不是報名，是入場。',
}

export const ticketPlans: TicketPlan[] = [
  {
    id: 'starter-pass',
    name: 'Starter Pass',
    subtitle: '一個人先試水溫',
    price: 'NT$1,800',
    features: [
      'Fight Night 入場資格',
      '專屬拳套一副（帶走）',
      'DJ 音樂節奏體驗全程',
      '後場社交時段',
    ],
    ctaLabel: '選擇 Starter',
    ctaVariant: 'secondary',
  },
  {
    id: 'duo-pass',
    name: 'Duo Pass',
    subtitle: '揪人一起更有感',
    price: 'NT$3,000',
    badge: '雙人最划算',
    features: [
      '兩人 Fight Night 入場',
      '雙人各一副專屬拳套（帶走）',
      'DJ 音樂節奏體驗全程',
      '後場社交時段',
      '雙人體驗紀念',
    ],
    highlight: true,
    ctaLabel: '選擇 Duo',
    ctaVariant: 'primary',
  },
  {
    id: 'signature-pass',
    name: 'Signature Pass',
    subtitle: '今晚拉到最滿',
    price: 'NT$3,600',
    badge: '完整體驗',
    features: [
      'Fight Night VIP 入場',
      '限定色系拳套一副（帶走）',
      '前排專屬位置',
      'DJ 音樂節奏體驗全程',
      '後場 VIP 社交區',
      '專屬紀念品',
      '下次活動優先報名',
    ],
    ctaLabel: '選擇 Signature',
    ctaVariant: 'secondary',
  },
]

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
      '可以。每位入場者都會拿到專屬拳套，它是你的。活動結束直接帶走，作為這個夜晚的紀念。',
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
      '當然。我們有 Duo Pass 雙人票種，專門設計給想一起進場的朋友。兩個人一起來，感覺會更強烈。',
  },
  {
    id: 'faq-6',
    question: '結束後直接散場嗎？',
    answer:
      '不會。活動結束後有「後場社交時段」，音樂、燈光、氛圍都還在。很多人在這個環節認識了後來持續約出來的朋友。',
  },
]

// ── Final CTA ─────────────────────────────────────
export const finalCtaContent = {
  title: '不是每個夜晚都值得出門。',
  subtitle: '但如果你最近真的需要一個出口，這一場，值得。',
  primaryCta: '選擇你的 Pass',
  secondaryCta: '跟朋友一起進場',
  ghostCta: '先加 LINE 聊聊',
}
