import andrePhoto from '../assets/coaches/andre.jpg'
import brunoPhoto from '../assets/coaches/bruno.jpg'
import gotPhoto from '../assets/coaches/got.jpg'
import marioPhoto from '../assets/coaches/mario.jpg'
import mengyanPhoto from '../assets/coaches/mengyan.jpg'
import rafaelPhoto from '../assets/coaches/rafael.jpg'
import simPhoto from '../assets/coaches/sim.jpg'

export type CoachPricingTier = 'foreign-fighter' | 'domestic-teacher'

export type CoachProfile = {
  id: string
  aliases: string[]
  displayName: string
  shortName: string
  pricingTier: CoachPricingTier
  role: string
  venues: string[]
  specialties: string[]
  photo: string
  intro: string
  trustPoints: string[]
  nationality?: string
  bio?: string[]
  certifications?: string[]
  experience?: string[]
  achievements?: string[]
  record?: string
  languages?: string[]
}

export const coachProfiles: CoachProfile[] = [
  {
    id: 'andre',
    aliases: ['UFC GYM 總部 — Andre', 'UFC GYM總部-Andre', 'Andre'],
    displayName: 'UFC GYM 總部 — Andre',
    shortName: 'Andre',
    pricingTier: 'foreign-fighter',
    role: '泰拳 / MMA 教練',
    venues: ['敦南旗艦館', '內科模範館'],
    specialties: ['泰拳', 'MMA', '拳擊', '踢拳', '巴西柔術'],
    photo: andrePhoto,
    intro:
      '專精於泰拳及綜合格鬥 MMA，也擅長拳擊、踢拳及巴西柔術。',
    trustPoints: [
      '16 年以上泰拳與綜合格鬥選手及教練經驗',
      '2006 年於瑞士獲得泰拳世界冠軍',
      '多項 MMA、Vale Tudo 與泰拳賽事冠軍經歷',
    ],
    nationality: '巴西',
    bio: [
      '專精於泰拳及綜合格鬥 MMA，也擅長拳擊、踢拳及巴西柔術。',
      '16 年以上泰拳及綜合格鬥選手與教練教學經驗，曾在泰國及瑞士與其他專業格鬥士一起進行訓練。',
      '曾在國家及國際比賽中多次得到冠軍，2002 年於巴西獲得泰拳量級冠軍，2006 年於歐洲瑞士獲得泰拳世界冠軍，並曾在世界各地舉辦研習活動及進行教學。',
    ],
    certifications: [
      '2002 泰拳黑帶證明',
      '2010 國際拳擊協會裁判指導員證明',
      '2014 泰拳黑白帶證明',
      '2015 踢拳黑帶證明',
      '2016 巴西柔術紫帶資格',
    ],
    achievements: [
      'Champion - Cearense of Muay Thai',
      'Champion - North and Northeast of Muay Thai',
      'Champion - Shock Fight Boxe Thai',
      'Champion - Swiss of Muay Thai',
      'European Champion of Muay Thai',
      'Bi-Champion of Fight Night - Zurich Swiss',
      'Champion - Shock Fight',
      'Champion - Bad Boy (Vale Tudo)',
      'Champion - Strick Brazil (Vale Tudo)',
      'Champion - Mossoro Fight - Mossoro/RN',
      'Champion - Serido (Vale Tudo) Caico/RN',
      'Champion - Ceara (Vale Tudo)',
      'Champion - Metropole Fight Championship',
      'Champion - Nocaute MMA Edition',
      'Champion - Predator Fight Kammae - Belem/PA',
      'Champion - Shooto Brazil 7 - Rio de Janeiro/RJ',
    ],
  },
  {
    id: 'bruno',
    aliases: ['UFC GYM 總部 — Bruno', 'UFC GYM總部-Bruno', 'Bruno'],
    displayName: 'UFC GYM 總部 — Bruno',
    shortName: 'Bruno',
    pricingTier: 'foreign-fighter',
    role: '泰拳 / MMA 教練',
    venues: ['敦南旗艦館', '內科模範館'],
    specialties: ['泰拳', 'MMA', '踢拳', '巴西柔術', '拳擊'],
    photo: brunoPhoto,
    intro:
      '專精於泰拳、綜合格鬥 MMA、踢拳、巴西柔術及拳擊。',
    trustPoints: [
      '10 年以上選手與教練教學經驗',
      '職業泰拳 14 勝 5 負、職業 MMA 4 勝 3 負',
      '泰拳黑帶、巴西柔術黑帶與 IBJJF 教練證',
    ],
    nationality: '巴西',
    bio: [
      '專精於泰拳、綜合格鬥 MMA、踢拳、巴西柔術及拳擊，有 10 年以上選手及教練教學經驗。',
      '擁有職業泰拳比賽 14 勝 5 負、職業綜合格鬥比賽 4 勝 3 負的紀錄。',
    ],
    certifications: [
      '泰拳黑帶證明',
      '巴西柔術黑帶證明',
      'IBJJF 巴西柔術教練證',
    ],
    achievements: [
      '2017 國際踢拳協會南美盃泰拳冠軍',
      '2017 巴西 NCE 職業 MMA 比賽冠軍',
      '2018 巴西州際職業柔術聯賽棕帶金牌',
      '2018 泰國 Copa de Bangkok 量級及無限量級冠軍',
      '2019 WOTD 職業技擊爭霸 - 降服勝',
      '2020 TJJF 今源盃格鬥組與寢技組冠軍',
    ],
    record: '職業泰拳 14 勝 5 負；職業 MMA 4 勝 3 負。',
    languages: ['英文', '葡萄牙文'],
  },
  {
    id: 'got',
    aliases: ['UFC GYM 總部 — Got', 'UFC GYM總部-Got', 'Got'],
    displayName: 'UFC GYM 總部 — Got',
    shortName: 'Got',
    pricingTier: 'foreign-fighter',
    role: '泰拳 / 踢拳教練',
    venues: ['台中勤美旗艦'],
    specialties: ['泰拳', '踢拳', '職業選手靶師', '團課教練'],
    photo: gotPhoto,
    intro:
      '具泰拳教師資格，曾於泰國與中國深圳泰拳館擔任教練。',
    trustPoints: [
      'Kru Muay Thai Association 教師證明',
      'LKT Muay Thai Gym 團課教練與職業選手靶師',
      'Yutthasart Muay Thai Gym 泰拳教官',
    ],
    bio: [
      '具泰拳教師資格，曾於泰國 LKT Muay Thai Gym 擔任團課教練與職業選手靶師。',
      '2024 至 2025 年於中國深圳 Yutthasart Muay Thai Gym 擔任泰拳教官，並累積多場泰國拳擊與泰拳賽事經驗。',
    ],
    certifications: ['Kru Muay Thai Association - Certificate of Teacher'],
    experience: [
      '2018-2023 泰國 LKT Muay Thai Gym 團課教練、職業選手靶師',
      '2024-2025 中國深圳 Yutthasart Muay Thai Gym 泰拳教官',
    ],
    achievements: [
      '2022 CPF 拳擊賽（曼谷 Rangsit 國際拳擊場）',
      '2022 Khlong Lan 拳擊賽（甘烹碧 Kamphaeng Phet）',
      '2022 Singmanasak 泰拳賽（曼谷）',
      '2020 JF 泰拳賽（芭堤雅 Stadium Pattaya）',
      '2020 Mahanakorn University 泰拳賽（Fierce Awards，曼谷）',
      '2018-2019 StreetFight（曼谷）',
    ],
  },
  {
    id: 'mario',
    aliases: ['UFC GYM 總部 — Mario', 'UFC GYM總部-Mario', 'Mario'],
    displayName: 'UFC GYM 總部 — Mario',
    shortName: 'Mario',
    pricingTier: 'foreign-fighter',
    role: '巴西柔術 / MMA 教練',
    venues: ['敦南旗艦館', '內科模範館'],
    specialties: ['巴西柔術', 'MMA', '泰拳', '踢拳', '拳擊'],
    photo: marioPhoto,
    intro:
      '專精於巴西柔術及綜合格鬥 MMA，並擅長泰拳、踢拳及拳擊。',
    trustPoints: [
      '11 年以上巴西柔術與綜合格鬥選手及教練經驗',
      'Team Nova Uniao 國際水準教學與實戰背景',
      '職業 MMA 賽事 28 勝 5 負',
    ],
    nationality: '巴西',
    bio: [
      '專精於巴西柔術及綜合格鬥 MMA，並擅長泰拳、踢拳及拳擊。',
      '超過 11 年巴西柔術及綜合格鬥選手與教練教學經驗，受到 Team Nova Uniao 推薦為擁有國際認證水準教學經驗及多年選手實戰經驗的優秀教師。',
      '曾培育數位學生成為國家及世界級冠軍，擁有在巴西及亞洲的教學經驗。',
      '曾在巴西大型格鬥賽事 Mr. Cage 與 Shooto Brazil 中作為主力團隊代表之一，並多次在國家級綜合格鬥比賽中得到冠軍；職業 MMA 賽事紀錄為 28 勝 5 負。近期曾在香港綜合格鬥比賽中以 16 秒淘汰對手。',
    ],
    certifications: [
      '2009 獲得巴西柔術黑帶證明',
      '2014 獲得泰拳棕帶證明',
      '2016 獲得巴西柔術黑帶 2 段證明',
    ],
    achievements: [
      'MMA Brazilian King Fighter Champion, Fortaleza (2014)',
      'MMA Mr. Cage Champion, Manaus (2014)',
      'MMA Shooto, Manaus (2013)',
      'MMA Golden Fight, Macapa (2012)',
      'Submission Professional State Champion, Piaui, Brazil (2012)',
      'MMA Amazon Fight, Belem (2011)',
      'Jiu-Jitsu Black Belt State Champion, Ceara, Brazil (2009)',
    ],
    record: '職業 MMA 賽事 28 勝 5 負。',
  },
  {
    id: 'rafael',
    aliases: ['UFC GYM 總部 — Rafael', 'UFC GYM總部-Rafael', 'Rafael'],
    displayName: 'UFC GYM 總部 — Rafael',
    shortName: 'Rafael',
    pricingTier: 'foreign-fighter',
    role: '巴西柔術 / MMA 教練',
    venues: ['敦南旗艦館', '內科模範館'],
    specialties: ['巴西柔術', 'MMA', '拳擊', '泰拳', '角力'],
    photo: rafaelPhoto,
    intro:
      '專精於巴西柔術、綜合格鬥 MMA 及拳擊，並擅長泰拳及角力。',
    trustPoints: [
      '13 年以上巴西柔術與綜合格鬥選手及教練經驗',
      '巴西柔術黑帶 4 段',
      '職業 MMA 賽事 11 勝 5 負',
    ],
    nationality: '巴西',
    bio: [
      '專精於巴西柔術、綜合格鬥 MMA 及拳擊，並擅長泰拳及角力。',
      '超過 13 年巴西柔術及綜合格鬥選手與教練教學經驗，以及超過 10 年健身教練及體育老師經驗，曾在世界各地進行教學。',
      '獲得多項武術賽事冠軍，並擁有職業綜合格鬥賽事 11 勝 5 負的紀錄。曾與多位知名冠軍選手共同訓練，包含巴西柔術與 UFC 冠軍級選手。',
      '近年來參與台灣巴西柔術、拳擊和散打賽事獲得多面金牌，並多次在亞洲區巴西柔術及綜合格鬥 MMA 賽事中擔任裁判。',
    ],
    certifications: [
      '2008 體育學士學位證書',
      '2011 巴西柔術黑帶證明',
      '2017 巴西柔術黑帶 2 段',
      '2020 巴西柔術黑帶 3 段',
      '2025 巴西柔術黑帶 4 段',
    ],
    achievements: [
      'Black belt 4th degree',
      'Jungle Fight champion - 2013 (Brazil)',
      'Brazilian Jiu Jitsu national champion - 2006',
      'Brazilian Midwest Boxing amateur champion - 2009',
      "Mariana's Pro 2025, first place at medium heavy weight adult division and absolute division",
      'IBJJF Asian Championship 2025, first place at medium heavy weight master 2 and absolute division',
    ],
    record: '職業 MMA 賽事 11 勝 5 負。',
    languages: ['英文', '葡萄牙文'],
  },
  {
    id: 'sim',
    aliases: ['UFC GYM 總部 — 沈奕全/Sim', 'UFC GYM總部-沈奕全/Sim', '沈奕全/Sim', 'Sim'],
    displayName: 'UFC GYM 總部 — 沈奕全/Sim',
    shortName: '沈奕全 / Sim',
    pricingTier: 'domestic-teacher',
    role: '柔道 / 綜合格鬥教練',
    venues: ['台中勤美旗艦'],
    specialties: ['柔道', '巴西柔術', '綜合格鬥', '摔技'],
    photo: simPhoto,
    intro:
      '台北市立大學技擊與運動健康背景，具柔道、巴西柔術與綜合格鬥教練資格。',
    trustPoints: [
      '柔道黑帶二段、巴西柔術紫帶',
      '曾任馬來西亞砂拉越柔道代表隊教練',
      '綜合格鬥與柔道 C 級教練 / 裁判證',
    ],
    bio: [
      '台北市立大學技擊系柔道隊，台北市立大學運動健康科學研究所背景。',
      '曾任馬來西亞砂拉越柔道代表隊教練，具柔道、巴西柔術、綜合格鬥教練與裁判資格。',
    ],
    certifications: [
      '柔道黑帶二段',
      '巴西柔術紫帶',
      '台灣柔術總會 C 級教練證',
      '中華民國綜合格鬥協會 C 級教練證',
      '中華民國綜合格鬥協會 C 級裁判證',
      '中華民國柔道總會 C 級教練證',
      '中華民國柔道總會 C 級裁判證',
    ],
    experience: [
      '台北市立大學技擊系柔道隊',
      '台北市立大學運動健康科學研究所',
      '馬來西亞砂拉越柔道代表隊教練（2019-2021）',
    ],
    achievements: [
      '2025 JULY ASJJF Taiwan Open - Purple M30 Open - GOLD',
      '2025 ASJJF Taiwan Open - Purple M30 division & Open - GOLD',
      '2024 ASJJF Taiwan Open - Purple Open - GOLD',
      '2024 ASJJF Taiwan Open - Blue Division - GOLD',
      '2019 Southeast Asia Games - Malaysia Judo Team',
      '2017 Southeast Asia Games - Malaysia Judo Team',
      '2015 / 2016 / 2018 / 2019 Malaysia National Judo Championship - GOLD',
    ],
  },
  {
    id: 'mengyan',
    aliases: [
      'UFC GYM 總部 — 楊孟諺/孟諺',
      'UFC GYM總部-楊孟諺/孟諺',
      '楊孟諺/孟諺',
      '孟諺',
    ],
    displayName: 'UFC GYM 總部 — 楊孟諺/孟諺',
    shortName: '楊孟諺 / 孟諺',
    pricingTier: 'domestic-teacher',
    role: '拳擊 / 戰鬥體適能教練',
    venues: ['敦南旗艦館', '內科模範館'],
    specialties: ['拳擊', '兒童體適能', '戰鬥體適能'],
    photo: mengyanPhoto,
    intro:
      '拳擊隊與運動技擊背景，具拳擊教練、拳擊裁判與散打隊教練經歷。',
    trustPoints: [
      '全國大專盃拳擊錦標賽四連霸',
      '2015、2017 全運會銀牌；2019 全運會銅牌',
      '拳擊專任教練證、B 級拳擊教練與 C 級拳擊裁判',
    ],
    bio: [
      '專長為拳擊、兒童體適能與戰鬥體適能，出身台北體院運動技擊學系拳擊隊。',
      '具拳擊專任教練證、拳擊裁判資格與散打隊教練經歷，曾任 2020 全中運散打隊教練。',
    ],
    certifications: [
      '台北體院運動技擊學系拳擊隊',
      '拳擊專任教練證',
      'B 級拳擊教練',
      'C 級拳擊裁判',
      '2020 全中運散打隊教練（百齡高中）',
      '肯將拳擊訓練中心',
    ],
    achievements: [
      '全國大專盃拳擊錦標賽四連霸',
      '2019 全運會銅牌',
      '2015、2017 年全運會銀牌',
      'WOTD MMA 組 77kg 2 勝 1 負',
      '2019 年全國運動會拳擊項目 81kg 級第三名',
      '2017 年全國運動會拳擊項目 81kg 級第二名',
      '2015 年全國運動會拳擊項目 75kg 級第二名',
      '2014 年全國大專盃拳擊錦標賽 75kg 級第一名',
      '2013 年全國大專盃拳擊錦標賽 75kg 級第一名',
      '2012 年全國運動會拳擊項目 75kg 級第三名',
      '2012 年全國大專盃拳擊錦標賽 75kg 級第一名',
      '2011 年全國大專盃拳擊錦標賽最佳技術獎',
      '2011 年全國大專盃拳擊錦標賽 75kg 級第一名',
      '2008 年北京奧運培訓代表隊',
      '2008 年泰皇盃拳擊錦標賽代表隊',
      '2007 & 2008 年 2 屆世界青少年拳擊代表隊',
    ],
  },
]

function normalizeCoachName(value: string) {
  return value
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/[—－–-]/g, '-')
    .trim()
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

const foreignFighterNameKeywords = [
  'Andre',
  'Bruno',
  'Got',
  'Mario',
  'Rafael',
  'Ygor',
  'Alex Morales',
]

export function getCoachPricingTier(
  coachName: string,
  profile = findCoachProfile(coachName),
): CoachPricingTier {
  if (profile) return profile.pricingTier

  const normalized = normalizeCoachName(coachName).toLowerCase()
  const isForeignFighter = foreignFighterNameKeywords.some((keyword) =>
    normalized.includes(normalizeCoachName(keyword).toLowerCase()),
  )

  return isForeignFighter ? 'foreign-fighter' : 'domestic-teacher'
}

export function getCoachDisplayName(coachName: string) {
  const parts = coachName.split(/—|-/)
  return (parts[1] ?? parts[0]).trim()
}
