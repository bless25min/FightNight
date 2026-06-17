import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Seo } from '../components/Seo'
import { businessInfo, siteConfig } from '../data/landingContent'

type PolicySection = {
  title: string
  body: string[]
  items?: string[]
}

const privacySections: PolicySection[] = [
  {
    title: '一、政策適用範圍',
    body: [
      '本隱私權政策適用於 UFCGYM TAIWAN 活動預約與課程報名落地頁。本頁由 UFCGYM TAIWAN 營運，用於 UFC GYM 夜間體驗、夜間入場體驗、拳擊／泰拳專項課程、免費體驗預約、線上付款與官方 LINE 報名確認。',
      '本政策同時適用於您透過本網站進行瀏覽、預約、購買、加入 LINE、使用 Meta Messenger、提交表單或聯繫客服時所產生之個人資料與技術資料。',
      '若您透過本網站連結至 LINE、Meta Messenger、金流、廣告、分析或其他第三方服務，該第三方服務可能依其隱私政策與服務條款處理相關資料。',
    ],
  },
  {
    title: '二、蒐集之資料類型',
    body: [
      '為完成課程預約、付款、報名確認、客服聯繫與網站安全維護，本公司可能蒐集您主動提供或系統自動產生之必要資料。',
    ],
    items: [
      '姓名、手機、電子信箱、欲預約館場、課程方案、付款或訂單識別資訊。',
      '表單提交內容、LINE 或 Meta Messenger 聯繫紀錄、客服往來內容及報名確認狀態。',
      '瀏覽頁面、點擊行為、來源網址、UTM 參數、Cookie、裝置資訊、IP 位址、瀏覽器類型與匿名識別碼。',
    ],
  },
  {
    title: '三、資料使用目的',
    body: [
      '本公司依個人資料保護法及相關法令，於必要範圍內使用您的資料，主要目的包括：',
    ],
    items: [
      '處理課程預約、購買、付款、報到、改期、取消與退款申請。',
      '提供活動通知、報名確認、課程提醒、客服協助與場館聯繫。',
      '維護網站功能、安全性、交易紀錄、內部稽核與法令或帳務需求。',
      '分析網站使用體驗、廣告成效與不同課程頁面的互動表現，以改善服務內容。',
    ],
  },
  {
    title: '四、第三方服務與資料分享',
    body: [
      '為提供完整服務，本網站可能使用 LINE、Meta Messenger、Meta Pixel、Hotjar、SHOPLINE Payments、Cloudflare、Google Maps 或其他必要之分析、廣告、金流、客服與網站代管工具。',
      '本公司僅於完成服務、付款、客服、廣告衡量、網站安全或依法令要求之必要範圍內，將資料提供予受託處理之第三方服務商。除法令另有規定或經您同意外，本公司不會任意出售您的個人資料。',
    ],
  },
  {
    title: '五、Cookie、分析與廣告成效',
    body: [
      '本網站可能使用 Cookie 或類似技術記錄瀏覽狀態、廣告來源、轉換事件與網站互動，以協助確認廣告內容與落地頁體驗是否一致，並改善網站品質。',
      '您可透過瀏覽器設定限制或刪除 Cookie；惟部分功能可能因此無法正常運作，例如付款狀態確認、表單流程或廣告來源辨識。',
    ],
  },
  {
    title: '六、資料保存與安全',
    body: [
      '本公司會於完成服務、客服、交易紀錄、帳務、稽核或法令保存要求所需之合理期間內保存資料。',
      '本公司採取合理技術與管理措施保護資料安全；惟網際網路傳輸並非絕對安全，仍請您妥善保管個人裝置、通訊軟體與帳號資訊。',
    ],
  },
  {
    title: '七、當事人權利',
    body: [
      '您可依個人資料保護法，就您的個人資料向本公司請求查詢、閱覽、製給複製本、補充、更正、停止蒐集處理利用或刪除。',
      `如需行使上述權利，請提供可供確認身分之必要資訊，並透過官方客服或 ${businessInfo.serviceEmail} 與本公司聯繫。`,
    ],
  },
  {
    title: '八、未成年人資料',
    body: [
      '若您未滿法定成年年齡，請於法定代理人同意下使用本網站、提交預約或購買課程。本公司得於必要時要求補充法定代理人同意或聯絡資訊。',
    ],
  },
  {
    title: '九、政策修訂與聯絡方式',
    body: [
      '本公司得因服務內容、法令要求、第三方工具或營運需求修訂本政策。更新後之政策將公告於本網站，並自公告日起生效。',
      `若您對本政策或個人資料處理有任何疑問，請聯繫 ${businessInfo.serviceEmail}。`,
    ],
  },
]

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-abyss text-pearl">
      <Seo
        title={`隱私權政策｜${siteConfig.brandName}`}
        description="UFCGYM TAIWAN 活動預約與課程報名落地頁隱私權政策，說明預約、購買、LINE 確認、付款與廣告成效資料之處理方式。"
        canonicalPath="/privacy-policy"
        keywords={['隱私權政策', '個人資料保護', 'UFC GYM 夜間體驗', '拳擊／泰拳專項課程', 'UFCGYM TAIWAN']}
      />
      <Header />

      <main className="mx-auto max-w-4xl px-3 py-28 sm:px-8 md:py-36">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">
          PRIVACY POLICY
        </p>
        <h1 className="mt-4 font-heading text-4xl font-black leading-tight md:text-6xl">
          隱私權政策
        </h1>
        <p className="mt-5 text-base leading-relaxed text-mist/76 md:text-lg">
          本政策說明 UFCGYM TAIWAN 活動預約與課程報名落地頁如何蒐集、處理、利用與保護您的個人資料。
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
          {privacySections.map((section) => (
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
            若您對本政策有疑問，請透過官方客服信箱與我們聯繫。
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

