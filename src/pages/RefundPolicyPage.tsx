import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Seo } from '../components/Seo'
import { siteConfig } from '../data/landingContent'

type PolicySection = {
  title: string
  body: string[]
  items?: string[]
}

const refundPolicySections: PolicySection[] = [
  {
    title: '一、適用範圍',
    body: [
      '本政策適用於本網站所販售之 Fight Night / Boot Camp 體驗課程、訓練活動、課程票券或相關服務。',
      '本服務屬於預約制運動訓練課程，並非實體商品，因此無一般商品退貨情形；如需取消、改期或退款，請依本政策辦理。',
    ],
  },
  {
    title: '二、七日鑑賞期說明',
    body: [
      '若您是透過本網站完成線上付款，依消費者保護法相關規定，通訊交易原則上享有七日解除契約權。消費者得於接受服務後七日內，以書面通知方式解除契約。',
      '但若課程已經開始、您已實際參與課程，或已依您的預約完成服務安排，退款將依實際使用情況與本政策規範辦理。',
    ],
  },
  {
    title: '三、課程尚未使用之退款',
    body: [
      '若您完成付款後，尚未使用任何課程或服務，可於付款日起七日內提出退款申請。',
      '經確認符合退款條件後，本公司將協助辦理退款。退款金額將扣除金流平台、銀行或第三方支付實際產生之手續費後退還。',
    ],
  },
  {
    title: '四、課程已使用或活動已開始',
    body: [
      '若您已完成報到、參與課程、使用票券或活動已開始，該次課程或活動視為已提供服務，恕不接受該次費用退款。',
      '如購買多堂課程或多次票券，尚未使用之剩餘堂數，可依實際未使用堂數比例申請退費。依健身教練服務相關規範，消費者於契約期限屆滿前，原則上得終止契約；退費可依未完成服務堂數比例計算，並得依契約約定收取合理手續費，但不得逾法規上限。',
    ],
  },
  {
    title: '五、取消與改期規則',
    body: [
      '為維護課程品質與名額安排，若您無法如期參與，請依以下規範辦理：',
    ],
    items: [
      '課程開始前 24 小時以上通知，可協助改期一次。',
      '課程開始前未滿 24 小時取消，恕不退費；是否可改期，將依現場名額與實際狀況協助安排。',
      '課程當日未到，視同已使用該次課程，恕不退費。',
      '若因天災、政府公告、場館因素或不可抗力導致課程取消，本公司將主動通知並協助改期或退款。',
    ],
  },
  {
    title: '六、退款申請方式',
    body: [
      '如需申請退款，請提供以下資料，並透過官方客服或報名頁面指定聯絡方式提出：',
    ],
    items: [
      '姓名',
      '聯絡電話',
      '電子信箱',
      '訂單編號或付款證明',
      '購買方案名稱',
      '退款原因',
      '退款帳戶資訊',
    ],
  },
  {
    title: '七、退款作業時間',
    body: [
      '收到申請後，我們將於 3 至 7 個工作天內完成審核。若資料不完整，退款處理時間將以補齊資料後重新起算。',
      '退款審核通過後，實際入帳時間將依您原付款方式、銀行或第三方支付平台作業時間為準，通常約需 7 至 14 個工作天。',
    ],
  },
  {
    title: '八、特殊情況',
    body: [
      '若因傷害、疾病或其他不可歸責於消費者之重大因素，導致無法繼續參與課程，請提供相關證明文件，本公司將依實際情況協助辦理延期、轉讓、轉換課程或退款。',
    ],
  },
  {
    title: '九、政策修改',
    body: [
      '本公司保留調整本退款與取消政策之權利。若政策內容更新，將公告於本網站，並以最新公告版本為準。',
    ],
  },
]

export function RefundPolicyPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-abyss text-pearl">
      <Seo
        title={`退款與取消政策｜${siteConfig.brandName}`}
        description="了解 Fight Night / Boot Camp 課程付款後的七日退款、取消、改期與退款申請方式。"
        canonicalPath="/refund-policy"
        keywords={['退款與取消政策', 'Fight Night 退款', 'Boot Camp 退款', 'UFCGYM TAIWAN']}
      />
      <Header />

      <main className="mx-auto max-w-4xl px-3 py-28 sm:px-8 md:py-36">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">
          REFUND POLICY
        </p>
        <h1 className="mt-4 font-heading text-4xl font-black leading-tight md:text-6xl">
          退款與取消政策
        </h1>
        <p className="mt-5 text-base leading-relaxed text-mist/76 md:text-lg">
          感謝您報名 Fight Night / Boot Camp 課程活動。為保障您的權益，請於付款前詳閱以下退款與取消規範。
        </p>

        <div className="mt-8 divide-y divide-pearl/10 rounded-2xl border border-pearl/10 bg-black/32">
          {refundPolicySections.map((section) => (
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

        <p className="mt-6 text-sm leading-relaxed text-mist/55">
          最後更新：2026 年 5 月 27 日
        </p>
      </main>

      <Footer />
    </div>
  )
}
