import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Seo } from '../components/Seo'
import { siteConfig } from '../data/landingContent'

const privacySections = [
  {
    title: '我們會收集哪些資料',
    body: '當你瀏覽本網站、點擊按鈕、加入 LINE、送出購買或預約相關資訊時，我們可能會記錄頁面瀏覽、互動事件、來源網址、匿名識別碼，以及你主動提供的聯絡或訂單資訊。',
  },
  {
    title: '我們如何使用資料',
    body: '這些資料會用於完成課程購買、客服聯繫、預約確認、網站體驗改善、廣告成效分析，以及了解不同課程頁面是否能清楚幫助使用者做決定。',
  },
  {
    title: '第三方服務',
    body: '本網站可能使用 Hotjar、Meta Pixel、LINE、SHOPLINE Payments 或其他分析、廣告、付款與客服工具。這些服務可能依各自政策處理必要的技術資料。',
  },
  {
    title: '資料保留與聯絡',
    body: '我們只會在完成服務、營運分析、法令或帳務需要的合理期間內保存資料。若你希望查詢、更新或刪除相關資料，可透過官方 LINE 與我們聯繫。',
  },
]

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-abyss text-pearl">
      <Seo
        title={`隱私政策｜${siteConfig.brandName}`}
        description="了解 UFCGYM TAIWAN Fight Night / Boot Camp 網站如何處理瀏覽、互動、LINE、付款與課程預約相關資料。"
        canonicalPath="/privacy-policy"
        keywords={['隱私政策', '個人資料保護', 'Fight Night', 'Boot Camp', 'UFCGYM TAIWAN']}
      />
      <Header />

      <main className="mx-auto max-w-4xl px-3 py-28 sm:px-8 md:py-36">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">
          PRIVACY POLICY
        </p>
        <h1 className="mt-4 font-heading text-4xl font-black leading-tight md:text-6xl">
          隱私政策
        </h1>
        <p className="mt-5 text-base leading-relaxed text-mist/76 md:text-lg">
          本政策說明 Fight Night / Boot Camp 網站如何處理你在瀏覽、購買、加入 LINE 或預約課程時產生的資料。
        </p>

        <div className="mt-8 divide-y divide-pearl/10 rounded-2xl border border-pearl/10 bg-black/32">
          {privacySections.map((section) => (
            <section key={section.title} className="p-5 md:p-7">
              <h2 className="font-heading text-xl font-black text-pearl">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-mist/74 md:text-base">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-6 text-sm leading-relaxed text-mist/55">
          最後更新：2026 年 5 月 20 日
        </p>
      </main>

      <Footer />
    </div>
  )
}
