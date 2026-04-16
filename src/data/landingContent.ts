import type {
  PainPoint,
  FrameworkCard,
  CoreValue,
  FormulaItem,
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
  subtitle: '你缺的是一個讓你「進入狀態」的機會。',
  description:
    '每天都在找事情填滿時間，但填完之後還是覺得悶。問題是「沒有一件事能讓你脫離枯燥窒息的日常」。',
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

// ── 三大核心價值 ──────────────────────────────────
export const coreValueSectionContent = {
  title: '你真正需要的，是被一個設計好的情境接住。',
}

export const coreValues: CoreValue[] = [
  {
    id: 'cv-release',
    icon: '🔥',
    title: '釋放',
    subtitle: '合法失控的安全場域',
    description:
      '一副拳套、一個夜晚。把壓力打出去，把那些悶住的東西轟出來。在這裡，你被允許用力，被允許吶喊，被允許把那些日常裡不能表達的情緒，全部都丟出去。',
  },
  {
    id: 'cv-belonging',
    icon: '👥',
    title: '歸屬',
    subtitle: '你不是一個人',
    description:
      '左邊的人跟你一起出拳，右邊的人跟你一起喘氣。整個場都在教練控制的同一頻率上。你不需要認識任何人，但你會感覺到：這裡有一群人跟你一樣。',
  },
  {
    id: 'cv-transcend',
    icon: '⚡',
    title: '自我超越',
    subtitle: '短暫離開那個悶住的自己',
    description:
      '在這裡你不是上班族、不是誰的誰、不用回訊息、不用表現得體。你只是一個聽指示全力揮拳的人。那段時間，你會忘記日常，忘記身份，只記得你還能這樣活著。',
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
    term: '種子傳染',
    description:
      '當某個人因為某件事而大笑，身邊的人也會跟著笑，你也會跟著大笑。',
  },
]

// ── 拳套區 ────────────────────────────────────────
export const glovesContent = {
  title: '這是你今晚的入場券。',
  subtitle: '戴上它，你就不再是旁觀者。',
  description:
    '它是你進場的象徵，是你今晚身份的表態。戴上它，你就不再是旁觀者，你是這個夜晚的一部分。',
  features: ['專屬設計', '活動限定配色', '帶走收藏'],
}

// ── 情緒流程區 ────────────────────────────────────
export const flowSectionContent = {
  title: '安全的失控',
  subtitle: '這是一段你會記住，但不會受傷的過程。',
}

export const flowSteps: FlowStep[] = [
  {
    id: 'flow-1',
    stage: 1,
    title: '動態暖身',
    description: '從最簡單的動態暖身動作開始，讓教練快速判別每個人的身體能力差異。',
    emotionLevel: 1,
  },
  {
    id: 'flow-2',
    stage: 2,
    title: '程度分組與鏡像動作',
    description: '根據暖身時的狀況，進行分組，讓大家專注在鏡像動作與口號上。',
    emotionLevel: 2,
  },
  {
    id: 'flow-3',
    stage: 3,
    title: '堆疊同步與專注',
    description:
      '在教練的引導下，你跟著大家一起出拳、一起吶喊。',
    emotionLevel: 3,
  },
  {
    id: 'flow-4',
    stage: 4,
    title: '堆疊並釋放情緒',
    description:
      '隨著節奏與強度的堆疊，你的思緒將飛走，只剩下純粹的釋放。',
    emotionLevel: 4,
  },
  {
    id: 'flow-5',
    stage: 5,
    title: '歸屬與延續',
    description:
      '你完成了平常不會做的事，你與運動夥伴互相激勵，全力克服共同的挑戰後，獲得了新的身份。',
    emotionLevel: 5,
  },
]

// ── 適合誰 ────────────────────────────────────────
export const audienceSectionContent = {
  title: '這個體驗適合你嗎？',
  subtitle: '如果你中了三項以上，那你就是我們在等的人。',
}

export const audiencePoints: AudiencePoint[] = [
  { id: 'aud-1', text: '上班悶到爆，下班只想躺但又覺得浪費', icon: '😮‍💨' },
  { id: 'aud-2', text: '試過各種運動，但沒有一種讓你真的「進入狀態」', icon: '🏃' },
  { id: 'aud-3', text: '喜歡音樂、節奏、低音重的震動亢奮感', icon: '🎵' },
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
