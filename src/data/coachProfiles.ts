import andrePhoto from '../assets/coaches/andre.jpg'
import brunoPhoto from '../assets/coaches/bruno.jpg'
import gotPhoto from '../assets/coaches/got.jpg'
import marioPhoto from '../assets/coaches/mario.jpg'
import mengyanPhoto from '../assets/coaches/mengyan.jpg'
import rafaelPhoto from '../assets/coaches/rafael.jpg'
import simPhoto from '../assets/coaches/sim.jpg'

export type CoachProfile = {
  id: string
  aliases: string[]
  displayName: string
  shortName: string
  role: string
  venues: string[]
  specialties: string[]
  photo: string
  intro: string
  trustPoints: string[]
  record?: string
  languages?: string[]
}

export const coachProfiles: CoachProfile[] = [
  {
    id: 'andre',
    aliases: ['UFC GYM 總部 — Andre', 'UFC GYM總部-Andre'],
    displayName: 'UFC GYM 總部 — Andre',
    shortName: 'Andre',
    role: '泰拳 / MMA 教練',
    venues: ['敦南旗艦館', '內科模範館'],
    specialties: ['泰拳', 'MMA', '拳擊', '踢拳', '巴西柔術'],
    photo: andrePhoto,
    intro:
      '16 年以上泰拳與綜合格鬥選手及教練經驗，擅長用清楚節奏帶學員進入壓力，再把動作穩定完成。',
    trustPoints: [
      '泰拳黑帶與踢拳黑帶',
      '國際拳擊協會裁判指導員',
      '巴西柔術紫帶',
    ],
    record: '曾在泰國、瑞士與多地賽事取得冠軍。',
  },
  {
    id: 'bruno',
    aliases: ['UFC GYM 總部 — Bruno', 'UFC GYM總部-Bruno'],
    displayName: 'UFC GYM 總部 — Bruno',
    shortName: 'Bruno',
    role: '泰拳 / MMA 教練',
    venues: ['敦南旗艦館', '內科模範館'],
    specialties: ['泰拳', 'MMA', '踢拳', '巴西柔術', '拳擊'],
    photo: brunoPhoto,
    intro:
      '10 年以上選手與教練經驗，能把實戰壓力拆成新手跟得上的節奏，讓你在喘、累、緊張時仍然完成下一個動作。',
    trustPoints: ['泰拳黑帶', '巴西柔術黑帶', 'IBJJF 巴西柔術教練證'],
    record: '職業泰拳 14 勝 5 負，職業綜合格鬥 4 勝 3 負。',
    languages: ['英文', '葡萄牙文'],
  },
  {
    id: 'got',
    aliases: ['UFC GYM 總部 — Got', 'UFC GYM總部-Got'],
    displayName: 'UFC GYM 總部 — Got',
    shortName: 'Got',
    role: '泰拳 / 踢拳教練',
    venues: ['台中勤美旗艦'],
    specialties: ['泰拳', '踢拳', '職業選手靶師', '團課節奏'],
    photo: gotPhoto,
    intro:
      '具泰拳教師資格，曾於泰國與深圳泰拳館擔任教練，適合想用全身動作把壓力打開的人。',
    trustPoints: [
      'Kru Muay Thai Association 教師證',
      'LKT Muay Thai Gym 團課教練與職業選手靶師',
      'Yutthasart Muay Thai Gym 泰拳教官',
    ],
    record: '曾參與 CPF、Khlong Lan、Singmanasak、JF 等泰拳與拳擊賽事。',
  },
  {
    id: 'mario',
    aliases: ['UFC GYM 總部 — Mario', 'UFC GYM總部-Mario'],
    displayName: 'UFC GYM 總部 — Mario',
    shortName: 'Mario',
    role: '巴西柔術 / MMA 教練',
    venues: ['敦南旗艦館', '內科模範館'],
    specialties: ['巴西柔術', 'MMA', '泰拳', '踢拳', '拳擊'],
    photo: marioPhoto,
    intro:
      '超過 11 年巴西柔術與綜合格鬥選手及教練經驗，擅長把身體控制、距離感與壓力應對變成可理解的訓練。',
    trustPoints: ['巴西柔術黑帶', '泰拳棕帶', '巴西柔術黑帶 2 段'],
    record: '職業綜合格鬥賽事 28 勝 5 負。',
  },
  {
    id: 'rafael',
    aliases: ['UFC GYM 總部 — Rafael', 'UFC GYM總部-Rafael'],
    displayName: 'UFC GYM 總部 — Rafael',
    shortName: 'Rafael',
    role: '巴西柔術 / MMA 教練',
    venues: ['敦南旗艦館', '內科模範館'],
    specialties: ['巴西柔術', 'MMA', '拳擊', '泰拳', '角力'],
    photo: rafaelPhoto,
    intro:
      '13 年以上選手與教練經驗，兼具健身教練與體育老師背景，能用扎實的身體控制建立安全感與行動感。',
    trustPoints: [
      '巴西柔術黑帶 4 段',
      '體育學士',
      '10 年以上健身教練與體育老師經驗',
    ],
    record:
      'Jungle Fight champion 2013，IBJJF Asian Championship 2025 量級與無限量級第一名。',
    languages: ['英文', '葡萄牙文'],
  },
  {
    id: 'sim',
    aliases: ['UFC GYM 總部 — 沈奕全/Sim', 'UFC GYM總部-沈奕全/Sim'],
    displayName: 'UFC GYM 總部 — 沈奕全/Sim',
    shortName: '沈奕全/Sim',
    role: '柔道 / 綜合格鬥教練',
    venues: ['台中勤美旗艦'],
    specialties: ['柔道', '巴西柔術', '綜合格鬥', '寢技'],
    photo: simPhoto,
    intro:
      '台北市立大學技擊與運動健康背景，具柔道、巴西柔術與綜合格鬥教練資格，適合想建立身體控制與穩定反應的人。',
    trustPoints: [
      '柔道黑帶二段',
      '巴西柔術紫帶',
      '綜合格鬥與柔道 C 級教練 / 裁判證',
    ],
    record:
      '2025 ASJJF Taiwan Open Purple M30 量級與公開組金牌，馬來西亞柔道代表隊經歷。',
  },
  {
    id: 'mengyan',
    aliases: ['UFC GYM 總部 — 楊孟諺/孟諺', 'UFC GYM總部-楊孟諺/孟諺'],
    displayName: 'UFC GYM 總部 — 楊孟諺/孟諺',
    shortName: '楊孟諺/孟諺',
    role: '拳擊 / 戰鬥體適能教練',
    venues: ['敦南旗艦館', '內科模範館'],
    specialties: ['拳擊', '戰鬥體適能', '兒童體適能', '散打'],
    photo: mengyanPhoto,
    intro:
      '拳擊隊與運動技擊背景，擅長把拳擊訓練變成清楚、有節奏、能讓新手進入狀態的身體經驗。',
    trustPoints: [
      '拳擊專任教練證',
      'B 級拳擊教練',
      'C 級拳擊裁判',
    ],
    record: '全國大專盃拳擊錦標賽四連霸，多次全運會拳擊獎牌。',
  },
]

function normalizeCoachName(value: string) {
  return value.replace(/\s+/g, '').replace(/[－—–]/g, '-').trim()
}

const coachProfileLookup = new Map<string, CoachProfile>()

for (const profile of coachProfiles) {
  for (const alias of profile.aliases) {
    coachProfileLookup.set(normalizeCoachName(alias), profile)
  }
}

export function findCoachProfile(coachName: string) {
  return coachProfileLookup.get(normalizeCoachName(coachName)) ?? null
}

export function getCoachDisplayName(coachName: string) {
  const parts = coachName.split('—')
  return (parts[1] ?? parts[0]).trim()
}
