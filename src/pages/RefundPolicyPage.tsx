import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { Seo } from '../components/Seo'
import { businessInfo, siteConfig } from '../data/landingContent'

type PolicySection = {
  title: string
  body: string[]
  items?: string[]
}

const refundPolicySections: PolicySection[] = [
  {
    title: '一、適用範圍',
    body: [
      '本退款與取消政策適用於 UFCGYM TAIWAN 活動預約與課程報名落地頁所提供之體驗預約、付費課程、活動票券、訓練服務及其相關訂單。',
      '本頁由 UFCGYM TAIWAN 營運，用於 UFC GYM 夜間體驗、夜間入場體驗、拳擊／泰拳專項課程、免費體驗預約、線上付款與官方 LINE 報名確認。',
      '本服務屬預約制運動訓練與活動服務，並非一般實體商品。若您需要取消、改期或申請退款，請依本政策及訂單頁面載明之規則辦理。',
    ],
  },
  {
    title: '二、免費體驗預約',
    body: [
      '免費體驗預約不涉及線上付款。完成預約資料提交後，請依感謝頁、官方 LINE 或 Meta Messenger 指示與專員確認館場、日期、時段及報到資訊。',
      '若您無法如期參與，請儘早透過官方 LINE、Meta Messenger 或客服信箱通知，以利釋出名額並重新安排。',
    ],
  },
  {
    title: '三、付費課程之七日解除契約',
    body: [
      '消費者透過本網站完成線上付款後，原則上得依消費者保護法等相關規定，於法定期間內提出解除契約或退款申請。',
      '如課程已經開始、您已完成報到、已實際參與課程，或本公司已依您的指定時段完成服務安排，退款將依實際使用狀態、未使用堂數及本政策規範辦理。',
    ],
  },
  {
    title: '四、尚未使用課程之退款',
    body: [
      '若您完成付款後尚未使用任何課程、未完成報到且未占用課程名額，可於付款日起七日內提出退款申請。',
      '經本公司確認符合退款條件後，將依原付款方式或雙方確認之退款方式辦理。退款金額可能扣除金流平台、銀行或第三方支付實際產生之必要手續費。',
    ],
  },
  {
    title: '五、已使用、未到與逾期取消',
    body: [
      '為維護課程品質、教練安排與名額控管，請於付款或預約前確認可參與之館場與時段。',
    ],
    items: [
      '課程開始前 24 小時以上通知，可協助改期一次；實際可預約時段仍以館場名額為準。',
      '課程開始前未滿 24 小時取消，或活動當日未到，該次課程視為已保留名額並可能不予退費。',
      '若您已完成報到、參與課程、使用票券或活動已開始，該次課程或活動視為已提供服務。',
      '若購買多堂課程或多次票券，未使用之剩餘堂數將依實際訂單、使用紀錄及相關法規計算可退金額。',
    ],
  },
  {
    title: '六、不可抗力與場館異動',
    body: [
      '如因天災、政府命令、場館安全、設備維護、教練臨時不可抗力或其他非可歸責於消費者之原因導致課程取消或異動，本公司將主動通知並協助改期、轉換課程或退款。',
    ],
  },
  {
    title: '七、退款申請資料',
    body: [
      `如需申請退款，請透過官方 LINE、Meta Messenger、訂單頁面指定聯絡方式或 ${businessInfo.serviceEmail} 提出，並提供以下資料以利核對：`,
    ],
    items: [
      '姓名與聯絡電話。',
      '電子信箱。',
      '訂單編號、付款證明或交易識別資訊。',
      '購買方案名稱、預約館場與預約日期。',
      '退款原因。',
      '退款帳戶資訊或原付款方式相關資訊。',
    ],
  },
  {
    title: '八、審核與退款作業時間',
    body: [
      '本公司收到完整退款資料後，通常於 3 至 7 個工作天內完成資格審核。若資料不完整或需進一步核對付款狀態，處理時間將自補齊資料後重新起算。',
      '退款審核通過後，實際入帳時間依原付款方式、銀行、信用卡組織或第三方支付平台作業時間為準，通常約需 7 至 14 個工作天。',
    ],
  },
  {
    title: '九、政策修訂與官方聯絡',
    body: [
      '本公司得因課程內容、付款方式、場館營運或法令要求修訂本政策。更新後之政策將公告於本網站，並以最新公告版本為準。',
      `如您對退款、取消或改期規則有疑問，請聯繫 ${businessInfo.serviceEmail}。`,
    ],
  },
]

export function RefundPolicyPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-abyss text-pearl">
      <Seo
        title={`退款與取消政策｜${siteConfig.brandName}`}
        description="UFCGYM TAIWAN 活動預約與課程報名落地頁退款與取消政策，說明免費體驗、付費課程、改期、退款申請與作業時間。"
        canonicalPath="/refund-policy"
        keywords={['退款與取消政策', 'UFC GYM 夜間體驗退款', '拳擊／泰拳專項課程退款', 'UFCGYM TAIWAN']}
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
          為保障消費者權益並維護課程名額安排，請於預約或付款前詳閱以下退款、取消與改期規範。
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

        <section className="mt-8 rounded-2xl border border-pearl/10 bg-black/28 p-5 text-sm leading-relaxed text-mist/72 md:p-7">
          <h2 className="font-heading text-xl font-black text-pearl">
            官方聯絡資訊
          </h2>
          <p className="mt-3">
            退款、取消與改期申請，請以官方客服信箱或官方 LINE 聯繫，並保留訂單與付款資料供核對。
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

