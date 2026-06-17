import beginnerPoster from '../assets/generated/training-plan-core-pressure-memory.jpg'
import boxingPoster from '../assets/generated/training-plan-route-boxing-poster.jpg'
import muayThaiPoster from '../assets/generated/training-plan-route-muaythai-poster.jpg'
import stressPoster from '../assets/landing/pain-poster.jpg'

export type SeoGuideSection = {
  title: string
  answer: string
  bullets?: string[]
}

export type SeoGuideFaq = {
  question: string
  answer: string
}

export type SeoGuide = {
  slug: string
  footerLabel: string
  footerDescription: string
  eyebrow: string
  title: string
  description: string
  keywords: string[]
  searchIntents: string[]
  heroImage: string
  heroAlt: string
  venueIds: string[]
  sections: SeoGuideSection[]
  faqs: SeoGuideFaq[]
}

export const seoGuides: SeoGuide[] = [
  {
    slug: 'taipei-boxing-muay-thai-classes',
    footerLabel: '台北拳擊 / 泰拳課程',
    footerDescription: '敦南、內湖場館與初學者選課方向',
    eyebrow: 'TAIPEI GUIDE',
    title: '台北拳擊、泰拳課程怎麼選？敦南與內湖初學者指南',
    description:
      '正在找台北拳擊課程、泰拳課程或下班後的格鬥健身？整理 UFCGYM TAIWAN 敦南旗艦館、內科模範館的交通、課程選擇與新手常見問題。',
    keywords: [
      '台北拳擊課程',
      '台北泰拳課程',
      '台北踢拳課',
      '大安拳擊課程',
      '內湖拳擊課程',
      '忠孝敦化拳擊',
      '港墘泰拳',
      'UFCGYM 台北',
    ],
    searchIntents: [
      '台北拳擊課程哪裡上',
      '大安區拳擊課程初學者',
      '內湖泰拳課程推薦',
      '下班後拳擊課台北',
      '拳擊和泰拳怎麼選',
    ],
    heroImage: boxingPoster,
    heroAlt: '台北 UFC GYM 拳擊與泰拳課程訓練畫面',
    venueIds: ['venue-dunnan', 'venue-neihu'],
    sections: [
      {
        title: '如果你正在找「台北拳擊課程」',
        answer:
          '先看通勤距離與上課節奏。敦南旗艦館接近忠孝敦化站，適合下班後從大安、信義、東區過來；內科模範館在港墘站附近，對內湖科技園區、南港、松山通勤族更順。',
        bullets: [
          '想先試一次，選單堂入場券的單堂進場體驗。',
          '想固定幾週，選 拳擊／泰拳專項課程，把同館同時段的兩堂或四堂先排好。',
          '完全沒有基礎，先從拳擊或泰拳基礎課開始，不需要先會打。',
        ],
      },
      {
        title: '台北泰拳、踢拳和拳擊差在哪？',
        answer:
          '拳擊主要練步伐、閃躲、出拳節奏；泰拳和踢拳會加入腿、膝、距離控制，身體參與感更強。若你想先建立手部節奏，拳擊比較直覺；若你想要更全身、更釋放壓力，泰拳或踢拳會更有感。',
      },
      {
        title: '敦南與內湖場館怎麼選？',
        answer:
          '不用先用「哪間比較好」做決定，先用你真正會抵達的路線決定。格鬥健身的關鍵不是一次衝很滿，而是你願不願意在接下來幾週準時出現。',
      },
    ],
    faqs: [
      {
        question: '台北拳擊課程適合完全新手嗎？',
        answer:
          '適合。UFC GYM 夜間體驗與拳擊／泰拳專項課程都會把動作拆成可跟上的節奏，初學者不需要先有拳擊、泰拳或重訓經驗。',
      },
      {
        question: '我只想紓壓，不想真的對打，可以上嗎？',
        answer:
          '可以。這裡的重點是教練引導、手靶或基本動作訓練，以及團體節奏帶來的壓力釋放，不是要求新手直接對打。',
      },
      {
        question: '台北場館離捷運近嗎？',
        answer:
          '敦南旗艦館靠近捷運忠孝敦化站，內科模範館靠近捷運港墘站，兩館都適合下班後直接過來。',
      },
    ],
  },
  {
    slug: 'taichung-boxing-muay-thai-classes',
    footerLabel: '台中拳擊 / 泰拳課程',
    footerDescription: '勤美旗艦館、初學者與下班後訓練',
    eyebrow: 'TAICHUNG GUIDE',
    title: '台中拳擊、泰拳課程怎麼選？勤美旗艦館初學者指南',
    description:
      '想在台中找拳擊課、泰拳課、踢拳課或固定運動習慣？整理 UFCGYM TAIWAN 台中勤美旗艦館的課程選擇、交通位置與新手問題。',
    keywords: [
      '台中拳擊課程',
      '台中泰拳課程',
      '台中踢拳課',
      '勤美拳擊',
      '台中格鬥健身',
      '台中 UFCGYM',
      '台中下班後運動',
    ],
    searchIntents: [
      '台中拳擊課程推薦',
      '台中泰拳新手可以上嗎',
      '勤美附近拳擊課',
      '台中下班後運動課程',
      '想找固定運動習慣台中',
    ],
    heroImage: muayThaiPoster,
    heroAlt: '台中 UFC GYM 拳擊與泰拳課程訓練畫面',
    venueIds: ['venue-taichung'],
    sections: [
      {
        title: '如果你正在找「台中拳擊課程」',
        answer:
          '先確認你要的是一次體驗，還是接下來幾週固定出現。單堂入場券適合先進場感受氣氛；拳擊／泰拳專項課程適合想把兩堂或四堂排進行事曆的人。',
        bullets: [
          '台中勤美旗艦館在公益路商圈，適合西區、北區、南屯通勤路線。',
          '第一次上課建議先選能穩定到場的時段，而不是只看課名。',
          '如果你容易中斷運動，拳擊／泰拳專項課程比單堂更能幫你建立節奏。',
        ],
      },
      {
        title: '台中泰拳課適合新手嗎？',
        answer:
          '適合。新手最需要的不是先變強，而是有清楚的教練引導、可跟上的動作拆解，以及一個能讓你完成課程的團體節奏。',
      },
      {
        title: '為什麼格鬥健身適合下班後？',
        answer:
          '拳擊、泰拳和踢拳會讓你把注意力從工作切回身體。你不只是消耗熱量，而是在一段明確的節奏裡，把壓力透過動作釋放掉。',
      },
    ],
    faqs: [
      {
        question: '台中勤美旗艦館可以先體驗嗎？',
        answer:
          '可以先從單堂入場券的單堂體驗開始；如果你想固定幾週，再改看 拳擊／泰拳專項課程梯次。',
      },
      {
        question: '拳擊、泰拳、踢拳哪個比較累？',
        answer:
          '泰拳與踢拳通常會用到更多下肢和核心，體感更全身；拳擊更集中在出拳、步伐和節奏。兩者都可以依新手程度調整。',
      },
      {
        question: '我很久沒運動，可以跟上嗎？',
        answer:
          '可以從基礎課與可到場的時段開始。重點是把第一堂完成，再讓身體慢慢記住這個節奏。',
      },
    ],
  },
  {
    slug: 'beginner-combat-fitness',
    footerLabel: '拳擊泰拳新手指南',
    footerDescription: '第一次上課、會不會被打、要帶什麼',
    eyebrow: 'BEGINNER GUIDE',
    title: '拳擊、泰拳初學者可以上嗎？第一次格鬥健身指南',
    description:
      '第一次想上拳擊課或泰拳課，常會擔心跟不上、被打、動作不會做。這份新手指南整理 UFC GYM 夜間體驗與拳擊／泰拳專項課程的差異和選課方式。',
    keywords: [
      '拳擊初學者',
      '泰拳初學者',
      '第一次上拳擊課',
      '格鬥健身新手',
      '拳擊課會被打嗎',
      '女生拳擊課',
      '不會打拳可以上嗎',
    ],
    searchIntents: [
      '拳擊課新手可以上嗎',
      '泰拳課會不會被打',
      '第一次拳擊課要帶什麼',
      '格鬥健身適合女生嗎',
      '不會運動可以上拳擊／泰拳專項課程嗎',
    ],
    heroImage: beginnerPoster,
    heroAlt: '教練引導初學者進行 拳擊／泰拳專項課程格鬥健身訓練',
    venueIds: ['venue-dunnan', 'venue-neihu', 'venue-taichung'],
    sections: [
      {
        title: '完全沒有基礎，可以上拳擊或泰拳課嗎？',
        answer:
          '可以。初學者真正需要的是可理解的動作、教練在場引導，以及不會讓人一開始就放棄的節奏。你不需要先練好體能才來，課程本身就是建立體能和信心的起點。',
      },
      {
        title: 'UFC GYM 夜間體驗和拳擊／泰拳專項課程怎麼選？',
        answer:
          '如果你只是想知道自己喜不喜歡這種訓練，先選單堂入場券。若你已經知道自己不只想試一次，拳擊／泰拳專項課程會把接下來兩堂或四堂先排好，降低中斷的機率。',
      },
      {
        title: '第一次上課最怕的是什麼？',
        answer:
          '多數人不是怕累，而是怕看起來很笨、怕動作跟不上、怕不知道該站哪裡。所以新手課程需要清楚的指令、場館資訊、日期選擇和保留堂數，讓你只要照著下一步走。',
        bullets: [
          '先選你真的方便抵達的場館。',
          '再選第一堂日期，讓系統帶出後續節奏。',
          '最後選兩堂或四堂，讓自己有機會形成習慣。',
        ],
      },
    ],
    faqs: [
      {
        question: '拳擊課或泰拳課會直接對打嗎？',
        answer:
          '新手入門不會把重點放在直接對打，而是基本動作、節奏、手靶、踢擊與體能引導。',
      },
      {
        question: '女生可以上拳擊或泰拳課嗎？',
        answer:
          '可以。格鬥健身不是只給特定體型或性別的人，重點是教練引導與課程強度是否能讓你安全完成。',
      },
      {
        question: '第一次上課要先買裝備嗎？',
        answer:
          '不一定。購買前可以先確認場館與課程需求；如果只是第一次體驗，建議先把日期與場館選好，再依課程說明準備。',
      },
    ],
  },
  {
    slug: 'stress-release-after-workout',
    footerLabel: '下班後紓壓運動',
    footerDescription: '壓力大、想動起來、不想再只滑手機',
    eyebrow: 'STRESS RELEASE GUIDE',
    title: '下班後想紓壓，拳擊和泰拳為什麼比一般運動更有感？',
    description:
      '如果你搜尋壓力釋放運動、下班後運動、上班族紓壓，這頁整理拳擊、泰拳、UFC GYM 夜間體驗與拳擊／泰拳專項課程如何把情緒轉成可完成的身體節奏。',
    keywords: [
      '下班後運動',
      '壓力釋放運動',
      '上班族紓壓',
      '台北下班後運動',
      '台中下班後運動',
      '不無聊的運動',
      '拳擊紓壓',
      '泰拳紓壓',
    ],
    searchIntents: [
      '壓力大適合什麼運動',
      '下班後不想只滑手機',
      '上班族紓壓課程',
      '拳擊可以紓壓嗎',
      '想找不無聊的固定運動',
    ],
    heroImage: stressPoster,
    heroAlt: '下班後透過 UFC GYM 夜間體驗拳擊訓練釋放壓力',
    venueIds: ['venue-dunnan', 'venue-neihu', 'venue-taichung'],
    sections: [
      {
        title: '壓力大時，為什麼拳擊會比滑手機有用？',
        answer:
          '滑手機讓你暫時離開壓力，但身體沒有真的完成釋放。拳擊與泰拳會讓注意力集中在呼吸、出拳、踢擊和節奏，讓壓力有一個能被身體承接的出口。',
      },
      {
        title: '下班後運動最難的是開始',
        answer:
          '真正卡住的通常不是不知道運動有用，而是下班後已經太累，不想再做選擇。這也是 拳擊／泰拳專項課程要先選場館、日期與堂數的原因：把決定提前做好，當天只要出現。',
      },
      {
        title: '想釋放壓力，要選單堂還是 拳擊／泰拳專項課程？',
        answer:
          '如果你需要的是一晚的切換，選單堂入場券。若你想讓這種狀態在接下來幾週反覆出現，選 拳擊／泰拳專項課程，讓訓練變成固定節奏。',
      },
    ],
    faqs: [
      {
        question: '拳擊真的可以紓壓嗎？',
        answer:
          '對很多人來說可以，因為它同時需要專注、出力、呼吸和節奏。它不是只靠意志力撐完的運動，而是能把情緒轉成動作。',
      },
      {
        question: '下班後太累還適合上課嗎？',
        answer:
          '可以先選交通最順的場館與可承受的堂數。真正能長期留下來的運動，通常不是最熱血的選項，而是你最可能準時到場的選項。',
      },
      {
        question: '我只是想找不無聊的運動，適合嗎？',
        answer:
          '適合。拳擊、泰拳和 UFC GYM 夜間體驗的節奏感很強，對不喜歡傳統器材訓練或一個人運動的人，通常更容易進入狀態。',
      },
    ],
  },
]

export function findSeoGuide(slug: string) {
  return seoGuides.find((guide) => guide.slug === slug)
}

