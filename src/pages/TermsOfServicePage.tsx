import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Seo } from '../components/Seo'
import { businessInfo, siteConfig } from '../data/landingContent'

type PolicySection = {
  title: string
  body: string[]
  items?: string[]
}

const termsSections: PolicySection[] = [
  {
    title: '一、條款適用與接受',
    body: [
      '歡迎使用 UFCGYM TAIWAN 活動預約與課程報名落地頁。本頁由 UFCGYM TAIWAN 營運，用於 UFC GYM 夜間體驗、夜間入場體驗、拳擊／泰拳專項課程、免費體驗預約、線上付款與官方 LINE 報名確認。',
      '當您瀏覽本網站、提交預約資料、購買課程、完成付款、加入 LINE、使用 Meta Messenger 或使用本網站提供之任何服務時，即表示您已閱讀、了解並同意遵守本服務條款。',
      '若您不同意本條款內容，請停止使用本網站及相關服務。',
    ],
  },
  {
    title: '二、服務內容與資訊揭露',
    body: [
      '本網站提供 UFCGYM TAIWAN 單堂體驗、夜間入場體驗、拳擊／泰拳專項課程、館場資訊、免費體驗預約、付費課程購買、付款結果確認、LINE 報名確認與客服聯繫等服務。',
      '本公司將盡力維持網站資訊正確與即時；惟課程內容、場館、時段、名額、價格、優惠、教練安排與活動規則，仍以本網站、付款頁面、官方 LINE 或館場現場最新公告為準。',
    ],
  },
  {
    title: '三、預約資料與使用者義務',
    body: [
      '您於本網站提交之姓名、手機、電子信箱、館場、課程方案或付款資料，應確保真實、完整且為本人或已取得合法授權之資料。',
      '若因資料填寫錯誤、聯絡方式無效、未完成 LINE 確認或未依通知完成報到，導致無法完成預約、付款確認或參與課程，本公司得依實際情況協助處理，但不負擔因資料錯誤所衍生之損失。',
    ],
  },
  {
    title: '四、付款、金流與交易紀錄',
    body: [
      '付費課程或活動票券之付款流程可能由第三方金流或付款服務提供。您於付款頁面輸入之付款資訊，將依該金流服務之安全機制與服務條款處理。',
      '付款完成不代表報名流程已全部完成。您仍應依付款結果頁、感謝頁、官方 LINE 或 Meta Messenger 指示，完成場館、日期、時段與報到資訊確認。',
    ],
  },
  {
    title: '五、免費體驗、取消、改期與退款',
    body: [
      '免費體驗預約需於送出資料後，由專員、官方 LINE 或 Meta Messenger 協助確認可預約館場、日期與時段。',
      '付費課程之取消、改期、未到、退款條件與申請方式，請依本網站公告之退款與取消政策辦理。若課程方案頁面或訂單頁面另有特別規定，亦請一併遵守。',
    ],
  },
  {
    title: '六、健康狀況、安全與課程參與',
    body: [
      'UFC GYM 夜間體驗與拳擊／泰拳專項課程，屬 UFCGYM TAIWAN 提供之運動訓練與體驗活動。參與前，您應自行評估健康狀況、體能條件及是否適合進行相關運動。',
      '如您有心血管疾病、氣喘、懷孕、重大傷病、近期手術、醫師囑咐不宜劇烈運動或其他健康疑慮，請於預約前諮詢醫師，並於報到時主動告知現場人員。',
      '參與課程時，請遵守教練與場館人員指示，正確使用器材並尊重其他參與者。若有危害自身或他人安全之行為，本公司得拒絕或中止您的參與。',
    ],
  },
  {
    title: '七、智慧財產權與網站內容',
    body: [
      '本網站所使用之文字、圖片、影片、設計、標誌、版面、程式碼、課程介紹與其他內容，除另有標示外，均由本公司或合法權利人提供，受著作權、商標權及相關法令保護。',
      '未經本公司或權利人事前書面同意，不得擅自重製、修改、散布、公開傳輸、商業使用或以其他方式侵害相關權利。',
    ],
  },
  {
    title: '八、第三方服務與外部連結',
    body: [
      '本網站可能提供 LINE、Meta Messenger、金流服務、Google Maps、社群平台、廣告或分析工具之連結或嵌入內容。該等第三方服務之可用性、資料處理、安全性與內容，依各服務提供者之政策與條款辦理。',
      '您使用第三方服務前，應自行閱讀其服務條款與隱私政策。本公司不會要求您透過非官方指定管道提供不必要之敏感資料或付款資訊。',
    ],
  },
  {
    title: '九、個人資料保護',
    body: [
      '本公司重視您的個人資料保護。您透過本網站提供或因使用服務而產生之資料，將依本網站隱私權政策及個人資料保護相關法令處理。',
      '如您希望查詢、更正、停止利用或刪除個人資料，請依隱私權政策所載方式與本公司聯繫。',
    ],
  },
  {
    title: '十、條款修訂、準據法與聯絡方式',
    body: [
      '本公司得因服務內容、付款方式、場館營運、法令要求或網站功能調整，修訂本服務條款。更新後之條款將公告於本網站，並自公告日起生效。',
      '本條款之解釋與適用，以中華民國法律為準據法。若因本網站或本服務發生爭議，雙方應先以誠信方式協商處理。',
      `若您對本條款有任何疑問，請聯繫 ${businessInfo.serviceEmail}。`,
    ],
  },
]

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-abyss text-pearl">
      <Seo
        title={`服務條款｜${siteConfig.brandName}`}
        description="UFCGYM TAIWAN 活動預約與課程報名落地頁服務條款，說明預約、購買、付款、課程參與、第三方服務與使用者權利義務。"
        canonicalPath="/terms-of-service"
        keywords={['服務條款', 'UFC GYM 夜間體驗條款', '拳擊／泰拳專項課程條款', 'UFCGYM TAIWAN']}
      />
      <Header />

      <main className="mx-auto max-w-4xl px-3 py-28 sm:px-8 md:py-36">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">
          TERMS OF SERVICE
        </p>
        <h1 className="mt-4 font-heading text-4xl font-black leading-tight md:text-6xl">
          服務條款
        </h1>
        <p className="mt-5 text-base leading-relaxed text-mist/76 md:text-lg">
          本服務條款規範您使用 UFCGYM TAIWAN 活動預約與課程報名落地頁、預約服務、購買課程及參與活動之權利義務。
        </p>

        <section className="mt-8 rounded-2xl border border-pearl/10 bg-black/32 p-5 text-sm leading-relaxed text-mist/74 md:p-7">
          <h2 className="font-heading text-xl font-black text-pearl">
            文件與營運識別
          </h2>
          <dl className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <dt className="text-mist/45">頁面用途</dt>
              <dd className="mt-1 text-pearl">{siteConfig.sitePurpose}</dd>
            </div>
            <div>
              <dt className="text-mist/45">與 UFC GYM TAIWAN 關係</dt>
              <dd className="mt-1 text-pearl">{siteConfig.siteRelationship}</dd>
            </div>
            <div>
              <dt className="text-mist/45">營運主體</dt>
              <dd className="mt-1 text-pearl">{businessInfo.companyName}</dd>
            </div>
            <div>
              <dt className="text-mist/45">{businessInfo.registrationLabel}</dt>
              <dd className="mt-1 text-pearl">{businessInfo.registrationNumber}</dd>
            </div>
            <div>
              <dt className="text-mist/45">文件版本日期</dt>
              <dd className="mt-1 text-pearl">2026 年 6 月 16 日</dd>
            </div>
          </dl>
        </section>

        <div className="mt-8 divide-y divide-pearl/10 rounded-2xl border border-pearl/10 bg-black/32">
          {termsSections.map((section) => (
            <section key={section.title} className="p-5 md:p-7">
              <h2 className="font-heading text-xl font-black text-pearl">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-mist/74 md:text-base">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.items && (
                  <ul className="list-disc space-y-2 pl-5">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-pearl/10 bg-black/28 p-5 text-sm leading-relaxed text-mist/72 md:p-7">
          <h2 className="font-heading text-xl font-black text-pearl">
            官方聯絡資訊
          </h2>
          <p className="mt-3">
            本網站由 {businessInfo.companyName} 營運。如您對服務條款、預約或付款流程有疑問，請透過官方客服信箱聯繫。
          </p>
          <a
            href={`mailto:${businessInfo.serviceEmail}`}
            className="mt-2 inline-flex font-semibold text-neon hover:text-neon/80"
          >
            {businessInfo.serviceEmail}
          </a>
        </section>
      </main>

      <Footer />
    </div>
  )
}

