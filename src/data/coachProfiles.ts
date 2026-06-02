import andrePhoto from '../assets/coaches/andre.jpg'
import brunoPhoto from '../assets/coaches/bruno.jpg'
import edwardPhoto from '../assets/coaches/edward.jpg'
import flyPhoto from '../assets/coaches/fly.jpg'
import giloPhoto from '../assets/coaches/gilo.jpg'
import gotPhoto from '../assets/coaches/got.jpg'
import howardPhoto from '../assets/coaches/howard.jpg'
import joycePhoto from '../assets/coaches/joyce.jpg'
import marioPhoto from '../assets/coaches/mario.jpg'
import mengyanPhoto from '../assets/coaches/mengyan.jpg'
import rafaelPhoto from '../assets/coaches/rafael.jpg'
import renPhoto from '../assets/coaches/ren.jpg'
import ruruPhoto from '../assets/coaches/ruru.jpg'
import simPhoto from '../assets/coaches/sim.jpg'
import simonPhoto from '../assets/coaches/simon.jpg'
import tonyPhoto from '../assets/coaches/tony.jpg'
import willisPhoto from '../assets/coaches/willis.jpg'

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
  {
    id: 'ruru',
    aliases: ['內科館 — 朱如潔/RuRu', '朱如潔/RuRu', 'RuRu', 'Ruru'],
    displayName: '內科館 — 朱如潔/RuRu',
    shortName: '朱如潔 / RuRu',
    pricingTier: 'domestic-teacher',
    role: '拳擊 / 踢拳教練',
    venues: ['內科模範館'],
    specialties: ['拳擊', '踢拳', '運動按摩', '備賽訓練', '功能性訓練', '綜合體能訓練'],
    photo: ruruPhoto,
    intro:
      '專長為拳擊、踢拳、運動按摩與綜合體能訓練，具拳擊教練與裁判資格。',
    trustPoints: [
      '中華民國拳擊協會 C 級教練證',
      '新北市體育總會拳擊委員會 C 級裁判證',
      '2016 全國總統盃拳擊錦標賽女子第二量級冠軍',
    ],
    certifications: [
      '中華民國拳擊協會 C 級教練證',
      '新北市體育總會拳擊委員會 C 級裁判證',
    ],
    achievements: [
      '2020 全國總統盃拳擊錦標賽女子第二量級第三名',
      '2019 全國大專院校運動會女子組第二量級第三名',
      '2018 全國大專院校運動會女子組第二量級第二名',
      '2017 全國大專院校運動會女子組第二量級第一名',
      '2017 全國總統盃拳擊錦標賽女子第二量級第三名',
      '2017 全國運動會武術 52 公斤第四名',
      '2016 全國大專院校運動會女子組第二量級第二名',
      '2016 全國總統盃拳擊錦標賽女子第二量級冠軍',
      '2014 全國中等學校武術錦標賽 52 公斤冠軍',
      '2014 全國中等學校運動會武術 52 公斤第三名',
    ],
  },
  {
    id: 'joyce',
    aliases: ['台中館 — 江郁欣/Joyce', '江郁欣/Joyce', 'Joyce'],
    displayName: '台中館 — 江郁欣/Joyce',
    shortName: '江郁欣 / Joyce',
    pricingTier: 'domestic-teacher',
    role: '拳擊 / 肌力訓練教練',
    venues: ['台中館'],
    specialties: ['拳擊', '繩流', '肌力訓練', '增肌減脂', '備賽訓練'],
    photo: joycePhoto,
    intro:
      '專長為拳擊、繩流、肌力訓練與備賽訓練，具拳擊教練與裁判資格。',
    trustPoints: [
      '國立高雄師範大學性別教育研究所碩士',
      '中華民國拳擊協會 B 級教練與 C 級裁判',
      '2022 全國總統盃拳擊錦標賽社女組 54 公斤級銅牌',
    ],
    certifications: [
      '中華民國拳擊協會 B 級教練',
      '中華民國拳擊協會 C 級裁判',
      'WBC 進階拳擊教練',
      'Beat 拳擊節奏訓練系統 LV.1 訓練師',
      'Thump Boxing LV.2 教練',
      '中華民國拳擊武術有氧體適能協會 B 級教練',
    ],
    experience: ['國立高雄師範大學性別教育研究所碩士'],
    achievements: [
      '2022 全國總統盃拳擊錦標賽社女組 54 公斤級銅牌（最佳精神獎）',
      '2019 全國總統盃拳擊錦標賽社女組 57 公斤級銅牌',
      '2018 全國總統盃拳擊錦標賽社女組 57 公斤級銅牌',
    ],
  },
  {
    id: 'fly',
    aliases: ['敦南館 — 呂昶褘/Fly', '呂昶褘/Fly', 'Fly'],
    displayName: '敦南館 — 呂昶褘/Fly',
    shortName: '呂昶褘 / Fly',
    pricingTier: 'domestic-teacher',
    role: '教練部主任',
    venues: ['敦南旗艦館'],
    specialties: ['綜合體能訓練', '拳擊', '備賽訓練'],
    photo: flyPhoto,
    intro:
      '專長為綜合體能、拳擊與備賽訓練，具抗阻力、健力、救護與伸展相關教練資歷。',
    trustPoints: [
      'RTS 國際抗阻力教練證照',
      'Myofascial Stretch Instructor 肌筋膜伸展師',
      '2006 國際青年邀請賽 51 公斤第一名',
    ],
    certifications: [
      'RTS 國際抗阻力教練證照',
      '中華民國健力協會健力 C 級教練證',
      'EMT-1 LICENSE 初級救護技術員',
      'PES-Education 生物力學與訓練動作執行',
      'Myofascial Stretch Instructor 肌筋膜伸展師',
    ],
    achievements: [
      '2007 大專盃 51 公斤第一名',
      '2007 全國運動會 51 公斤第二名',
      '2006 國際青年邀請賽 51 公斤第一名',
      '2005 亞洲青年盃國手',
      '2005 年全國運動會 51 公斤第三名',
      '2004 奧運培訓隊',
    ],
  },
  {
    id: 'gilo',
    aliases: ['敦南館 — 謝玟賢/Gilo', '謝玟賢/Gilo', 'Gilo'],
    displayName: '敦南館 — 謝玟賢/Gilo',
    shortName: '謝玟賢 / Gilo',
    pricingTier: 'domestic-teacher',
    role: '拳擊 / 體能訓練教練',
    venues: ['敦南旗艦館'],
    specialties: ['拳擊', '備賽訓練', '功能性訓練', '綜合體能訓練'],
    photo: giloPhoto,
    intro:
      '專長為拳擊、備賽訓練、功能性訓練與綜合體能訓練，具拳擊教練與體適能指導員資格。',
    trustPoints: [
      'CPR & AED Certified',
      '中華民國拳擊 C 級教練訓練證',
      '2011 台北市中正盃拳擊錦標賽 64 公斤第二名',
    ],
    certifications: [
      'CPR & AED Certified',
      '中華民國拳擊 C 級教練訓練證',
      '中華民國體適能 C 級健身指導員',
    ],
    achievements: [
      '2011 台北市中正盃拳擊錦標賽 64 公斤第二名',
      '2008 中等學校拳擊錦標賽 63 公斤第三名',
      '2007 台北市青年盃 63-66 公斤級第一名',
      '2007 全國中等學校拳擊錦標賽第 8 量級第一名',
      '2007 教育盃中等學校拳擊錦標賽第 8 量級第二名',
      '2006 台北市青年盃 64 公斤第二名',
      '2006 全國中等學校拳擊錦標賽第 9 量級第一名',
      '2005 全國總統盃 63 公斤第三名',
      '2004 台北市青年盃中丁級第一名',
    ],
  },
  {
    id: 'ren',
    aliases: ['敦南館 — 陳軍任/Ren', '陳軍任/Ren', 'Ren'],
    displayName: '敦南館 — 陳軍任/Ren',
    shortName: '陳軍任 / Ren',
    pricingTier: 'domestic-teacher',
    role: '踢拳 / 跆拳道教練',
    venues: ['敦南旗艦館'],
    specialties: ['肌力訓練', '增肌減脂', '功能性訓練', '綜合體能訓練', '踢拳', '跆拳道'],
    photo: renPhoto,
    intro:
      '專長為踢拳、跆拳道、肌力與功能性訓練，具跆拳道教練、裁判與體適能資格。',
    trustPoints: [
      '中華民國跆拳道協會 C 級教練證',
      '中華民國跆拳道協會 C 級裁判證',
      '2015 世界漢馬登跆拳道錦標賽金牌',
    ],
    certifications: [
      '中華民國跆拳道協會 C 級教練證',
      '中華民國跆拳道協會 C 級裁判證',
      '中華民國健身運動協會 C 級體適能教練證',
      'AFAA 美國有氧體適能協會重量訓練指導員',
      'Myofascial Stretch Instructor 肌筋膜伸展師',
    ],
    achievements: [
      '2016 全國中等學校運動會銀牌',
      '2015 世界漢馬登跆拳道錦標賽金牌',
      '2014 韓國慶州跆拳道國際公開賽銀牌',
      '2011 韓國春川跆拳道國際公開賽金牌',
    ],
  },
  {
    id: 'willis',
    aliases: ['敦南館 — 賴緯綸/Willis', '賴緯綸/Willis', 'Willis'],
    displayName: '敦南館 — 賴緯綸/Willis',
    shortName: '賴緯綸 / Willis',
    pricingTier: 'domestic-teacher',
    role: '拳擊 / 體能訓練教練',
    venues: ['敦南旗艦館'],
    specialties: ['拳擊', '備賽訓練', '肌力訓練', '增肌減脂', '功能性訓練', '綜合體能訓練'],
    photo: willisPhoto,
    intro:
      '專長為拳擊、備賽訓練、肌力與功能性訓練，具進階拳擊與私人教練認證。',
    trustPoints: [
      '國際 WBC 進階拳擊教練認證',
      'ACE-CPT 美國運動委員會認證私人教練',
      '2025 台灣踢拳協會 T1 09 拳擊積分賽菁英組 67 公斤冠軍',
    ],
    certifications: [
      'AFT C 級健身教練',
      'CPR & AED Certified',
      '國際 WBC 進階拳擊教練認證',
      'ACE-CPT 美國運動委員會認證私人教練',
    ],
    achievements: [
      '2025 台灣踢拳協會 T1 09 拳擊積分賽菁英組 67 公斤冠軍',
      '2020 全國中等學校運動會季軍',
      '2020 全國總統盃拳擊錦標賽季軍',
      '2019 亞洲青年國手拳擊選拔賽亞軍',
      '2018 全國中等學校運動會冠軍',
    ],
  },
  {
    id: 'simon',
    aliases: ['內科館 — 張哲維/Simon', '張哲維/Simon', 'Simon'],
    displayName: '內科館 — 張哲維/Simon',
    shortName: '張哲維 / Simon',
    pricingTier: 'domestic-teacher',
    role: '教練部主任',
    venues: ['內科模範館'],
    specialties: ['泰拳', '踢拳', '飲食觀念', '增肌減脂', '肌力訓練', '功能性訓練', '健力式訓練'],
    photo: simonPhoto,
    intro:
      '專長為泰拳、踢拳、肌力訓練與飲食觀念，具泰拳、壺鈴與體適能相關資歷。',
    trustPoints: [
      'WBC 皇家泰拳教練',
      '中華民國泰拳協會 C 級裁判',
      'KETTLEBELL QUEST 壺鈴教練',
    ],
    certifications: [
      'WBC 皇家泰拳教練',
      '中華民國泰拳協會 C 級裁判',
      'KETTLEBELL QUEST 壺鈴教練',
      '中華民國健身運動協會體適能健身 C 級指導員',
    ],
  },
  {
    id: 'edward',
    aliases: ['內科館 — 陳建豪/Edward', '陳建豪/Edward', 'Edward'],
    displayName: '內科館 — 陳建豪/Edward',
    shortName: '陳建豪 / Edward',
    pricingTier: 'domestic-teacher',
    role: '散打 / 肌力訓練教練',
    venues: ['內科模範館'],
    specialties: ['散打', '角力', '增肌減脂', '運動按摩', '肌力訓練', '功能性訓練', '矯正恢復訓練'],
    photo: edwardPhoto,
    intro:
      '專長為散打、角力、肌力訓練與矯正恢復訓練，具踢拳教練與裁判資格。',
    trustPoints: [
      '中華踢拳協會 C 級教練',
      '中華踢拳協會 C 級裁判',
      '2022 中山盃全球邀請賽武術散打亞軍',
    ],
    certifications: [
      '中華踢拳協會 C 級教練',
      '中華踢拳協會 C 級裁判',
    ],
    achievements: [
      '2022 中山盃全球邀請賽武術散打亞軍',
      '2016 清華盃大專乙組散打錦標賽最佳教練',
      '2014 新竹國際國武術邀請賽散打冠軍',
      '2013 全國大專盃國武術錦標賽季軍',
      '2012 教育盃國武術錦標賽冠軍',
    ],
  },
  {
    id: 'tony',
    aliases: ['內科館 — 高家輝/Tony', '高家輝/Tony', 'Tony'],
    displayName: '內科館 — 高家輝/Tony',
    shortName: '高家輝 / Tony',
    pricingTier: 'domestic-teacher',
    role: '教練部主任',
    venues: ['內科模範館'],
    specialties: ['拳擊', '踢拳', '跆拳道', '肌力訓練', '增肌減脂', '功能性訓練'],
    photo: tonyPhoto,
    intro:
      '專長為拳擊、踢拳、跆拳道、肌力與功能性訓練，具跆拳道與體適能相關證照。',
    trustPoints: [
      '中華民國跆拳道協會黑帶四段',
      '中華民國跆拳道協會 C 級裁判與教練',
      '2014 六縣市跆拳道邀請賽鰭量級金牌',
    ],
    certifications: [
      'CPR.AED 急救技能證明',
      'IPTFA 國際康體健身指導員',
      '中華民國跆拳道協會黑帶四段',
      'TRX STC 懸吊系統訓練師認證',
      '中華民國跆拳道協會 C 級裁判與教練',
      '中華民國健身運動協會體適能健身 C 級指導員',
    ],
    achievements: [
      '2018 WOTD 武跆王職業賽鰭量級參賽',
      '2017 全國跆拳道大專盃鰭量級第八名',
      '2014 六縣市跆拳道邀請賽鰭量級金牌',
      '2014 台北市跆拳道選拔賽鰭量級銀牌',
    ],
  },
  {
    id: 'howard',
    aliases: ['總部團課 — 李泉緯/Howard', '李泉緯/Howard', 'Howard'],
    displayName: '總部團課 — 李泉緯/Howard',
    shortName: '李泉緯 / Howard',
    pricingTier: 'domestic-teacher',
    role: '拳擊 / 戰鬥體適能教練',
    venues: ['敦南旗艦館'],
    specialties: ['戰鬥體適能', '基礎拳擊', '拳擊技巧訓練'],
    photo: howardPhoto,
    intro:
      '目前課表負責戰鬥體適能、基礎拳擊與拳擊技巧訓練，帶學員從基本動作與回合節奏建立拳擊訓練感。',
    trustPoints: [
      '敦南旗艦館課表教練',
      '負責 Fight Fit 戰鬥體適能',
      '負責基礎拳擊與拳擊技巧訓練',
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
