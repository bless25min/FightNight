import {
  ensureLineMessageSendsTable,
  notifyLineFreeTrialReservation,
  notifyLinePaymentSuccess,
} from '../shopline/line-notify.js'

const LINE_PUSH_ENDPOINT = 'https://api.line.me/v2/bot/message/push'
const DEFAULT_PUBLIC_ORIGIN = 'https://booking.ufcgym.com.tw'
const LINE_RECOVERY_BATCH_LIMIT = 50
const LINE_RECOVERY_TEMPLATE_VERSION = '2026-06-03-admin-story-carousel-v2'
const LINE_STORY_CARD_BLUE = '#073DAE'
const LINE_STORY_CARD_TEXT = '#253349'
const LINE_STORY_CARD_MUTED = '#65718A'
const LINE_STORY_CARD_BG = '#F7FBFF'

const LINE_RECOVERY_TEMPLATE_IDS = [
  'pending_checkout',
  'weekly_trial_invite',
  'reserved_to_first_purchase',
  'offer_viewed_unpaid',
  'course_reminder',
  'newcomer_entry',
]

const ATTENTION_STATUSES = [
  'payment_processing',
  'refund_processing',
  'session_failed',
  'payment_amount_mismatch',
  'paid_over_capacity',
  'failed',
  'cancelled',
  'expired',
]

const TRAFFIC_ACTION_EVENTS = [
  'ui_click',
  'hero_cta_click',
  'ticket_cta_click',
  'plan_cta_click',
  'line_cta_click',
  'gate_access_click',
  'ticket_schedule_gate_click',
  'ticket_schedule_preview_view',
  'offer_schedule_nav_click',
  'course_detail_open',
  'course_purchase_click',
  'shopline_checkout_submit',
  'shopline_checkout_error',
  'payment_result_line_click',
  'free_trial_line_confirm_click',
  'free_trial_line_confirm_success',
  'free_trial_line_confirm_error',
  'free_trial_line_confirm_open_chat',
  'free_trial_reservation_click',
  'free_trial_contact_submit',
  'free_trial_extension_offer_view',
  'free_trial_training_plan_bridge_click',
  'free_trial_add_on_category_select',
  'free_trial_add_on_view_click',
  'free_trial_keep_only_click',
  'free_trial_keep_only_confirm_click',
  'free_trial_reservation_submit',
  'free_trial_reservation_submit_before_checkout',
  'free_trial_reservation_error',
  'free_trial_reservation_already_exists',
  'free_trial_bootcamp_bridge_click',
  'training_plan_hero_cta_click',
  'bootcamp_hero_cta_click',
  'training_plan_expectation_click',
  'bootcamp_expectation_click',
  'training_plan_expectation_booking_click',
  'bootcamp_expectation_booking_click',
  'training_plan_route_select',
  'bootcamp_route_select',
  'training_plan_sticky_action_click',
  'bootcamp_sticky_action_click',
  'training_plan_sticky_secondary_click',
  'bootcamp_sticky_secondary_click',
  'event_more_sessions_click',
  'event_ticket_cta_click',
  'event_free_trial_cta_click',
  'first_purchase_offer_check',
  'training_plan_bridge_first_purchase_offer_check',
  'bootcamp_bridge_first_purchase_offer_check',
]

const CHECKOUT_INTENT_EVENTS = [
  'course_purchase_click',
  'event_ticket_cta_click',
  'shopline_checkout_submit',
]

const PURCHASE_CLICK_EVENTS = [
  'course_purchase_click',
  'event_ticket_cta_click',
]

const FREE_TRIAL_CLICK_EVENTS = [
  'free_trial_reservation_click',
  'event_free_trial_cta_click',
]

const LEAD_INTENT_EVENTS = [
  'gate_access_click',
  'line_cta_click',
  'payment_result_line_click',
  'free_trial_contact_submit',
  'free_trial_reservation_submit',
  'free_trial_reservation_submit_before_checkout',
]

const TRAFFIC_ACTION_EVENT_SQL = TRAFFIC_ACTION_EVENTS.map(sqlString).join(', ')
const CHECKOUT_INTENT_EVENT_SQL = CHECKOUT_INTENT_EVENTS.map(sqlString).join(', ')
const PURCHASE_CLICK_EVENT_SQL = PURCHASE_CLICK_EVENTS.map(sqlString).join(', ')
const FREE_TRIAL_CLICK_EVENT_SQL = FREE_TRIAL_CLICK_EVENTS.map(sqlString).join(', ')
const LEAD_INTENT_EVENT_SQL = LEAD_INTENT_EVENTS.map(sqlString).join(', ')
const SPLIT_TEST_ROUTE_SQL = [
  '/',
  '/training-plan',
  '/single-session-event',
  '/paid-event',
  '/single-session-intro',
  '/boot-camp',
  '/fight-night-event',
  '/fight-night-intro',
]
  .map(sqlString)
  .join(', ')

const DEFAULT_CHANGE_RELEASES = [
  {
    id: '2026-06-17-admin-version-impact',
    title: '後台版本歷程與轉換影響面板',
    category: 'ADMIN_OPS',
    scope: '/admin/changes',
    impactLevel: 'medium',
    deployedAt: '2026-06-17 06:03:00',
    changedSummary:
      '新增版本歷程頁，將每次改版對應到前後期間的使用者、Lead、AddToCart、Checkout、Purchase 與轉換率變化。',
    hypothesis:
      '讓後台不只列出改了什麼，也能看見每個版本期間客觀數據如何變化，降低只靠主觀感受判斷成效的風險。',
    primaryMetric: 'release impact visibility / conversion rate delta',
    notes: 'Historical entry reconstructed from admin version history rollout.',
  },
  {
    id: '2026-06-15-offers-consult-block',
    title: '方案後方加入其他課程諮詢區塊',
    category: 'CTA',
    scope: '/ /offers / consult CTA',
    impactLevel: 'medium',
    deployedAt: '2026-06-15 07:36:00',
    changedSummary:
      '在方案卡片後加入其他課程、服務與時間諮詢入口，補足不想直接購買或預約的使用者路徑。',
    hypothesis:
      '當三種方案都不符合當下需求時，提供清楚的諮詢入口可減少直接離站，提升 Lead 與後續人工轉換機會。',
    primaryMetric: 'Lead rate / consult CTA clicks / paid checkout continuity',
    notes: 'Reconstructed from git commit 391338a.',
  },
  {
    id: '2026-06-13-social-meta-tags',
    title: '社群分享與廣告預覽標籤補強',
    category: 'TRUST',
    scope: 'Open Graph / social meta',
    impactLevel: 'low',
    deployedAt: '2026-06-13 11:40:00',
    changedSummary:
      '補強 UFC GYM 單堂體驗頁面的社群標題、描述與預覽資訊，讓廣告或貼文點擊前後的品牌內容更一致。',
    hypothesis:
      '社群預覽與落地頁內容一致，有助於降低審查與使用者預期落差，也提升分享入口的可信度。',
    primaryMetric: 'social preview consistency / landing sessions',
    notes: 'Reconstructed from git commit 9b4eb75.',
  },
  {
    id: '2026-06-13-ticket-checkout-intent',
    title: '票卡與結帳意圖流程精修',
    category: 'CONVERSION',
    scope: 'ticket cards / checkout intent',
    impactLevel: 'high',
    deployedAt: '2026-06-13 03:40:00',
    changedSummary:
      '調整 UFC GYM 單堂體驗票卡與購買前的 checkout intent 流程，讓方案選擇、訂購資料與付款銜接更清楚。',
    hypothesis:
      '更清楚的方案卡與購買意圖紀錄，可降低結帳前流失，並讓 AddToCart 與 InitiateCheckout 更容易追蹤。',
    primaryMetric: 'AddToCart rate / checkout rate / Purchase rate',
    notes: 'Reconstructed from git commit 7efced7.',
  },
  {
    id: '2026-06-12-facebook-verification-venue-select',
    title: 'Facebook 驗證與館別選擇補強',
    category: 'TRUST',
    scope: 'verification / venue ticket selection',
    impactLevel: 'medium',
    deployedAt: '2026-06-12 15:00:00',
    changedSummary:
      '補強 Facebook 相關驗證與館別票券選擇，讓使用者在進入購買前能更明確確認場館與活動關係。',
    hypothesis:
      '館別與官方內容更明確，可提升落地頁可信度，並降低廣告審查對品牌一致性的疑慮。',
    primaryMetric: 'paid sessions / checkout start rate / venue selection clicks',
    notes: 'Reconstructed from git commit be58019.',
  },
  {
    id: '2026-06-12-liff-state-session-routes',
    title: 'LIFF state 與工作階段路由標準化',
    category: 'LINE',
    scope: 'LIFF / session / analytics routes',
    impactLevel: 'high',
    deployedAt: '2026-06-12 13:10:00',
    changedSummary:
      '整理 LIFF state URL、登入後回流路徑與分析用 route path，讓不同入口回到一致的頁面與追蹤路徑。',
    hypothesis:
      '減少登入、回流與分析路徑不一致，可降低 LINE 流程流失，也讓各頁版本成效比較更乾淨。',
    primaryMetric: 'Lead rate / canonical route attribution / LINE return completion',
    notes: 'Reconstructed from git commits a73a7a6 and c144aec.',
  },
  {
    id: '2026-06-12-layout-footer-restore',
    title: '活動頁寬版排版與頁尾恢復',
    category: 'UX',
    scope: '/single-session-event / footer',
    impactLevel: 'medium',
    deployedAt: '2026-06-12 11:22:00',
    changedSummary:
      '恢復 UFC GYM 單堂體驗活動頁較完整的寬版排版與頁尾資訊，改善桌面版閱讀與品牌信任資訊露出。',
    hypothesis:
      '桌面版有足夠頁寬展示圖片與方案，可降低內容壓縮感；頁尾資訊則補足審查與信任判斷所需訊號。',
    primaryMetric: 'desktop engagement / policy clicks / checkout rate',
    notes: 'Reconstructed from git commit c46511a.',
  },
  {
    id: '2026-06-12-event-intro-routing',
    title: '單堂體驗介紹 路由與分流關閉',
    category: 'ROUTING',
    scope: '/single-session-intro / split routing',
    impactLevel: 'medium',
    deployedAt: '2026-06-12 11:04:00',
    changedSummary:
      '新增 單堂體驗介紹 路由並調整分流策略，讓活動入口與首頁導向更可控。',
    hypothesis:
      '集中入口判斷能減少不同使用者看到內容不一致的機率，改善 Meta 審查與實際訪客體驗的一致性。',
    primaryMetric: 'canonical route sessions / route mismatch warnings',
    notes: 'Reconstructed from git commit 71891d3.',
  },
  {
    id: '2026-06-12-home-event-meta-purchase-sync',
    title: '首頁導向活動頁並同步 Meta Purchase',
    category: 'TRACKING',
    scope: 'home / event page / Meta Purchase',
    impactLevel: 'high',
    deployedAt: '2026-06-12 03:56:00',
    changedSummary:
      '讓首頁進入 UFC GYM 單堂體驗活動頁主流程，並修正付款成功後 Meta Purchase 同步路徑。',
    hypothesis:
      '首頁、付款結果與 Meta Purchase 的主流程一致，可提升事件歸因完整度並降低成交後追蹤漏失。',
    primaryMetric: 'Purchase event match / paid order attribution / event_source_url consistency',
    notes: 'Reconstructed from git commit 0498ce1.',
  },
  {
    id: '2026-06-09-coach-locale-copy',
    title: '教練資料與場館語系文案精修',
    category: 'CONTENT',
    scope: 'coach data / locale copy',
    impactLevel: 'low',
    deployedAt: '2026-06-09 07:28:00',
    changedSummary:
      '整理教練資料、館別名稱與頁面語系文字，讓活動內容與 UFC GYM Taiwan 場域資訊更一致。',
    hypothesis:
      '具體教練與場館資訊可提高真實感，降低頁面像臨時廣告頁或不明來源活動的疑慮。',
    primaryMetric: 'engaged sessions / venue clicks / checkout confidence',
    notes: 'Reconstructed from git commit 908a72d.',
  },
  {
    id: '2026-06-07-split-test-traffic-reporting',
    title: '分流流量報表與標準路由追蹤',
    category: 'ADMIN_OPS',
    scope: '/admin / canonical routes',
    impactLevel: 'medium',
    deployedAt: '2026-06-07 10:21:00',
    changedSummary:
      '新增分流流量報表與 canonical route 追蹤，讓不同入口、版本與頁面路徑能被統一比較。',
    hypothesis:
      '把路由標準化後，後台才能正確比較不同版本的使用者、互動與轉換，不會被 URL 變體稀釋。',
    primaryMetric: 'route attribution coverage / split-test sessions / conversion comparison quality',
    notes: 'Reconstructed from git commit 42679cd.',
  },
  {
    id: '2026-06-06-page-specific-liff',
    title: '不同頁面使用對應 LIFF ID',
    category: 'LINE',
    scope: 'event page / boot camp / LIFF IDs',
    impactLevel: 'high',
    deployedAt: '2026-06-06 07:32:00',
    changedSummary:
      '讓 UFC GYM 單堂體驗活動頁與 拳擊／泰拳訓練方案 頁使用各自對應的 LIFF ID，降低跨頁登入與回流混淆。',
    hypothesis:
      '頁面專屬 LIFF 設定可減少登入後回到錯頁、資料帶入錯誤或追蹤來源混淆。',
    primaryMetric: 'LINE return completion / Lead rate / session continuity',
    notes: 'Reconstructed from git commit eafdbe9.',
  },
  {
    id: '2026-06-06-event-pass-framing',
    title: '活動 Pass 定位與頁面敘事精修',
    category: 'POSITIONING',
    scope: '/single-session-event',
    impactLevel: 'medium',
    deployedAt: '2026-06-06 06:04:00',
    changedSummary:
      '調整 UFC GYM 單堂體驗落地頁，使其更像夜間入場體驗與活動 Pass，而不是一般健身課程頁。',
    hypothesis:
      '清楚的活動 Pass 定位能提高廣告到落地頁的期待一致性，也讓使用者更容易理解購買的是一次入場體驗。',
    primaryMetric: 'AddToCart rate / checkout rate / engaged sessions',
    notes: 'Reconstructed from git commit fc71c76.',
  },
  {
    id: '2026-06-04-nearby-venue-recommendations',
    title: '加入鄰近場館推薦',
    category: 'CONTENT',
    scope: '/single-session-event / venue recommendations',
    impactLevel: 'medium',
    deployedAt: '2026-06-04 15:34:00',
    changedSummary:
      '在 UFC GYM 單堂體驗活動頁加入鄰近館別推薦，讓使用者能更快確認適合自己的到場地點。',
    hypothesis:
      '如果使用者能快速找到可抵達的館場，方案點擊與預約完成率會更穩定。',
    primaryMetric: 'venue selection clicks / AddToCart rate / Lead rate',
    notes: 'Reconstructed from git commit 4917f97.',
  },
  {
    id: '2026-06-04-capi-checkout-events',
    title: 'Meta CAPI 追蹤 ID 與結帳事件補強',
    category: 'TRACKING',
    scope: 'Meta CAPI / checkout events',
    impactLevel: 'high',
    deployedAt: '2026-06-04 04:21:00',
    changedSummary:
      '補強 Meta CAPI tracking IDs 與結帳相關事件，讓前端事件、後端紀錄與廣告平台事件更能對齊。',
    hypothesis:
      'AddToCart、InitiateCheckout 與 Purchase 的事件鏈越完整，廣告學習與成效判讀越穩定。',
    primaryMetric: 'Meta event match quality / AddToCart / InitiateCheckout / Purchase',
    notes: 'Reconstructed from git commit 4e4e326.',
  },
  {
    id: '2026-06-03-free-trial-liff-fallback',
    title: '免費體驗 LIFF 門檻與首購補送',
    category: 'LINE',
    scope: 'free trial / first purchase fallback',
    impactLevel: 'medium',
    deployedAt: '2026-06-03 13:19:00',
    changedSummary:
      '調整免費體驗原本的 LIFF 門檻，並補上首購相關的 LINE 通知 fallback。',
    hypothesis:
      '確保免費體驗與首購後續通知都有可用路徑，可降低成功填單或付款後沒被承接的營運風險。',
    primaryMetric: 'Lead completion / LINE notification success / follow-up coverage',
    notes: 'Reconstructed from git commit 32c5f74.',
  },
  {
    id: '2026-06-03-admin-line-resend',
    title: '後台新增 LINE 確認通知重送',
    category: 'ADMIN_OPS',
    scope: '/admin / LINE confirmation resend',
    impactLevel: 'medium',
    deployedAt: '2026-06-03 12:58:00',
    changedSummary:
      '在後台加入 LINE 確認通知重送能力，讓營運人員能補救未成功送達或需再次提醒的訂單與預約。',
    hypothesis:
      '提供人工補送工具可降低客服跟進成本，也能避免已成交或已預約使用者漏接確認資訊。',
    primaryMetric: 'LINE resend success / unmatched paid orders / follow-up actionability',
    notes: 'Reconstructed from git commit b34bc40.',
  },
  {
    id: '2026-06-03-line-recovery-carousel',
    title: 'LINE 補救卡片改為故事輪播樣式',
    category: 'LINE',
    scope: 'LINE recovery cards',
    impactLevel: 'medium',
    deployedAt: '2026-06-03 12:34:00',
    changedSummary:
      '重做 LINE recovery cards，使補救與再互動訊息更接近故事卡片，而不是單純通知文字。',
    hypothesis:
      '更符合活動敘事的 LINE 卡片可提高回流點擊與未完成流程的補救機會。',
    primaryMetric: 'LINE recovery click rate / checkout recovery / Lead recovery',
    notes: 'Reconstructed from git commit 782960b.',
  },
  {
    id: '2026-06-03-ticket-purchase-page',
    title: '活動頁改成票券購買主流程',
    category: 'CONVERSION',
    scope: '/single-session-event / ticket purchase',
    impactLevel: 'high',
    deployedAt: '2026-06-03 08:53:00',
    changedSummary:
      '將 UFC GYM 單堂體驗活動頁重構成以票券購買為核心的流程，強化方案選擇與付款前資訊。',
    hypothesis:
      '把頁面主目標集中在購買票券，可降低使用者不知道下一步要做什麼的問題。',
    primaryMetric: 'AddToCart rate / checkout rate / Purchase rate',
    notes: 'Reconstructed from git commit fba3cc9.',
  },
  {
    id: '2026-06-03-ticket-first-flow',
    title: '票券優先的頁面流程',
    category: 'CONVERSION',
    scope: '/single-session-event / ticket-first flow',
    impactLevel: 'high',
    deployedAt: '2026-06-03 08:24:00',
    changedSummary:
      '把活動頁動線調整為先理解入場體驗、再選票券、再進入購買或預約。',
    hypothesis:
      '票券優先的資訊順序能讓使用者更快完成決策，並提高方案卡片 CTA 的點擊品質。',
    primaryMetric: 'ticket CTA clicks / AddToCart rate / checkout rate',
    notes: 'Reconstructed from git commit 3037a6c.',
  },
  {
    id: '2026-06-03-paid-experience-framing',
    title: '付費體驗定位重整',
    category: 'POSITIONING',
    scope: '/single-session-event / paid experience',
    impactLevel: 'medium',
    deployedAt: '2026-06-03 05:01:00',
    changedSummary:
      '重整 UFC GYM 單堂體驗的付費體驗文案，使其更像一晚的活動入場，而不是一般課程說明。',
    hypothesis:
      '清楚說明付費體驗本質，可提升價格接受度並降低付款前疑慮。',
    primaryMetric: 'checkout rate / Purchase rate / refund inquiry risk',
    notes: 'Reconstructed from git commit 6626bd0.',
  },
  {
    id: '2026-06-02-event-page-routing',
    title: '新增 UFC GYM 單堂體驗活動頁路由',
    category: 'ROUTING',
    scope: '/single-session-event',
    impactLevel: 'medium',
    deployedAt: '2026-06-02 08:06:00',
    changedSummary:
      '新增 UFC GYM 單堂體驗活動頁入口，將活動內容與原本頁面動線拆出成可追蹤的獨立路由。',
    hypothesis:
      '獨立活動頁能讓廣告、追蹤與後台報表更清楚分辨活動流量。',
    primaryMetric: 'route sessions / engaged sessions / route-specific conversion',
    notes: 'Reconstructed from git commit 385ab0e.',
  },
  {
    id: '2026-06-02-coach-profiles',
    title: '加入對應教練資料與照片',
    category: 'CONTENT',
    scope: 'coach profiles / instructor proof',
    impactLevel: 'medium',
    deployedAt: '2026-06-02 06:51:00',
    changedSummary:
      '新增教練介紹與照片素材，讓頁面能呈現更具體的教練與場館真實感。',
    hypothesis:
      '具體人物與教練資訊能增加信任，也讓使用者更能想像到場後的體驗。',
    primaryMetric: 'engaged sessions / scroll depth / CTA clicks',
    notes: 'Reconstructed from git commit 1752a48.',
  },
  {
    id: '2026-06-02-liff-buyer-prefill',
    title: 'LINE 使用者限定訂購資料預填',
    category: 'LINE',
    scope: 'buyer prefill / LINE identity',
    impactLevel: 'medium',
    deployedAt: '2026-06-02 06:26:00',
    changedSummary:
      '將買家資料預填限制在已確認的 LINE 使用者脈絡內，避免跨使用者資料誤帶。',
    hypothesis:
      '預填資料若只在正確身分下啟用，可兼顧表單便利與個資安全。',
    primaryMetric: 'form completion / data mismatch risk / checkout start rate',
    notes: 'Reconstructed from git commit 8d5ed22.',
  },
  {
    id: '2026-06-01-admin-funnel-dashboard',
    title: '後台流量儀表板改為漏斗階段視角',
    category: 'ADMIN_OPS',
    scope: '/admin / funnel dashboard',
    impactLevel: 'medium',
    deployedAt: '2026-06-01 06:15:00',
    changedSummary:
      '調整後台流量儀表板，以瀏覽、互動、Lead、Checkout、Paid 等漏斗階段呈現。',
    hypothesis:
      '用漏斗階段查看後台數據，能更快定位流失點與版本變更後的主要影響。',
    primaryMetric: 'funnel visibility / operational diagnosis speed',
    notes: 'Reconstructed from git commit a1dd846.',
  },
  {
    id: '2026-05-30-ticket-unlock-copy',
    title: '票券解鎖 CTA 文案調整',
    category: 'CTA',
    scope: 'ticket unlock CTA',
    impactLevel: 'low',
    deployedAt: '2026-05-30 08:31:00',
    changedSummary:
      '調整票券解鎖與預覽相關 CTA 文案，讓使用者更清楚點擊後會看到或完成什麼。',
    hypothesis:
      '降低 CTA 語意不明，可提升點擊品質並減少無效互動。',
    primaryMetric: 'CTA click quality / AddToCart rate',
    notes: 'Reconstructed from git commit 29a2460.',
  },
  {
    id: '2026-05-29-lead-deduping',
    title: 'Lead 去重與 LINE 登入事件修正',
    category: 'TRACKING',
    scope: 'Lead events / LINE login',
    impactLevel: 'high',
    deployedAt: '2026-05-29 13:20:00',
    changedSummary:
      '修正 CTA 與 LINE 登入之間的 Lead 去重邏輯，避免同一位使用者在不同步驟被重複計算。',
    hypothesis:
      'Lead 去重正確後，Meta 與後台的 Lead rate 才能反映真實成效，而不是事件重複造成的假成長。',
    primaryMetric: 'Lead dedupe quality / Lead rate / Meta event consistency',
    notes: 'Reconstructed from git commit fd3c042.',
  },
  {
    id: '2026-05-29-free-trial-admin-stats',
    title: '免費體驗預約流程與後台統計',
    category: 'CONVERSION',
    scope: 'free trial / admin stats',
    impactLevel: 'high',
    deployedAt: '2026-05-29 07:50:00',
    changedSummary:
      '新增免費體驗預約流程與後台統計，讓免費預約不只是一個 CTA，也能被營運追蹤與跟進。',
    hypothesis:
      '免費體驗若能完整寫入後台與統計，可提高名單承接能力並看出它與付費流程的差異。',
    primaryMetric: 'free trial Lead rate / admin follow-up coverage',
    notes: 'Reconstructed from git commit 4850d80.',
  },
  {
    id: '2026-05-29-first-purchase-offer',
    title: '首購優惠追蹤與價格露出',
    category: 'PRICING',
    scope: 'first purchase offer / locked course CTAs',
    impactLevel: 'medium',
    deployedAt: '2026-05-29 06:29:00',
    changedSummary:
      '新增首購優惠追蹤與方案價格露出，並在鎖定課程 CTA 中顯示首購價格資訊。',
    hypothesis:
      '價格與優惠條件越早清楚呈現，使用者越能判斷是否進入下一步，降低付款前認知落差。',
    primaryMetric: 'offer checks / AddToCart rate / checkout rate',
    notes: 'Reconstructed from git commits dd05d46, f1c259e, and ed078d2.',
  },
  {
    id: '2026-06-17-neihu-signature',
    title: '英文館名 Neihu Signature',
    category: 'CONTENT',
    scope: '/single-session-event / LINE confirmation',
    impactLevel: 'low',
    deployedAt: '2026-06-17 05:16:00',
    changedSummary:
      '將英文版 Neihu Flagship 修正為 Neihu Signature，並同步付款後 LINE 通知文字。',
    hypothesis: '降低館名不一致造成的品牌與客服誤解。',
    primaryMetric: 'venue copy consistency / checkout confirmation clarity',
    notes: 'Historical entry reconstructed from current admin handoff rollout.',
  },
  {
    id: '2026-06-17-footer-operations-designer',
    title: 'Footer 營運資訊與 Designed by',
    category: 'TRUST',
    scope: 'footer / policy links',
    impactLevel: 'low',
    deployedAt: '2026-06-17 05:13:00',
    changedSummary:
      '移除頁尾中像審查說明的頁面用途與品牌關係長文，改為正式營運資訊，並新增 Designed by 廖天佑。',
    hypothesis: '讓頁尾更像正式品牌網站，降低審查與用戶看到奇怪聲明的疑慮。',
    primaryMetric: 'footer trust clarity / policy click continuity',
    notes: 'Historical entry reconstructed from current admin handoff rollout.',
  },
  {
    id: '2026-06-17-floating-consult-icons',
    title: '浮動諮詢改為純 ICON',
    category: 'CTA',
    scope: 'public funnel / consult CTA',
    impactLevel: 'medium',
    deployedAt: '2026-06-17 05:08:00',
    changedSummary:
      '將浮動 LINE / Messenger 諮詢改為純圖示；完整諮詢文案與按鈕放回其他課程諮詢區塊。',
    hypothesis: '保留快速聯絡入口，同時降低浮動文案干擾閱讀與主要 CTA。',
    primaryMetric: 'Lead rate / consult CTA clicks / checkout continuity',
    notes: 'Historical entry reconstructed from current admin handoff rollout.',
  },
  {
    id: '2026-06-16-free-trial-web-form',
    title: '免費預約改為填寫資料後進感謝頁',
    category: 'CONVERSION',
    scope: 'free trial / payment result',
    impactLevel: 'high',
    deployedAt: '2026-06-16 10:00:00',
    changedSummary:
      '免費體驗不再要求 LIFF，改成像付費流程一樣填寫姓名、手機與 Email，送出後進入感謝頁並引導 LINE 確認報名。',
    hypothesis: '移除 LINE/LIFF 前置摩擦，提升免費體驗 Lead 完成率。',
    primaryMetric: 'free trial submit rate / Lead rate / LINE confirmation clicks',
    notes: 'Historical entry reconstructed from current admin handoff rollout.',
  },
  {
    id: '2026-06-15-domain-trust-refresh',
    title: '新網域與官方信任內容調整',
    category: 'TRUST',
    scope: 'home / offers / policies',
    impactLevel: 'high',
    deployedAt: '2026-06-15 08:00:00',
    changedSummary:
      '配合 booking.ufcgym.com.tw 與 Meta 審查疑慮，補強官方場域、政策、退款取消、商家聯絡與品牌一致性內容。',
    hypothesis: '改善廣告與落地頁一致性，降低詐騙連結誤判風險。',
    primaryMetric: 'paid sessions / Lead rate / checkout rate / policy trust path',
    notes: 'Historical entry reconstructed from current admin handoff rollout.',
  },
]

const CANONICAL_ROUTE_SQL = `
  COALESCE(
    NULLIF(canonical_route_path, ''),
    CASE
      WHEN route_path LIKE '/training-plan%' THEN '/training-plan'
      WHEN route_path LIKE '/boot-camp%' THEN '/training-plan'
      WHEN route_path LIKE '/single-session-event%' THEN '/single-session-event'
      WHEN route_path LIKE '/paid-event%' THEN '/paid-event'
      WHEN route_path LIKE '/fight-night-event%' THEN '/single-session-event'
      WHEN route_path LIKE '/single-session-intro%' THEN '/single-session-intro'
      WHEN route_path LIKE '/fight-night-intro%' THEN '/single-session-intro'
      WHEN route_path LIKE '/offers%' THEN '/offers'
      WHEN route_path LIKE '/payment/success%' THEN '/payment/success'
      WHEN route_path LIKE '/guides/%' THEN '/guides'
      WHEN route_path LIKE '/admin%' THEN '/admin'
      WHEN route_path LIKE '/privacy-policy%' THEN '/privacy-policy'
      WHEN route_path LIKE '/refund-policy%' THEN '/refund-policy'
      WHEN route_path IS NULL OR route_path = '' THEN '(unknown)'
      WHEN instr(route_path, '?') > 0 THEN substr(route_path, 1, instr(route_path, '?') - 1)
      WHEN instr(route_path, '#') > 0 THEN substr(route_path, 1, instr(route_path, '#') - 1)
      ELSE route_path
    END
  )
`

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...init.headers,
    },
  })
}

function getAdminToken(request) {
  const bearer = request.headers.get('authorization') || ''
  if (bearer.toLowerCase().startsWith('bearer ')) {
    return bearer.slice(7).trim()
  }

  return request.headers.get('x-admin-token') || ''
}

function assertAdmin(request, env) {
  if (!env.ADMIN_TOKEN) {
    return json({ error: 'Missing ADMIN_TOKEN' }, { status: 503 })
  }

  if (getAdminToken(request) !== env.ADMIN_TOKEN) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function trimText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

function getLimit(url, fallback = 50, max = 200) {
  const limit = Number(url.searchParams.get('limit') || fallback)
  if (!Number.isFinite(limit)) return fallback
  return Math.max(1, Math.min(max, Math.floor(limit)))
}

function getLookbackDays(url, fallback = 7, max = 30) {
  const days = Number(url.searchParams.get('days') || fallback)
  if (!Number.isFinite(days)) return fallback
  return Math.max(1, Math.min(max, Math.floor(days)))
}

async function safeAll(env, sql, bindings = []) {
  try {
    const statement = env.DB.prepare(sql)
    const result =
      bindings.length > 0 ? await statement.bind(...bindings).all() : await statement.all()
    return result.results || []
  } catch (error) {
    if (error instanceof Error && /no such table/i.test(error.message)) {
      return []
    }
    throw error
  }
}

async function safeFirst(env, sql, bindings = []) {
  try {
    const statement = env.DB.prepare(sql)
    return bindings.length > 0
      ? await statement.bind(...bindings).first()
      : await statement.first()
  } catch (error) {
    if (error instanceof Error && /no such table/i.test(error.message)) {
      return null
    }
    throw error
  }
}

let customerTrackingEnsurePromise = null
let adminCoreEnsurePromise = null

async function ensureCustomerTrackingTablesOnce(env) {
  if (!customerTrackingEnsurePromise) {
    customerTrackingEnsurePromise = ensureCustomerTrackingTables(env).catch((error) => {
      customerTrackingEnsurePromise = null
      throw error
    })
  }

  return customerTrackingEnsurePromise
}

async function ensureAdminCoreTablesOnce(env) {
  if (!adminCoreEnsurePromise) {
    adminCoreEnsurePromise = ensureAdminCoreTables(env).catch((error) => {
      adminCoreEnsurePromise = null
      throw error
    })
  }

  return adminCoreEnsurePromise
}

async function ensureAdminCoreTables(env) {
  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS line_customers (
        line_user_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        picture_url TEXT,
        status_message TEXT,
        email TEXT,
        email_verified INTEGER NOT NULL DEFAULT 0,
        email_updated_at TEXT,
        is_friend INTEGER NOT NULL DEFAULT 0,
        access_count INTEGER NOT NULL DEFAULT 1,
        raw_profile_json TEXT,
        first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_seen_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_line_customers_last_seen
       ON line_customers (last_seen_at)`,
    ),
  ])
  await ensureLineCustomerColumns(env)
  await ensureOrderTrackingColumns(env)
  await ensureLineRecoveryTables(env)
  await ensureLineMessageSendsTable(env)
  await ensureLineMessageSendMetadataColumns(env)
  await ensureReleaseVersionTables(env)
}

async function ensureReleaseVersionTables(env) {
  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS release_versions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT,
        scope TEXT,
        impact_level TEXT,
        deployed_at TEXT NOT NULL,
        deployment_url TEXT,
        changed_summary TEXT,
        hypothesis TEXT,
        primary_metric TEXT,
        notes TEXT,
        source TEXT NOT NULL DEFAULT 'manual',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_release_versions_deployed_at
       ON release_versions (deployed_at)`,
    ),
  ])

  await env.DB.batch(
    DEFAULT_CHANGE_RELEASES.map((release) =>
      env.DB.prepare(
        `INSERT INTO release_versions (
          id, title, category, scope, impact_level, deployed_at, deployment_url,
          changed_summary, hypothesis, primary_metric, notes, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          category = excluded.category,
          scope = excluded.scope,
          impact_level = excluded.impact_level,
          deployed_at = excluded.deployed_at,
          deployment_url = excluded.deployment_url,
          changed_summary = excluded.changed_summary,
          hypothesis = excluded.hypothesis,
          primary_metric = excluded.primary_metric,
          notes = excluded.notes,
          source = excluded.source,
          updated_at = datetime('now')
        WHERE release_versions.source = 'historical_reconstructed'`,
      ).bind(
        release.id,
        release.title,
        release.category,
        release.scope,
        release.impactLevel,
        release.deployedAt,
        release.deploymentUrl || null,
        release.changedSummary,
        release.hypothesis,
        release.primaryMetric,
        release.notes,
        'historical_reconstructed',
      ),
    ),
  )
}

async function ensureCustomerTrackingTables(env) {
  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS tracking_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        anonymous_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        event_name TEXT NOT NULL,
        event_id TEXT,
        event_value REAL,
        currency TEXT DEFAULT 'TWD',
        source_url TEXT,
        referrer TEXT,
        referrer_host TEXT,
        route_path TEXT,
        canonical_route_path TEXT,
        landing_path TEXT,
        first_landing_path TEXT,
        source_channel TEXT,
        first_source_channel TEXT,
        experiment_id TEXT,
        experiment_variant TEXT,
        first_experiment_variant TEXT,
        split_visit_id TEXT,
        split_assignment_mode TEXT,
        split_original_path TEXT,
        split_assigned_path TEXT,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        utm_content TEXT,
        utm_term TEXT,
        click_id_type TEXT,
        click_id_value TEXT,
        device_type TEXT,
        browser_name TEXT,
        os_name TEXT,
        in_app_browser TEXT,
        browser_language TEXT,
        timezone TEXT,
        visitor_type TEXT,
        session_index INTEGER,
        viewport_width INTEGER,
        viewport_height INTEGER,
        screen_width INTEGER,
        screen_height INTEGER,
        duration_ms INTEGER,
        scroll_depth INTEGER,
        max_scroll_depth INTEGER,
        interaction_count INTEGER,
        is_bounce INTEGER,
        section_id TEXT,
        cta_id TEXT,
        target_text TEXT,
        cf_country TEXT,
        cf_region TEXT,
        cf_city TEXT,
        cf_continent TEXT,
        cf_timezone TEXT,
        cf_colo TEXT,
        cf_asn INTEGER,
        cf_as_organization TEXT,
        cf_ray TEXT,
        cf_http_protocol TEXT,
        cf_tls_version TEXT,
        payload_json TEXT,
        user_agent TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ),
    env.DB.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_tracking_events_event_id
       ON tracking_events (event_id)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at
       ON tracking_events (created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_name_created
       ON tracking_events (event_name, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_anonymous
       ON tracking_events (anonymous_id, created_at)`,
    ),
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS line_customers (
        line_user_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        picture_url TEXT,
        status_message TEXT,
        email TEXT,
        email_verified INTEGER NOT NULL DEFAULT 0,
        email_updated_at TEXT,
        is_friend INTEGER NOT NULL DEFAULT 0,
        access_count INTEGER NOT NULL DEFAULT 1,
        raw_profile_json TEXT,
        first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_seen_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_line_customers_last_seen
       ON line_customers (last_seen_at)`,
    ),
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS liff_access_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        line_user_id TEXT NOT NULL,
        placement TEXT,
        source_path TEXT,
        is_friend INTEGER NOT NULL DEFAULT 0,
        raw_profile_json TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (line_user_id) REFERENCES line_customers(line_user_id)
      )`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_liff_access_events_user
       ON liff_access_events (line_user_id, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_liff_access_events_created_at
       ON liff_access_events (created_at)`,
    ),
  ])

  await ensureTrackingColumns(env)
  await ensureLineCustomerColumns(env)
  await env.DB.batch([
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_source_created
       ON tracking_events (source_channel, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_route_created
       ON tracking_events (route_path, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_canonical_route_created
       ON tracking_events (canonical_route_path, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_session_created
       ON tracking_events (session_id, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_created_session
       ON tracking_events (created_at, session_id)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_tracking_events_experiment_created
       ON tracking_events (experiment_id, experiment_variant, created_at)`,
    ),
  ])
  await ensureOrderTrackingColumns(env)
  await ensureReleaseVersionTables(env)
}

async function ensureTrackingColumns(env) {
  const columns = [
    ['landing_path', 'TEXT'],
    ['first_landing_path', 'TEXT'],
    ['referrer_host', 'TEXT'],
    ['canonical_route_path', 'TEXT'],
    ['source_channel', 'TEXT'],
    ['first_source_channel', 'TEXT'],
    ['experiment_id', 'TEXT'],
    ['experiment_variant', 'TEXT'],
    ['first_experiment_variant', 'TEXT'],
    ['split_visit_id', 'TEXT'],
    ['split_assignment_mode', 'TEXT'],
    ['split_original_path', 'TEXT'],
    ['split_assigned_path', 'TEXT'],
    ['utm_source', 'TEXT'],
    ['utm_medium', 'TEXT'],
    ['utm_campaign', 'TEXT'],
    ['utm_content', 'TEXT'],
    ['utm_term', 'TEXT'],
    ['click_id_type', 'TEXT'],
    ['click_id_value', 'TEXT'],
    ['device_type', 'TEXT'],
    ['browser_name', 'TEXT'],
    ['os_name', 'TEXT'],
    ['in_app_browser', 'TEXT'],
    ['browser_language', 'TEXT'],
    ['timezone', 'TEXT'],
    ['visitor_type', 'TEXT'],
    ['session_index', 'INTEGER'],
    ['viewport_width', 'INTEGER'],
    ['viewport_height', 'INTEGER'],
    ['screen_width', 'INTEGER'],
    ['screen_height', 'INTEGER'],
    ['duration_ms', 'INTEGER'],
    ['scroll_depth', 'INTEGER'],
    ['max_scroll_depth', 'INTEGER'],
    ['interaction_count', 'INTEGER'],
    ['is_bounce', 'INTEGER'],
    ['section_id', 'TEXT'],
    ['cta_id', 'TEXT'],
    ['target_text', 'TEXT'],
    ['cf_country', 'TEXT'],
    ['cf_region', 'TEXT'],
    ['cf_city', 'TEXT'],
    ['cf_continent', 'TEXT'],
    ['cf_timezone', 'TEXT'],
    ['cf_colo', 'TEXT'],
    ['cf_asn', 'INTEGER'],
    ['cf_as_organization', 'TEXT'],
    ['cf_ray', 'TEXT'],
    ['cf_http_protocol', 'TEXT'],
    ['cf_tls_version', 'TEXT'],
  ]

  for (const [name, type] of columns) {
    try {
      await env.DB.prepare(
        `ALTER TABLE tracking_events ADD COLUMN ${name} ${type}`,
      ).run()
    } catch (error) {
      if (!(error instanceof Error) || !/duplicate column/i.test(error.message)) {
        throw error
      }
    }
  }
}

async function ensureLineCustomerColumns(env) {
  const columns = [
    ['email', 'TEXT'],
    ['email_verified', 'INTEGER NOT NULL DEFAULT 0'],
    ['email_updated_at', 'TEXT'],
  ]

  for (const [name, type] of columns) {
    try {
      await env.DB.prepare(
        `ALTER TABLE line_customers ADD COLUMN ${name} ${type}`,
      ).run()
    } catch (error) {
      if (
        error instanceof Error &&
        (/duplicate column/i.test(error.message) || /no such table/i.test(error.message))
      ) {
        continue
      }
      throw error
    }
  }
}

async function ensureOrderTrackingColumns(env) {
  const columns = [
    ['meta_purchase_event_id', 'TEXT'],
    ['meta_purchase_sent_at', 'TEXT'],
    ['meta_capi_status', 'TEXT'],
    ['meta_capi_response_json', 'TEXT'],
    ['meta_capi_error', 'TEXT'],
    ['line_user_id', 'TEXT'],
    ['line_display_name', 'TEXT'],
    ['line_picture_url', 'TEXT'],
    ['line_email', 'TEXT'],
    ['line_email_verified', 'INTEGER'],
    ['line_is_friend', 'INTEGER'],
    ['line_context_json', 'TEXT'],
    ['line_payment_notify_status', 'TEXT'],
    ['line_payment_notify_attempted_at', 'TEXT'],
    ['line_payment_notified_at', 'TEXT'],
    ['line_payment_notify_response_json', 'TEXT'],
    ['line_payment_notify_error', 'TEXT'],
    ['original_amount_value', 'INTEGER'],
    ['discount_code', 'TEXT'],
    ['discount_label', 'TEXT'],
    ['discount_amount_value', 'INTEGER NOT NULL DEFAULT 0'],
  ]

  for (const [name, type] of columns) {
    try {
      await env.DB.prepare(
        `ALTER TABLE course_orders ADD COLUMN ${name} ${type}`,
      ).run()
    } catch (error) {
      if (
        error instanceof Error &&
        (/duplicate column/i.test(error.message) || /no such table/i.test(error.message))
      ) {
        continue
      }
      throw error
    }
  }

  try {
    await env.DB.batch([
      env.DB.prepare(
        `CREATE INDEX IF NOT EXISTS idx_course_orders_line_user_updated
         ON course_orders (line_user_id, updated_at)`,
      ),
      env.DB.prepare(
        `CREATE INDEX IF NOT EXISTS idx_course_orders_line_user_paid
         ON course_orders (line_user_id, paid_at)`,
      ),
    ])
  } catch (error) {
    if (error instanceof Error && /no such table/i.test(error.message)) {
      return
    }
    throw error
  }
}

async function ensureLineRecoveryTables(env) {
  await env.DB.batch([
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS line_recovery_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recovery_id TEXT NOT NULL UNIQUE,
        line_user_id TEXT NOT NULL,
        batch_id TEXT,
        template_id TEXT NOT NULL,
        segment TEXT,
        target_url TEXT,
        status TEXT NOT NULL DEFAULT 'sending',
        message_json TEXT,
        response_json TEXT,
        error TEXT,
        blocker_reason TEXT,
        staff_note TEXT,
        template_version TEXT,
        attempted_at TEXT NOT NULL DEFAULT (datetime('now')),
        sent_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (line_user_id) REFERENCES line_customers(line_user_id)
      )`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_line_recovery_messages_user
       ON line_recovery_messages (line_user_id, created_at)`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_line_recovery_messages_status
       ON line_recovery_messages (status, created_at)`,
    ),
    env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS line_recovery_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT NOT NULL UNIQUE,
        template_id TEXT NOT NULL,
        segment TEXT,
        selected_count INTEGER NOT NULL DEFAULT 0,
        sendable_count INTEGER NOT NULL DEFAULT 0,
        blocked_count INTEGER NOT NULL DEFAULT 0,
        sent_count INTEGER NOT NULL DEFAULT 0,
        failed_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'created',
        staff_note TEXT,
        created_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        confirmed_at TEXT,
        completed_at TEXT
      )`,
    ),
    env.DB.prepare(
      `CREATE INDEX IF NOT EXISTS idx_line_recovery_batches_created
       ON line_recovery_batches (created_at)`,
    ),
  ])

  await addColumnsIfMissing(env, 'line_recovery_messages', [
    ['batch_id', 'TEXT'],
    ['segment', 'TEXT'],
    ['blocker_reason', 'TEXT'],
    ['staff_note', 'TEXT'],
    ['template_version', 'TEXT'],
  ])
}

async function addColumnsIfMissing(env, tableName, columns) {
  for (const [name, type] of columns) {
    try {
      await env.DB.prepare(
        `ALTER TABLE ${tableName} ADD COLUMN ${name} ${type}`,
      ).run()
    } catch (error) {
      if (
        error instanceof Error &&
        (/duplicate column/i.test(error.message) || /no such table/i.test(error.message))
      ) {
        continue
      }
      throw error
    }
  }
}

async function ensureLineMessageSendMetadataColumns(env) {
  await addColumnsIfMissing(env, 'line_message_sends', [
    ['batch_id', 'TEXT'],
    ['segment', 'TEXT'],
    ['blocker_reason', 'TEXT'],
    ['staff_note', 'TEXT'],
    ['template_version', 'TEXT'],
  ])

  try {
    await env.DB.batch([
      env.DB.prepare(
        `CREATE INDEX IF NOT EXISTS idx_line_message_sends_batch
         ON line_message_sends (batch_id, created_at)`,
      ),
      env.DB.prepare(
        `CREATE INDEX IF NOT EXISTS idx_line_message_sends_segment
         ON line_message_sends (segment, created_at)`,
      ),
    ])
  } catch (error) {
    if (error instanceof Error && /no such table/i.test(error.message)) {
      return
    }
    throw error
  }
}

function normalizeOrder(row) {
  const rawRequest = parseJson(row.raw_request_json, {})
  const eventPassVariant =
    rawRequest?.eventPassVariant && typeof rawRequest.eventPassVariant === 'object'
      ? rawRequest.eventPassVariant
      : null
  const servicePreferences =
    rawRequest?.servicePreferences && typeof rawRequest.servicePreferences === 'object'
      ? rawRequest.servicePreferences
      : null

  return {
    referenceId: row.reference_id,
    status: row.status,
    shoplineSessionId: row.shopline_session_id,
    shoplineTradeOrderId: row.shopline_trade_order_id,
    courseId: row.course_id,
    courseName: row.course_name,
    category: row.category,
    venueId: row.venue_id,
    venueName: row.venue_name,
    coach: row.coach,
    coachPricingTier: row.coach_pricing_tier,
    route: row.route,
    packageSize: toNumber(row.package_size),
    quantity: toNumber(row.quantity),
    amountValue: toNumber(row.amount_value),
    currency: row.currency || 'TWD',
    buyerName: row.buyer_name,
    buyerPhone: row.buyer_phone,
    buyerEmail: row.buyer_email,
    lineUserId: row.line_user_id,
    lineDisplayName: row.line_display_name,
    linePictureUrl: row.line_picture_url,
    lineEmail: row.line_email || null,
    lineEmailVerified:
      row.line_email_verified == null ? null : Boolean(row.line_email_verified),
    lineIsFriend: row.line_is_friend == null ? null : Boolean(row.line_is_friend),
    linePaymentNotifyStatus: row.line_payment_notify_status,
    linePaymentNotifyAttemptedAt: row.line_payment_notify_attempted_at,
    linePaymentNotifiedAt: row.line_payment_notified_at,
    linePaymentNotifyError: row.line_payment_notify_error,
    eventPassVariantId: eventPassVariant?.id || null,
    eventPassVariantLabel: eventPassVariant?.label || null,
    equipmentPackage: eventPassVariant?.equipmentPackage || null,
    servicePreferences,
    sourcePath: row.source_path,
    metaPurchaseEventId: row.meta_purchase_event_id,
    metaPurchaseSentAt: row.meta_purchase_sent_at,
    metaCapiStatus: row.meta_capi_status,
    metaCapiError: row.meta_capi_error,
    sessionIds: parseJson(row.session_ids_json, []),
    seriesDates: parseJson(row.series_dates_json, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    paidAt: row.paid_at,
  }
}

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

async function listOrders(env, url) {
  const limit = getLimit(url, 60, 200)
  const status = url.searchParams.get('status')
  const query = (url.searchParams.get('q') || '').trim()
  const where = []
  const bindings = []

  if (status && status !== 'all') {
    where.push('status = ?')
    bindings.push(status)
  }

  if (query) {
    where.push(
      `(reference_id LIKE ? OR buyer_name LIKE ? OR buyer_phone LIKE ? OR buyer_email LIKE ? OR course_name LIKE ? OR line_user_id LIKE ? OR line_display_name LIKE ? OR line_email LIKE ?)`,
    )
    const like = `%${query}%`
    bindings.push(like, like, like, like, like, like, like, like)
  }

  bindings.push(limit)

  const rows = await safeAll(
    env,
    `SELECT reference_id, status, shopline_session_id, shopline_trade_order_id,
            course_id, course_name, category, venue_id, venue_name, coach,
            coach_pricing_tier, route, package_size, quantity, amount_value,
            currency, session_ids_json, series_dates_json, buyer_name,
            buyer_phone, buyer_email, line_user_id, line_display_name,
            line_picture_url, line_email, line_email_verified,
            line_is_friend, source_path, created_at, updated_at,
            paid_at, meta_purchase_event_id, meta_purchase_sent_at,
            meta_capi_status, meta_capi_error, line_payment_notify_status,
            line_payment_notify_attempted_at, line_payment_notified_at,
            line_payment_notify_error, raw_request_json
     FROM course_orders
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY datetime(COALESCE(paid_at, updated_at, created_at)) DESC
     LIMIT ?`,
    bindings,
  )

  return rows.map(normalizeOrder)
}

async function getOrder(env, referenceId) {
  const row = await safeFirst(
    env,
    `SELECT reference_id, status, shopline_session_id, shopline_trade_order_id,
            course_id, course_name, category, venue_id, venue_name, coach,
            coach_pricing_tier, route, package_size, quantity, amount_value,
            currency, session_ids_json, series_dates_json, buyer_name,
            buyer_phone, buyer_email, line_user_id, line_display_name,
            line_picture_url, line_email, line_email_verified,
            line_is_friend, source_path, created_at, updated_at,
            paid_at, meta_purchase_event_id, meta_purchase_sent_at,
            meta_capi_status, meta_capi_error, line_payment_notify_status,
            line_payment_notify_attempted_at, line_payment_notified_at,
            line_payment_notify_error, raw_request_json
     FROM course_orders
     WHERE reference_id = ?`,
    [referenceId],
  )

  return row ? normalizeOrder(row) : null
}

async function listInventory(env, url) {
  const limit = getLimit(url, 100, 300)
  const rows = await safeAll(
    env,
    `SELECT session_id, capacity, sold, updated_at,
            MAX(0, capacity - sold) AS remaining
     FROM session_inventory
     ORDER BY datetime(updated_at) DESC
     LIMIT ?`,
    [limit],
  )

  return rows.map((row) => ({
    sessionId: row.session_id,
    capacity: toNumber(row.capacity),
    sold: toNumber(row.sold),
    remaining: toNumber(row.remaining),
    updatedAt: row.updated_at,
  }))
}

async function listEvents(env, url) {
  const limit = getLimit(url, 100, 300)
  const eventName = url.searchParams.get('event')
  const where = []
  const bindings = []

  if (eventName && eventName !== 'all') {
    where.push('event_name = ?')
    bindings.push(eventName)
  }

  bindings.push(limit)

  const rows = await safeAll(
    env,
    `SELECT id, anonymous_id, session_id, event_name, event_id, event_value,
            currency, source_url, referrer, referrer_host, route_path,
            ${CANONICAL_ROUTE_SQL} AS canonical_route_path, landing_path,
            first_landing_path,
            source_channel, first_source_channel, experiment_id, experiment_variant,
            first_experiment_variant, split_visit_id, split_assignment_mode,
            split_original_path, split_assigned_path, utm_source, utm_medium,
            utm_campaign, utm_content, utm_term, click_id_type, click_id_value,
            device_type, browser_name, os_name, in_app_browser,
            browser_language, timezone, visitor_type, session_index,
            viewport_width, viewport_height,
            screen_width, screen_height, duration_ms, scroll_depth,
            max_scroll_depth, interaction_count, is_bounce, section_id,
            cta_id, target_text, cf_country, cf_region, cf_city, cf_continent,
            cf_timezone, cf_colo, cf_asn, cf_as_organization, cf_ray,
            cf_http_protocol, cf_tls_version, payload_json, user_agent, created_at
     FROM tracking_events
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY datetime(created_at) DESC
     LIMIT ?`,
    bindings,
  )

  return rows.map((row) => ({
    id: row.id,
    anonymousId: row.anonymous_id,
    sessionId: row.session_id,
    eventName: row.event_name,
    eventId: row.event_id,
    eventValue: row.event_value,
    currency: row.currency || 'TWD',
    sourceUrl: row.source_url,
    referrer: row.referrer,
    referrerHost: row.referrer_host,
    routePath: row.route_path,
    canonicalRoutePath: row.canonical_route_path,
    landingPath: row.landing_path,
    firstLandingPath: row.first_landing_path,
    sourceChannel: row.source_channel,
    firstSourceChannel: row.first_source_channel,
    experimentId: row.experiment_id,
    experimentVariant: row.experiment_variant,
    firstExperimentVariant: row.first_experiment_variant,
    splitVisitId: row.split_visit_id,
    splitAssignmentMode: row.split_assignment_mode,
    splitOriginalPath: row.split_original_path,
    splitAssignedPath: row.split_assigned_path,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    utmContent: row.utm_content,
    utmTerm: row.utm_term,
    clickIdType: row.click_id_type,
    clickIdValue: row.click_id_value,
    deviceType: row.device_type,
    browserName: row.browser_name,
    osName: row.os_name,
    inAppBrowser: row.in_app_browser,
    browserLanguage: row.browser_language,
    timezone: row.timezone,
    visitorType: row.visitor_type,
    sessionIndex: row.session_index,
    viewportWidth: row.viewport_width,
    viewportHeight: row.viewport_height,
    screenWidth: row.screen_width,
    screenHeight: row.screen_height,
    durationMs: row.duration_ms,
    scrollDepth: row.scroll_depth,
    maxScrollDepth: row.max_scroll_depth,
    interactionCount: row.interaction_count,
    isBounce: Boolean(row.is_bounce),
    sectionId: row.section_id,
    ctaId: row.cta_id,
    targetText: row.target_text,
    country: row.cf_country,
    region: row.cf_region,
    city: row.cf_city,
    continent: row.cf_continent,
    cfTimezone: row.cf_timezone,
    colo: row.cf_colo,
    cfAsn: row.cf_asn,
    cfAsOrganization: row.cf_as_organization,
    cfRay: row.cf_ray,
    cfHttpProtocol: row.cf_http_protocol,
    cfTlsVersion: row.cf_tls_version,
    payload: parseJson(row.payload_json, {}),
    userAgent: row.user_agent,
    createdAt: row.created_at,
  }))
}

function normalizeLineCustomer(row) {
  const customer = {
    ...row,
    paid_orders: toNumber(row.paid_orders),
    pending_orders: toNumber(row.pending_orders),
    free_reserved_orders: toNumber(row.free_reserved_orders),
    access_count: toNumber(row.access_count),
  }
  const suggestedTemplateId = chooseRecoveryTemplate(customer, 'auto')
  const recoverySegment = getRecoverySegment(customer)

  return {
    lineUserId: row.line_user_id,
    displayName: row.display_name,
    pictureUrl: row.picture_url,
    statusMessage: row.status_message,
    email: row.email || null,
    emailVerified: row.email_verified == null ? null : Boolean(row.email_verified),
    isFriend: Boolean(row.is_friend),
    accessCount: toNumber(row.access_count),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    totalOrders: toNumber(row.total_orders),
    paidOrders: toNumber(row.paid_orders),
    pendingOrders: toNumber(row.pending_orders),
    freeReservedOrders: toNumber(row.free_reserved_orders),
    paidRevenue: toNumber(row.paid_revenue),
    latestOrderReferenceId: row.latest_order_reference_id || null,
    latestOrderStatus: row.latest_order_status || null,
    latestOrderCourseName: row.latest_order_course_name || null,
    latestOrderAmountValue:
      row.latest_order_amount_value == null
        ? null
        : toNumber(row.latest_order_amount_value),
    latestOrderPaidAt: row.latest_order_paid_at || null,
    latestOrderCreatedAt: row.latest_order_created_at || null,
    buyerName: row.buyer_name || null,
    buyerPhone: row.buyer_phone || null,
    buyerEmail: row.buyer_email || null,
    latestOrderLineEmail: row.latest_order_line_email || null,
    latestOrderLineEmailVerified:
      row.latest_order_line_email_verified == null
        ? null
        : Boolean(row.latest_order_line_email_verified),
    latestRecoveryTemplateId: row.latest_recovery_template_id || null,
    latestRecoveryStatus: row.latest_recovery_status || null,
    latestRecoverySentAt: row.latest_recovery_sent_at || null,
    latestRecoveryAttemptedAt: row.latest_recovery_attempted_at || null,
    latestRecoveryError: row.latest_recovery_error || null,
    suggestedRecoveryTemplateId: suggestedTemplateId,
    recoverySegment,
  }
}

async function listLineCustomers(env, url) {
  const limit = getLimit(url, 80, 200)
  const compact = url.searchParams.get('compact') === '1'
  const hasOrdersTable = Boolean(
    await safeFirst(
      env,
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = 'course_orders'`,
    ),
  )

  if (!hasOrdersTable) {
    const rows = await safeAll(
      env,
      `WITH latest_recovery AS (
         SELECT line_user_id, template_id, status, sent_at, attempted_at, error,
                ROW_NUMBER() OVER (
                  PARTITION BY line_user_id
                  ORDER BY datetime(COALESCE(sent_at, attempted_at, created_at)) DESC, id DESC
                ) AS rn
         FROM line_recovery_messages
       )
       SELECT lc.line_user_id, lc.display_name, lc.picture_url, lc.status_message,
              lc.email, lc.email_verified, lc.is_friend, lc.access_count, lc.first_seen_at, lc.last_seen_at,
              0 AS total_orders, 0 AS paid_orders, 0 AS pending_orders,
              0 AS free_reserved_orders,
              0 AS paid_revenue,
              lr.template_id AS latest_recovery_template_id,
              lr.status AS latest_recovery_status,
              lr.sent_at AS latest_recovery_sent_at,
              lr.attempted_at AS latest_recovery_attempted_at,
              lr.error AS latest_recovery_error
       FROM line_customers lc
       LEFT JOIN latest_recovery lr ON lr.line_user_id = lc.line_user_id AND lr.rn = 1
       ORDER BY datetime(lc.last_seen_at) DESC
       LIMIT ?`,
      [limit],
    )

    return rows.map(normalizeLineCustomer)
  }

  if (compact) {
    if (url.searchParams.get('minimal') === '1') {
      const rows = await safeAll(
        env,
        `WITH latest_recovery AS (
           SELECT line_user_id, template_id, status, sent_at, attempted_at, error,
                  ROW_NUMBER() OVER (
                    PARTITION BY line_user_id
                    ORDER BY datetime(COALESCE(sent_at, attempted_at, created_at)) DESC, id DESC
                  ) AS rn
           FROM line_recovery_messages
         )
         SELECT lc.line_user_id, lc.display_name, lc.picture_url, lc.status_message,
                lc.email, lc.email_verified, lc.is_friend, lc.access_count, lc.first_seen_at, lc.last_seen_at,
                0 AS total_orders, 0 AS paid_orders, 0 AS pending_orders,
                0 AS free_reserved_orders,
                0 AS paid_revenue,
                lr.template_id AS latest_recovery_template_id,
                lr.status AS latest_recovery_status,
                lr.sent_at AS latest_recovery_sent_at,
                lr.attempted_at AS latest_recovery_attempted_at,
                lr.error AS latest_recovery_error
         FROM line_customers lc
         LEFT JOIN latest_recovery lr ON lr.line_user_id = lc.line_user_id AND lr.rn = 1
         ORDER BY datetime(lc.last_seen_at) DESC
         LIMIT ?`,
        [limit],
      )

      return rows.map(normalizeLineCustomer)
    }

    const rows = await safeAll(
      env,
      `WITH order_stats AS (
         SELECT line_user_id,
                COUNT(*) AS total_orders,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders,
                COALESCE(SUM(CASE WHEN status IN ('pending', 'payment_processing', 'session_failed') THEN 1 ELSE 0 END), 0) AS pending_orders,
                COALESCE(SUM(CASE WHEN status = 'free_reserved' THEN 1 ELSE 0 END), 0) AS free_reserved_orders,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_value ELSE 0 END), 0) AS paid_revenue
         FROM course_orders
         WHERE line_user_id IS NOT NULL AND line_user_id != ''
         GROUP BY line_user_id
       ),
       latest_recovery AS (
         SELECT line_user_id, template_id, status, sent_at, attempted_at, error,
                ROW_NUMBER() OVER (
                  PARTITION BY line_user_id
                  ORDER BY datetime(COALESCE(sent_at, attempted_at, created_at)) DESC, id DESC
                ) AS rn
         FROM line_recovery_messages
       )
       SELECT lc.line_user_id, lc.display_name, lc.picture_url, lc.status_message,
              lc.email, lc.email_verified, lc.is_friend, lc.access_count,
              lc.first_seen_at, lc.last_seen_at,
              COALESCE(os.total_orders, 0) AS total_orders,
              COALESCE(os.paid_orders, 0) AS paid_orders,
              COALESCE(os.pending_orders, 0) AS pending_orders,
              COALESCE(os.free_reserved_orders, 0) AS free_reserved_orders,
              COALESCE(os.paid_revenue, 0) AS paid_revenue,
              lr.template_id AS latest_recovery_template_id,
              lr.status AS latest_recovery_status,
              lr.sent_at AS latest_recovery_sent_at,
              lr.attempted_at AS latest_recovery_attempted_at,
              lr.error AS latest_recovery_error
       FROM line_customers lc
       LEFT JOIN order_stats os ON os.line_user_id = lc.line_user_id
       LEFT JOIN latest_recovery lr ON lr.line_user_id = lc.line_user_id AND lr.rn = 1
       ORDER BY datetime(lc.last_seen_at) DESC
       LIMIT ?`,
      [limit],
    )

    return rows.map(normalizeLineCustomer)
  }

  const rows = await safeAll(
    env,
    `WITH order_ranked AS (
     SELECT co.line_user_id, co.reference_id, co.status, co.course_name,
            co.amount_value, co.shopline_session_url, co.source_path,
              co.paid_at, co.created_at, co.updated_at,
              co.buyer_name, co.buyer_phone, co.buyer_email,
              co.line_email, co.line_email_verified,
              ROW_NUMBER() OVER (
                PARTITION BY co.line_user_id
                ORDER BY datetime(COALESCE(co.paid_at, co.updated_at, co.created_at)) DESC,
                         co.reference_id DESC
              ) AS rn
       FROM course_orders co
       WHERE co.line_user_id IS NOT NULL AND co.line_user_id != ''
     ),
     order_stats AS (
       SELECT line_user_id,
              COUNT(*) AS total_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders,
              COALESCE(SUM(CASE WHEN status IN ('pending', 'payment_processing', 'session_failed') THEN 1 ELSE 0 END), 0) AS pending_orders,
              COALESCE(SUM(CASE WHEN status = 'free_reserved' THEN 1 ELSE 0 END), 0) AS free_reserved_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_value ELSE 0 END), 0) AS paid_revenue
       FROM order_ranked
       GROUP BY line_user_id
     ),
     latest_recovery AS (
       SELECT line_user_id, template_id, status, sent_at, attempted_at, error,
              ROW_NUMBER() OVER (
                PARTITION BY line_user_id
                ORDER BY datetime(COALESCE(sent_at, attempted_at, created_at)) DESC, id DESC
              ) AS rn
       FROM line_recovery_messages
     )
     SELECT lc.line_user_id, lc.display_name, lc.picture_url, lc.status_message,
            lc.email, lc.email_verified, lc.is_friend, lc.access_count,
            lc.first_seen_at, lc.last_seen_at,
            COALESCE(os.total_orders, 0) AS total_orders,
            COALESCE(os.paid_orders, 0) AS paid_orders,
            COALESCE(os.pending_orders, 0) AS pending_orders,
            COALESCE(os.free_reserved_orders, 0) AS free_reserved_orders,
            COALESCE(os.paid_revenue, 0) AS paid_revenue,
            latest.reference_id AS latest_order_reference_id,
            latest.status AS latest_order_status,
            latest.course_name AS latest_order_course_name,
            latest.amount_value AS latest_order_amount_value,
            latest.paid_at AS latest_order_paid_at,
            latest.created_at AS latest_order_created_at,
            latest.buyer_name AS buyer_name,
            latest.buyer_phone AS buyer_phone,
            latest.buyer_email AS buyer_email,
            latest.line_email AS latest_order_line_email,
            latest.line_email_verified AS latest_order_line_email_verified,
            lr.template_id AS latest_recovery_template_id,
            lr.status AS latest_recovery_status,
            lr.sent_at AS latest_recovery_sent_at,
            lr.attempted_at AS latest_recovery_attempted_at,
            lr.error AS latest_recovery_error
     FROM line_customers lc
     LEFT JOIN order_stats os ON os.line_user_id = lc.line_user_id
     LEFT JOIN order_ranked latest
       ON latest.line_user_id = lc.line_user_id AND latest.rn = 1
     LEFT JOIN latest_recovery lr ON lr.line_user_id = lc.line_user_id AND lr.rn = 1
     ORDER BY datetime(lc.last_seen_at) DESC
     LIMIT ?`,
    [limit],
  )

  return rows.map(normalizeLineCustomer)
}

function normalizeLineMessage(row) {
  const message = parseJson(row.message_json, null)
  const bodyContents =
    message?.contents?.type === 'carousel'
      ? message?.contents?.contents?.[0]?.body?.contents
      : message?.contents?.body?.contents
  const title =
    bodyContents?.find?.(
      (item) => item?.type === 'text' && item?.size === 'xl',
    )?.text || null

  return {
    messageId: row.message_id,
    lineUserId: row.line_user_id || null,
    displayName: row.display_name || null,
    pictureUrl: row.picture_url || null,
    buyerName: row.buyer_name || null,
    buyerPhone: row.buyer_phone || null,
    buyerEmail: row.buyer_email || null,
    referenceId: row.reference_id || null,
    courseName: row.course_name || null,
    source: row.source,
    messageType: row.message_type,
    templateId: row.template_id || null,
    targetUrl: row.target_url || null,
    status: row.status,
    batchId: row.batch_id || null,
    segment: row.segment || null,
    staffNote: row.staff_note || null,
    templateVersion: row.template_version || null,
    title,
    altText: message?.altText || null,
    error: row.error || null,
    attemptedAt: row.attempted_at || null,
    sentAt: row.sent_at || null,
    createdAt: row.created_at || null,
  }
}

async function listLineMessages(env, url) {
  const limit = getLimit(url, 80, 200)
  const rows = await safeAll(
    env,
    `WITH order_messages AS (
       SELECT 'legacy_' || co.reference_id || '_' ||
              CASE
                WHEN co.status = 'free_reserved' THEN 'free_trial_confirmation'
                ELSE 'paid_confirmation'
              END AS message_id,
              co.line_user_id,
              COALESCE(lc.display_name, co.line_display_name) AS display_name,
              COALESCE(lc.picture_url, co.line_picture_url) AS picture_url,
              co.buyer_name,
              co.buyer_phone,
              co.buyer_email,
              co.reference_id,
              co.course_name,
              'auto' AS source,
              CASE
                WHEN co.status = 'free_reserved' THEN 'free_trial_confirmation'
                ELSE 'paid_confirmation'
              END AS message_type,
              CASE
                WHEN co.status = 'free_reserved' THEN 'free_trial_confirmation'
                ELSE 'paid_confirmation'
              END AS template_id,
              NULL AS target_url,
              co.line_payment_notify_status AS status,
              NULL AS batch_id,
              NULL AS segment,
              NULL AS staff_note,
              NULL AS template_version,
              NULL AS message_json,
              co.line_payment_notify_response_json AS response_json,
              co.line_payment_notify_error AS error,
              co.line_payment_notify_attempted_at AS attempted_at,
              co.line_payment_notified_at AS sent_at,
              co.created_at
       FROM course_orders co
       LEFT JOIN line_customers lc ON lc.line_user_id = co.line_user_id
       WHERE co.line_payment_notify_status IS NOT NULL
         AND co.status IN ('paid', 'free_reserved')
         AND NOT EXISTS (
           SELECT 1
           FROM line_message_sends existing
           WHERE existing.reference_id = co.reference_id
             AND existing.message_type = CASE
               WHEN co.status = 'free_reserved' THEN 'free_trial_confirmation'
               ELSE 'paid_confirmation'
             END
         )
     ),
     recovery_messages AS (
       SELECT lrm.recovery_id AS message_id,
              lrm.line_user_id,
              lc.display_name,
              lc.picture_url,
              NULL AS buyer_name,
              NULL AS buyer_phone,
              NULL AS buyer_email,
              NULL AS reference_id,
              NULL AS course_name,
              'admin_manual' AS source,
              'manual_recovery' AS message_type,
              lrm.template_id,
              lrm.target_url,
              lrm.status,
              lrm.batch_id,
              lrm.segment,
              lrm.staff_note,
              lrm.template_version,
              lrm.message_json,
              lrm.response_json,
              lrm.error,
              lrm.attempted_at,
              lrm.sent_at,
              lrm.created_at
       FROM line_recovery_messages lrm
       LEFT JOIN line_customers lc ON lc.line_user_id = lrm.line_user_id
       WHERE NOT EXISTS (
         SELECT 1
         FROM line_message_sends existing
         WHERE existing.message_id = lrm.recovery_id
       )
     ),
     unified_messages AS (
       SELECT lms.message_id,
              lms.line_user_id,
              COALESCE(lc.display_name, co.line_display_name) AS display_name,
              COALESCE(lc.picture_url, co.line_picture_url) AS picture_url,
              co.buyer_name,
              co.buyer_phone,
              co.buyer_email,
              lms.reference_id,
              co.course_name,
              lms.source,
              lms.message_type,
              lms.template_id,
              lms.target_url,
              lms.status,
              lms.batch_id,
              lms.segment,
              lms.staff_note,
              lms.template_version,
              lms.message_json,
              lms.response_json,
              lms.error,
              lms.attempted_at,
              lms.sent_at,
              lms.created_at
       FROM line_message_sends lms
       LEFT JOIN line_customers lc ON lc.line_user_id = lms.line_user_id
       LEFT JOIN course_orders co ON co.reference_id = lms.reference_id
       UNION ALL
       SELECT * FROM order_messages
       UNION ALL
       SELECT * FROM recovery_messages
     )
     SELECT *
     FROM unified_messages
     ORDER BY datetime(COALESCE(sent_at, attempted_at, created_at)) DESC
     LIMIT ?`,
    [limit],
  )

  return rows.map(normalizeLineMessage)
}

async function getLineCustomer(env, lineUserId) {
  const customer = await safeFirst(
    env,
    `SELECT line_user_id, display_name, picture_url, status_message,
            email, email_verified, is_friend, access_count, first_seen_at, last_seen_at
     FROM line_customers
     WHERE line_user_id = ?`,
    [lineUserId],
  )

  if (!customer) return null

  const events = await safeAll(
    env,
    `SELECT id, placement, source_path, is_friend, created_at
     FROM liff_access_events
     WHERE line_user_id = ?
     ORDER BY datetime(created_at) DESC
     LIMIT 100`,
    [lineUserId],
  )

  return {
    lineUserId: customer.line_user_id,
    displayName: customer.display_name,
    pictureUrl: customer.picture_url,
    statusMessage: customer.status_message,
    email: customer.email || null,
    emailVerified:
      customer.email_verified == null ? null : Boolean(customer.email_verified),
    isFriend: Boolean(customer.is_friend),
    accessCount: toNumber(customer.access_count),
    firstSeenAt: customer.first_seen_at,
    lastSeenAt: customer.last_seen_at,
    accessEvents: events.map((event) => ({
      id: event.id,
      placement: event.placement,
      sourcePath: event.source_path,
      isFriend: Boolean(event.is_friend),
      createdAt: event.created_at,
    })),
  }
}

async function getTraffic(env, url) {
  const lookbackDays = getLookbackDays(url, 7, 30)
  const lookbackSql = `-${lookbackDays} days`

  const [
    overviewRows,
    orderSummaryRows,
    dailyRows,
    orderDailyRows,
    sourceRows,
    campaignRows,
    pageRows,
    sectionRows,
    splitVariantRows,
    splitSectionRows,
    dropoffRows,
    exitRows,
    deviceRows,
    browserRows,
    networkRows,
    geographyRows,
    recentEventRows,
  ] = await Promise.all([
    safeAll(
      env,
      `SELECT COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN anonymous_id ELSE NULL END) AS visitors,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND COALESCE(first_source_channel, source_channel, '') = 'paid' THEN session_id ELSE NULL END) AS paid_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND click_id_type IS NOT NULL THEN session_id ELSE NULL END) AS click_id_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND (utm_source IS NOT NULL OR utm_medium IS NOT NULL OR utm_campaign IS NOT NULL) THEN session_id ELSE NULL END) AS utm_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'ticket_view' THEN session_id ELSE NULL END) AS ticket_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${FREE_TRIAL_CLICK_EVENT_SQL}) THEN session_id ELSE NULL END) AS free_trial_click_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'free_trial_reservation_submit' THEN session_id ELSE NULL END) AS free_trial_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${PURCHASE_CLICK_EVENT_SQL}) THEN session_id ELSE NULL END) AS purchase_click_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'shopline_checkout_submit' THEN session_id ELSE NULL END) AS checkout_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'scroll_depth' AND COALESCE(scroll_depth, max_scroll_depth, 0) >= 50 THEN session_id ELSE NULL END) AS scroll_50_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_exit' THEN session_id ELSE NULL END) AS exit_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_exit' AND is_bounce = 1 THEN session_id ELSE NULL END) AS bounce_sessions
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')`,
    ),
    safeAll(
      env,
      `SELECT COUNT(*) AS orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders,
              COALESCE(SUM(CASE WHEN status = 'free_reserved' THEN 1 ELSE 0 END), 0) AS free_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_value ELSE 0 END), 0) AS revenue
       FROM course_orders
       WHERE created_at >= datetime('now', '${lookbackSql}')`,
    ),
    safeAll(
      env,
      `SELECT date(datetime(created_at, '+8 hours')) AS day_tw,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND COALESCE(first_source_channel, source_channel, '') = 'paid' THEN session_id ELSE NULL END) AS paid_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND click_id_type IS NOT NULL THEN session_id ELSE NULL END) AS click_id_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND (utm_source IS NOT NULL OR utm_medium IS NOT NULL OR utm_campaign IS NOT NULL) THEN session_id ELSE NULL END) AS utm_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'ticket_view' THEN session_id ELSE NULL END) AS ticket_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${FREE_TRIAL_CLICK_EVENT_SQL}) THEN session_id ELSE NULL END) AS free_trial_click_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'free_trial_reservation_submit' THEN session_id ELSE NULL END) AS free_trial_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${PURCHASE_CLICK_EVENT_SQL}) THEN session_id ELSE NULL END) AS purchase_click_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'shopline_checkout_submit' THEN session_id ELSE NULL END) AS checkout_sessions
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY day_tw
       ORDER BY day_tw DESC`,
    ),
    safeAll(
      env,
      `SELECT date(datetime(created_at, '+8 hours')) AS day_tw,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders,
              COALESCE(SUM(CASE WHEN status = 'free_reserved' THEN 1 ELSE 0 END), 0) AS free_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_value ELSE 0 END), 0) AS revenue
       FROM course_orders
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY day_tw`,
    ),
    safeAll(
      env,
      `SELECT COALESCE(source_channel, 'direct') AS source_channel,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN anonymous_id ELSE NULL END) AS visitors,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND visitor_type = 'new' THEN session_id ELSE NULL END) AS new_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND visitor_type = 'returning' THEN session_id ELSE NULL END) AS returning_sessions,
              COALESCE(SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END), 0) AS page_views,
              COUNT(DISTINCT CASE WHEN event_name = 'ticket_view' THEN session_id ELSE NULL END) AS ticket_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${FREE_TRIAL_CLICK_EVENT_SQL}) THEN session_id ELSE NULL END) AS free_trial_click_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'free_trial_reservation_submit' THEN session_id ELSE NULL END) AS free_trial_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${PURCHASE_CLICK_EVENT_SQL}) THEN session_id ELSE NULL END) AS purchase_click_sessions,
              COALESCE(SUM(CASE WHEN event_name IN (${TRAFFIC_ACTION_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS actions,
              COALESCE(SUM(CASE WHEN event_name IN (${CHECKOUT_INTENT_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS checkout_intents,
              COALESCE(SUM(CASE WHEN event_name = 'page_exit' AND is_bounce = 1 THEN 1 ELSE 0 END), 0) AS bounces,
              COALESCE(SUM(CASE WHEN event_name = 'page_exit' THEN 1 ELSE 0 END), 0) AS exits,
              ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN duration_ms END)) AS avg_duration_ms,
              ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN max_scroll_depth END)) AS avg_scroll_depth
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY COALESCE(source_channel, 'direct')
       ORDER BY sessions DESC
       LIMIT 12`,
    ),
    safeAll(
      env,
      `SELECT COALESCE(utm_source, '(none)') AS utm_source,
              COALESCE(utm_medium, '(none)') AS utm_medium,
              COALESCE(utm_campaign, '(none)') AS utm_campaign,
              COALESCE(utm_content, '(none)') AS utm_content,
              COALESCE(utm_term, '(none)') AS utm_term,
              COALESCE(click_id_type, '') AS click_id_type,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND COALESCE(first_source_channel, source_channel, '') = 'paid' THEN session_id ELSE NULL END) AS paid_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'ticket_view' THEN session_id ELSE NULL END) AS ticket_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${FREE_TRIAL_CLICK_EVENT_SQL}) THEN session_id ELSE NULL END) AS free_trial_click_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'free_trial_reservation_submit' THEN session_id ELSE NULL END) AS free_trial_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${PURCHASE_CLICK_EVENT_SQL}) THEN session_id ELSE NULL END) AS purchase_click_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'shopline_checkout_submit' THEN session_id ELSE NULL END) AS checkout_sessions,
              COALESCE(SUM(CASE WHEN event_name IN (${CHECKOUT_INTENT_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS checkout_intents,
              COALESCE(SUM(CASE WHEN event_name IN (${TRAFFIC_ACTION_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS actions,
              MIN(datetime(created_at, '+8 hours')) AS first_seen_tw,
              MAX(datetime(created_at, '+8 hours')) AS last_seen_tw
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
         AND (
           utm_source IS NOT NULL OR utm_medium IS NOT NULL OR utm_campaign IS NOT NULL
           OR utm_content IS NOT NULL OR utm_term IS NOT NULL OR click_id_type IS NOT NULL
           OR COALESCE(first_source_channel, source_channel, '') = 'paid'
         )
       GROUP BY COALESCE(utm_source, '(none)'), COALESCE(utm_medium, '(none)'),
                COALESCE(utm_campaign, '(none)'), COALESCE(utm_content, '(none)'),
                COALESCE(utm_term, '(none)'), COALESCE(click_id_type, '')
       HAVING sessions > 0
       ORDER BY sessions DESC
       LIMIT 50`,
    ),
    safeAll(
      env,
      `SELECT ${CANONICAL_ROUTE_SQL} AS route_path,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COALESCE(SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END), 0) AS page_views,
              COUNT(DISTINCT CASE WHEN event_name = 'ticket_view' THEN session_id ELSE NULL END) AS ticket_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${FREE_TRIAL_CLICK_EVENT_SQL}) THEN session_id ELSE NULL END) AS free_trial_click_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'free_trial_reservation_submit' THEN session_id ELSE NULL END) AS free_trial_sessions,
              COALESCE(SUM(CASE WHEN event_name IN (${CHECKOUT_INTENT_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS checkout_intents,
              COALESCE(SUM(CASE WHEN event_name IN (${TRAFFIC_ACTION_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS actions,
              COALESCE(SUM(CASE WHEN event_name = 'page_exit' THEN 1 ELSE 0 END), 0) AS exits,
              COALESCE(SUM(CASE WHEN event_name = 'page_exit' AND is_bounce = 1 THEN 1 ELSE 0 END), 0) AS bounces,
              ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN duration_ms END)) AS avg_duration_ms,
              ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN max_scroll_depth END)) AS avg_scroll_depth
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY ${CANONICAL_ROUTE_SQL}
       HAVING sessions > 0 OR actions > 0
       ORDER BY sessions DESC
       LIMIT 30`,
    ),
    safeAll(
      env,
      `SELECT ${CANONICAL_ROUTE_SQL} AS route_path,
              section_id,
              COALESCE(SUM(CASE WHEN event_name = 'section_view' THEN 1 ELSE 0 END), 0) AS views,
              COUNT(DISTINCT CASE WHEN event_name = 'section_view' THEN session_id ELSE NULL END) AS sessions,
              COALESCE(SUM(CASE WHEN event_name = 'ui_click' THEN 1 ELSE 0 END), 0) AS clicks,
              ROUND(AVG(CASE WHEN event_name = 'section_engagement' THEN duration_ms END)) AS avg_duration_ms,
              MAX(created_at) AS last_at
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
         AND section_id IS NOT NULL
       GROUP BY ${CANONICAL_ROUTE_SQL}, section_id
       ORDER BY route_path ASC, views DESC, clicks DESC
       LIMIT 80`,
    ),
    safeAll(
      env,
      `SELECT COALESCE(experiment_id, '') AS experiment_id,
              COALESCE(experiment_variant, first_experiment_variant, 'unassigned') AS experiment_variant,
              COALESCE(first_experiment_variant, experiment_variant, '') AS first_experiment_variant,
              ${CANONICAL_ROUTE_SQL} AS route_path,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COALESCE(SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END), 0) AS page_views,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${FREE_TRIAL_CLICK_EVENT_SQL}) THEN session_id ELSE NULL END) AS free_trial_click_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'free_trial_reservation_submit' THEN session_id ELSE NULL END) AS free_trial_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${PURCHASE_CLICK_EVENT_SQL}) THEN session_id ELSE NULL END) AS purchase_click_sessions,
              COALESCE(SUM(CASE WHEN event_name IN (${CHECKOUT_INTENT_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS checkout_intents,
              COALESCE(SUM(CASE WHEN event_name IN (${TRAFFIC_ACTION_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS actions,
              COALESCE(SUM(CASE WHEN event_name = 'page_exit' THEN 1 ELSE 0 END), 0) AS exits,
              COALESCE(SUM(CASE WHEN event_name = 'page_exit' AND is_bounce = 1 THEN 1 ELSE 0 END), 0) AS bounces,
              ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN duration_ms END)) AS avg_duration_ms,
              ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN max_scroll_depth END)) AS avg_scroll_depth
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
         AND ${CANONICAL_ROUTE_SQL} IN (${SPLIT_TEST_ROUTE_SQL})
         AND (
           experiment_variant IS NOT NULL
           OR first_experiment_variant IS NOT NULL
           OR split_visit_id IS NOT NULL
         )
       GROUP BY COALESCE(experiment_id, ''),
                COALESCE(experiment_variant, first_experiment_variant, 'unassigned'),
                COALESCE(first_experiment_variant, experiment_variant, ''),
                ${CANONICAL_ROUTE_SQL}
       HAVING sessions > 0 OR actions > 0
       ORDER BY sessions DESC, actions DESC
       LIMIT 60`,
    ),
    safeAll(
      env,
      `SELECT COALESCE(experiment_variant, first_experiment_variant, 'unassigned') AS experiment_variant,
              COALESCE(first_experiment_variant, experiment_variant, '') AS first_experiment_variant,
              ${CANONICAL_ROUTE_SQL} AS route_path,
              section_id,
              COALESCE(SUM(CASE WHEN event_name = 'section_view' THEN 1 ELSE 0 END), 0) AS views,
              COUNT(DISTINCT CASE WHEN event_name = 'section_view' THEN session_id ELSE NULL END) AS sessions,
              COALESCE(SUM(CASE WHEN event_name = 'ui_click' THEN 1 ELSE 0 END), 0) AS clicks,
              ROUND(AVG(CASE WHEN event_name = 'section_engagement' THEN duration_ms END)) AS avg_duration_ms,
              MAX(created_at) AS last_at
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
         AND ${CANONICAL_ROUTE_SQL} IN (${SPLIT_TEST_ROUTE_SQL})
         AND section_id IS NOT NULL
         AND (
           experiment_variant IS NOT NULL
           OR first_experiment_variant IS NOT NULL
           OR split_visit_id IS NOT NULL
         )
       GROUP BY COALESCE(experiment_variant, first_experiment_variant, 'unassigned'),
                COALESCE(first_experiment_variant, experiment_variant, ''),
                ${CANONICAL_ROUTE_SQL}, section_id
       ORDER BY route_path ASC, views DESC, clicks DESC
       LIMIT 120`,
    ),
    safeAll(
      env,
      `WITH exits AS (
         SELECT session_id, ${CANONICAL_ROUTE_SQL} AS route_path,
                duration_ms, max_scroll_depth, is_bounce, created_at
         FROM tracking_events
         WHERE event_name = 'page_exit'
           AND created_at >= datetime('now', '${lookbackSql}')
       ),
       ranked_sections AS (
         SELECT session_id, section_id, created_at,
                ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY datetime(created_at) DESC, id DESC) AS rn
         FROM tracking_events
         WHERE created_at >= datetime('now', '${lookbackSql}')
           AND section_id IS NOT NULL
       )
       SELECT COALESCE(ranked_sections.section_id, exits.route_path, '(unknown)') AS last_section,
              COUNT(*) AS dropoffs,
              COALESCE(SUM(CASE WHEN exits.is_bounce = 1 THEN 1 ELSE 0 END), 0) AS bounces,
              ROUND(AVG(exits.duration_ms)) AS avg_duration_ms,
              ROUND(AVG(exits.max_scroll_depth)) AS avg_scroll_depth,
              MAX(exits.created_at) AS last_at
       FROM exits
       LEFT JOIN ranked_sections
         ON ranked_sections.session_id = exits.session_id
        AND ranked_sections.rn = 1
       GROUP BY COALESCE(ranked_sections.section_id, exits.route_path, '(unknown)')
       ORDER BY dropoffs DESC, avg_scroll_depth ASC
       LIMIT 30`,
    ),
    safeAll(
      env,
      `SELECT ${CANONICAL_ROUTE_SQL} AS route_path,
              COUNT(*) AS exits,
              COALESCE(SUM(CASE WHEN is_bounce = 1 THEN 1 ELSE 0 END), 0) AS bounces,
              ROUND(AVG(duration_ms)) AS avg_duration_ms,
              ROUND(AVG(max_scroll_depth)) AS avg_scroll_depth,
              MAX(created_at) AS last_at
       FROM tracking_events
       WHERE event_name = 'page_exit'
         AND created_at >= datetime('now', '${lookbackSql}')
       GROUP BY ${CANONICAL_ROUTE_SQL}
       ORDER BY exits DESC
       LIMIT 20`,
    ),
    safeAll(
      env,
      `SELECT COALESCE(device_type, 'unknown') AS device_type,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COALESCE(SUM(CASE WHEN event_name IN (${CHECKOUT_INTENT_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS checkout_intents,
              ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN max_scroll_depth END)) AS avg_scroll_depth
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY COALESCE(device_type, 'unknown')
       ORDER BY sessions DESC`,
    ),
    safeAll(
      env,
      `SELECT COALESCE(browser_name, 'unknown') AS browser_name,
              COALESCE(os_name, 'unknown') AS os_name,
              COALESCE(in_app_browser, '') AS in_app_browser,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COALESCE(SUM(CASE WHEN event_name IN (${CHECKOUT_INTENT_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS checkout_intents,
              ROUND(AVG(CASE WHEN event_name = 'page_exit' THEN max_scroll_depth END)) AS avg_scroll_depth
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY COALESCE(browser_name, 'unknown'), COALESCE(os_name, 'unknown'), COALESCE(in_app_browser, '')
       ORDER BY sessions DESC
       LIMIT 20`,
    ),
    safeAll(
      env,
      `SELECT COALESCE(cf_as_organization, 'unknown') AS as_organization,
              COALESCE(cf_asn, 0) AS asn,
              COALESCE(cf_colo, '') AS colo,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COALESCE(SUM(CASE WHEN event_name IN (${CHECKOUT_INTENT_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS checkout_intents
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY COALESCE(cf_as_organization, 'unknown'), COALESCE(cf_asn, 0), COALESCE(cf_colo, '')
       ORDER BY sessions DESC
       LIMIT 20`,
    ),
    safeAll(
      env,
      `SELECT COALESCE(cf_country, 'unknown') AS country,
              COALESCE(cf_region, '') AS region,
              COALESCE(cf_city, '') AS city,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN COALESCE(first_source_channel, source_channel, '') = 'paid' AND event_name = 'page_view' THEN session_id ELSE NULL END) AS paid_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COALESCE(SUM(CASE WHEN event_name IN (${CHECKOUT_INTENT_EVENT_SQL}) THEN 1 ELSE 0 END), 0) AS checkout_intents
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
       GROUP BY COALESCE(cf_country, 'unknown'), COALESCE(cf_region, ''), COALESCE(cf_city, '')
       ORDER BY sessions DESC
       LIMIT 30`,
    ),
    safeAll(
      env,
      `SELECT datetime(created_at, '+8 hours') AS created_tw,
              event_name, route_path, ${CANONICAL_ROUTE_SQL} AS canonical_route_path,
              experiment_id, experiment_variant, first_experiment_variant,
              split_visit_id, split_assignment_mode,
              section_id, cta_id, target_text,
              duration_ms, scroll_depth, max_scroll_depth,
              source_channel, utm_campaign, utm_content,
              browser_name, in_app_browser, cf_city, cf_country
       FROM tracking_events
       WHERE created_at >= datetime('now', '${lookbackSql}')
         AND (
           event_name IN (${TRAFFIC_ACTION_EVENT_SQL})
           OR event_name IN ('page_view', 'ticket_view', 'page_exit')
         )
       ORDER BY created_at DESC
       LIMIT 80`,
    ),
  ])

  const overview = overviewRows[0] || {}
  const orderSummary = orderSummaryRows[0] || {}
  const ordersByDay = new Map(orderDailyRows.map((row) => [row.day_tw, row]))

  return {
    overview: {
      sessions: toNumber(overview.sessions),
      visitors: toNumber(overview.visitors),
      paidSessions: toNumber(overview.paid_sessions),
      clickIdSessions: toNumber(overview.click_id_sessions),
      utmSessions: toNumber(overview.utm_sessions),
      ticketSessions: toNumber(overview.ticket_sessions),
      leadSessions: toNumber(overview.lead_sessions),
      freeTrialClickSessions: toNumber(overview.free_trial_click_sessions),
      freeTrialSessions: toNumber(overview.free_trial_sessions),
      purchaseClickSessions: toNumber(overview.purchase_click_sessions),
      checkoutSessions: toNumber(overview.checkout_sessions),
      scroll50Sessions: toNumber(overview.scroll_50_sessions),
      exitSessions: toNumber(overview.exit_sessions),
      bounceSessions: toNumber(overview.bounce_sessions),
      paidOrders: toNumber(orderSummary.paid_orders),
      freeOrders: toNumber(orderSummary.free_orders),
      revenue: toNumber(orderSummary.revenue),
    },
    daily: dailyRows.map((row) => {
      const orderRow = ordersByDay.get(row.day_tw) || {}
      return {
        day: row.day_tw,
        sessions: toNumber(row.sessions),
        paidSessions: toNumber(row.paid_sessions),
        clickIdSessions: toNumber(row.click_id_sessions),
        utmSessions: toNumber(row.utm_sessions),
        ticketSessions: toNumber(row.ticket_sessions),
        leadSessions: toNumber(row.lead_sessions),
        freeTrialClickSessions: toNumber(row.free_trial_click_sessions),
        freeTrialSessions: toNumber(row.free_trial_sessions),
        purchaseClickSessions: toNumber(row.purchase_click_sessions),
        checkoutSessions: toNumber(row.checkout_sessions),
        paidOrders: toNumber(orderRow.paid_orders),
        freeOrders: toNumber(orderRow.free_orders),
        revenue: toNumber(orderRow.revenue),
      }
    }),
    sources: sourceRows.map((row) => ({
      sourceChannel: row.source_channel,
      sessions: toNumber(row.sessions),
      visitors: toNumber(row.visitors),
      newSessions: toNumber(row.new_sessions),
      returningSessions: toNumber(row.returning_sessions),
      pageViews: toNumber(row.page_views),
      ticketSessions: toNumber(row.ticket_sessions),
      leadSessions: toNumber(row.lead_sessions),
      freeTrialClickSessions: toNumber(row.free_trial_click_sessions),
      freeTrialSessions: toNumber(row.free_trial_sessions),
      purchaseClickSessions: toNumber(row.purchase_click_sessions),
      actions: toNumber(row.actions),
      checkoutIntents: toNumber(row.checkout_intents),
      exits: toNumber(row.exits),
      bounces: toNumber(row.bounces),
      avgDurationMs: toNumber(row.avg_duration_ms),
      avgScrollDepth: toNumber(row.avg_scroll_depth),
    })),
    campaigns: campaignRows.map((row) => ({
      utmSource: row.utm_source,
      utmMedium: row.utm_medium,
      utmCampaign: row.utm_campaign,
      utmContent: row.utm_content,
      utmTerm: row.utm_term,
      clickIdType: row.click_id_type,
      sessions: toNumber(row.sessions),
      paidSessions: toNumber(row.paid_sessions),
      ticketSessions: toNumber(row.ticket_sessions),
      leadSessions: toNumber(row.lead_sessions),
      freeTrialClickSessions: toNumber(row.free_trial_click_sessions),
      freeTrialSessions: toNumber(row.free_trial_sessions),
      purchaseClickSessions: toNumber(row.purchase_click_sessions),
      checkoutSessions: toNumber(row.checkout_sessions),
      actions: toNumber(row.actions),
      checkoutIntents: toNumber(row.checkout_intents),
      firstSeenAt: row.first_seen_tw,
      lastSeenAt: row.last_seen_tw,
    })),
    pages: pageRows.map((row) => ({
      routePath: row.route_path,
      sessions: toNumber(row.sessions),
      pageViews: toNumber(row.page_views),
      ticketSessions: toNumber(row.ticket_sessions),
      leadSessions: toNumber(row.lead_sessions),
      freeTrialClickSessions: toNumber(row.free_trial_click_sessions),
      freeTrialSessions: toNumber(row.free_trial_sessions),
      actions: toNumber(row.actions),
      checkoutIntents: toNumber(row.checkout_intents),
      exits: toNumber(row.exits),
      bounces: toNumber(row.bounces),
      avgDurationMs: toNumber(row.avg_duration_ms),
      avgScrollDepth: toNumber(row.avg_scroll_depth),
    })),
    sections: sectionRows.map((row) => ({
      routePath: row.route_path,
      sectionId: row.section_id,
      views: toNumber(row.views),
      sessions: toNumber(row.sessions),
      clicks: toNumber(row.clicks),
      avgDurationMs: toNumber(row.avg_duration_ms),
      lastAt: row.last_at,
    })),
    splitVariants: splitVariantRows.map((row) => ({
      experimentId: row.experiment_id,
      experimentVariant: row.experiment_variant,
      firstExperimentVariant: row.first_experiment_variant,
      routePath: row.route_path,
      sessions: toNumber(row.sessions),
      pageViews: toNumber(row.page_views),
      leadSessions: toNumber(row.lead_sessions),
      freeTrialClickSessions: toNumber(row.free_trial_click_sessions),
      freeTrialSessions: toNumber(row.free_trial_sessions),
      purchaseClickSessions: toNumber(row.purchase_click_sessions),
      actions: toNumber(row.actions),
      checkoutIntents: toNumber(row.checkout_intents),
      exits: toNumber(row.exits),
      bounces: toNumber(row.bounces),
      avgDurationMs: toNumber(row.avg_duration_ms),
      avgScrollDepth: toNumber(row.avg_scroll_depth),
    })),
    splitSections: splitSectionRows.map((row) => ({
      experimentVariant: row.experiment_variant,
      firstExperimentVariant: row.first_experiment_variant,
      routePath: row.route_path,
      sectionId: row.section_id,
      views: toNumber(row.views),
      sessions: toNumber(row.sessions),
      clicks: toNumber(row.clicks),
      avgDurationMs: toNumber(row.avg_duration_ms),
      lastAt: row.last_at,
    })),
    dropoffs: dropoffRows.map((row) => ({
      lastSection: row.last_section,
      dropoffs: toNumber(row.dropoffs),
      bounces: toNumber(row.bounces),
      avgDurationMs: toNumber(row.avg_duration_ms),
      avgScrollDepth: toNumber(row.avg_scroll_depth),
      lastAt: row.last_at,
    })),
    exits: exitRows.map((row) => ({
      routePath: row.route_path,
      exits: toNumber(row.exits),
      bounces: toNumber(row.bounces),
      avgDurationMs: toNumber(row.avg_duration_ms),
      avgScrollDepth: toNumber(row.avg_scroll_depth),
      lastAt: row.last_at,
    })),
    devices: deviceRows.map((row) => ({
      deviceType: row.device_type,
      sessions: toNumber(row.sessions),
      leadSessions: toNumber(row.lead_sessions),
      checkoutIntents: toNumber(row.checkout_intents),
      avgScrollDepth: toNumber(row.avg_scroll_depth),
    })),
    browsers: browserRows.map((row) => ({
      browserName: row.browser_name,
      osName: row.os_name,
      inAppBrowser: row.in_app_browser,
      sessions: toNumber(row.sessions),
      leadSessions: toNumber(row.lead_sessions),
      checkoutIntents: toNumber(row.checkout_intents),
      avgScrollDepth: toNumber(row.avg_scroll_depth),
    })),
    networks: networkRows.map((row) => ({
      asOrganization: row.as_organization,
      asn: toNumber(row.asn),
      colo: row.colo,
      sessions: toNumber(row.sessions),
      leadSessions: toNumber(row.lead_sessions),
      checkoutIntents: toNumber(row.checkout_intents),
    })),
    geography: geographyRows.map((row) => ({
      country: row.country,
      region: row.region,
      city: row.city,
      sessions: toNumber(row.sessions),
      paidSessions: toNumber(row.paid_sessions),
      leadSessions: toNumber(row.lead_sessions),
      checkoutIntents: toNumber(row.checkout_intents),
    })),
    recentEvents: recentEventRows.map((row) => ({
      createdAt: row.created_tw,
      eventName: row.event_name,
      routePath: row.route_path,
      canonicalRoutePath: row.canonical_route_path,
      experimentId: row.experiment_id,
      experimentVariant: row.experiment_variant,
      firstExperimentVariant: row.first_experiment_variant,
      splitVisitId: row.split_visit_id,
      splitAssignmentMode: row.split_assignment_mode,
      sectionId: row.section_id,
      ctaId: row.cta_id,
      targetText: row.target_text,
      durationMs: toNumber(row.duration_ms),
      scrollDepth: toNumber(row.scroll_depth),
      maxScrollDepth: toNumber(row.max_scroll_depth),
      sourceChannel: row.source_channel,
      utmCampaign: row.utm_campaign,
      utmContent: row.utm_content,
      browserName: row.browser_name,
      inAppBrowser: row.in_app_browser,
      city: row.cf_city,
      country: row.cf_country,
    })),
  }
}

function parseSqlDate(value) {
  const raw = trimText(value, 40)
  if (!raw) return new Date(0)
  return new Date(`${raw.replace(' ', 'T').replace(/\.\d+$/, '')}Z`)
}

function toSqlDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function hoursBetween(startAt, endAt) {
  const start = parseSqlDate(startAt)
  const end = parseSqlDate(endAt)
  const hours = (end.getTime() - start.getTime()) / (60 * 60 * 1000)
  return Number.isFinite(hours) ? Math.max(0, hours) : 0
}

function rate(numerator, denominator) {
  const total = Number(denominator || 0)
  if (total <= 0) return 0
  return (Number(numerator || 0) / total) * 100
}

function percentageChange(after, before) {
  const beforeValue = Number(before || 0)
  const afterValue = Number(after || 0)
  if (beforeValue <= 0) return afterValue > 0 ? null : 0
  return ((afterValue - beforeValue) / beforeValue) * 100
}

function roundMetric(value, digits = 2) {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return 0
  return Number(number.toFixed(digits))
}

function normalizePeriodMetrics(eventMetrics, orderMetrics, startAt, endAt) {
  const users = toNumber(eventMetrics.users)
  const sessions = toNumber(eventMetrics.sessions)
  const leads = toNumber(eventMetrics.lead_sessions)
  const addToCart = toNumber(eventMetrics.add_to_cart_sessions)
  const checkout = toNumber(eventMetrics.checkout_sessions)
  const freeTrials = toNumber(eventMetrics.free_trial_sessions)
  const paidOrders = toNumber(orderMetrics.paid_orders)
  const revenue = toNumber(orderMetrics.revenue)
  const durationHours = hoursBetween(startAt, endAt)
  const durationDays = durationHours / 24

  return {
    startAt,
    endAt,
    durationHours: roundMetric(durationHours, 1),
    durationDays: roundMetric(durationDays, 2),
    users,
    sessions,
    paidSessions: toNumber(eventMetrics.paid_sessions),
    clickIdSessions: toNumber(eventMetrics.click_id_sessions),
    mobileSessions: toNumber(eventMetrics.mobile_sessions),
    desktopSessions: toNumber(eventMetrics.desktop_sessions),
    leads,
    addToCart,
    checkout,
    freeTrials,
    orders: toNumber(orderMetrics.orders),
    paidOrders,
    freeOrders: toNumber(orderMetrics.free_orders),
    revenue,
    leadRate: roundMetric(rate(leads, users), 2),
    addToCartRate: roundMetric(rate(addToCart, users), 2),
    checkoutRate: roundMetric(rate(checkout, users), 2),
    purchaseRate: roundMetric(rate(paidOrders, users), 2),
    checkoutToPaidRate: roundMetric(rate(paidOrders, checkout), 2),
    revenuePerUser: roundMetric(users > 0 ? revenue / users : 0, 2),
    usersPerDay: roundMetric(durationDays > 0 ? users / durationDays : 0, 2),
  }
}

function buildChangeDelta(before, after) {
  return {
    users: after.users - before.users,
    usersPct: percentageChange(after.users, before.users),
    sessions: after.sessions - before.sessions,
    sessionsPct: percentageChange(after.sessions, before.sessions),
    paidSessions: after.paidSessions - before.paidSessions,
    paidSessionsPct: percentageChange(after.paidSessions, before.paidSessions),
    leads: after.leads - before.leads,
    leadsPct: percentageChange(after.leads, before.leads),
    leadRatePp: roundMetric(after.leadRate - before.leadRate, 2),
    addToCartRatePp: roundMetric(after.addToCartRate - before.addToCartRate, 2),
    checkoutRatePp: roundMetric(after.checkoutRate - before.checkoutRate, 2),
    purchaseRatePp: roundMetric(after.purchaseRate - before.purchaseRate, 2),
    checkoutToPaidRatePp: roundMetric(
      after.checkoutToPaidRate - before.checkoutToPaidRate,
      2,
    ),
    paidOrders: after.paidOrders - before.paidOrders,
    freeTrials: after.freeTrials - before.freeTrials,
    revenue: after.revenue - before.revenue,
    revenuePct: percentageChange(after.revenue, before.revenue),
    revenuePerUser: roundMetric(after.revenuePerUser - before.revenuePerUser, 2),
    usersPerDay: roundMetric(after.usersPerDay - before.usersPerDay, 2),
  }
}

async function getPeriodMetrics(env, startAt, endAt) {
  const eventMetrics =
    (await safeFirst(
      env,
      `SELECT COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN anonymous_id ELSE NULL END) AS users,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN session_id ELSE NULL END) AS sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND COALESCE(first_source_channel, source_channel, '') = 'paid' THEN session_id ELSE NULL END) AS paid_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND click_id_type IS NOT NULL THEN session_id ELSE NULL END) AS click_id_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND device_type = 'mobile' THEN session_id ELSE NULL END) AS mobile_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'page_view' AND device_type = 'desktop' THEN session_id ELSE NULL END) AS desktop_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${LEAD_INTENT_EVENT_SQL}) THEN session_id ELSE NULL END) AS lead_sessions,
              COUNT(DISTINCT CASE WHEN event_name IN (${PURCHASE_CLICK_EVENT_SQL}) THEN session_id ELSE NULL END) AS add_to_cart_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'shopline_checkout_submit' THEN session_id ELSE NULL END) AS checkout_sessions,
              COUNT(DISTINCT CASE WHEN event_name = 'free_trial_reservation_submit' THEN session_id ELSE NULL END) AS free_trial_sessions
       FROM tracking_events
       WHERE created_at >= ? AND created_at < ?`,
      [startAt, endAt],
    )) || {}

  const orderMetrics =
    (await safeFirst(
      env,
      `SELECT COUNT(*) AS orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders,
              COALESCE(SUM(CASE WHEN status = 'free_reserved' THEN 1 ELSE 0 END), 0) AS free_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_value ELSE 0 END), 0) AS revenue
       FROM course_orders
       WHERE created_at >= ? AND created_at < ?`,
      [startAt, endAt],
    )) || {}

  return normalizePeriodMetrics(eventMetrics, orderMetrics, startAt, endAt)
}

function buildChangeWarnings(change, isLatest) {
  const warnings = []
  if (isLatest) {
    warnings.push(
      'After 期間尚未完整，請優先看轉換率、每日平均與漏斗步驟差異，不要只看總量。',
    )
  }
  if (change.after.durationHours < 24) {
    warnings.push('After 觀察期低於 24 小時，樣本容易受時段影響。')
  }
  if (change.after.users < 50) {
    warnings.push('After users 少於 50，轉換率變化只能當方向訊號。')
  }
  if (Math.abs(change.delta.paidSessionsPct || 0) >= 50) {
    warnings.push('Paid traffic 結構變化明顯，不能把所有差異直接歸因於頁面改版。')
  }
  return warnings
}

async function getChanges(env, url) {
  const days = getLookbackDays(url, 30, 90)
  const nowAt = toSqlDate(new Date())
  const releaseRows = await safeAll(
    env,
    `SELECT id, title, category, scope, impact_level, deployed_at, deployment_url,
            changed_summary, hypothesis, primary_metric, notes, source
     FROM release_versions
     WHERE deployed_at >= datetime('now', ?)
     ORDER BY deployed_at ASC`,
    [`-${days + 14} days`],
  )

  const visibleCutoff = addHours(new Date(), -days * 24)
  const changes = []

  for (let index = 0; index < releaseRows.length; index += 1) {
    const release = releaseRows[index]
    const deployedAt = release.deployed_at
    const deployedDate = parseSqlDate(deployedAt)
    const nextRelease = releaseRows[index + 1]
    const previousRelease = releaseRows[index - 1]
    const afterStart = deployedAt
    const afterEnd = nextRelease?.deployed_at || nowAt
    const beforeEnd = deployedAt
    const beforeStart = previousRelease
      ? previousRelease.deployed_at
      : toSqlDate(addHours(deployedDate, -24 * 7))

    if (deployedDate < visibleCutoff && !nextRelease) continue
    if (deployedDate < visibleCutoff && parseSqlDate(afterEnd) < visibleCutoff) continue

    const [before, after] = await Promise.all([
      getPeriodMetrics(env, beforeStart, beforeEnd),
      getPeriodMetrics(env, afterStart, afterEnd),
    ])
    const delta = buildChangeDelta(before, after)
    const change = {
      id: release.id,
      title: release.title,
      category: release.category,
      scope: release.scope,
      impactLevel: release.impact_level,
      deployedAt,
      deployedAtTw: release.deployed_at
        ? toSqlDate(addHours(parseSqlDate(release.deployed_at), 8))
        : '',
      deploymentUrl: release.deployment_url,
      changedSummary: release.changed_summary,
      hypothesis: release.hypothesis,
      primaryMetric: release.primary_metric,
      notes: release.notes,
      source: release.source,
      before,
      after,
      delta,
      isLatest: !nextRelease,
    }
    changes.push({
      ...change,
      warnings: buildChangeWarnings(change, !nextRelease),
    })
  }

  const visibleChanges = changes
    .filter((change) => parseSqlDate(change.deployedAt) >= visibleCutoff || change.isLatest)
    .sort((a, b) => parseSqlDate(b.deployedAt).getTime() - parseSqlDate(a.deployedAt).getTime())

  return {
    days,
    generatedAt: nowAt,
    changes: visibleChanges,
    overview: {
      totalChanges: visibleChanges.length,
      latestChangeId: visibleChanges[0]?.id || null,
      latestChangeTitle: visibleChanges[0]?.title || null,
    },
  }
}

async function listJourneys(env, url) {
  const limit = getLimit(url, 30, 80)
  const lookbackDays = getLookbackDays(url, 7, 30)
  const lookbackSql = `-${lookbackDays} days`
  const sessions = await safeAll(
    env,
    `SELECT session_id,
            MIN(anonymous_id) AS anonymous_id,
            MIN(created_at) AS started_at,
            MAX(created_at) AS last_at,
            COALESCE(MAX(source_channel), 'direct') AS source_channel,
            COALESCE(MAX(landing_path), '') AS landing_path,
            COALESCE(MAX(first_landing_path), '') AS first_landing_path,
            COALESCE(MAX(experiment_id), '') AS experiment_id,
            COALESCE(MAX(experiment_variant), '') AS experiment_variant,
            COALESCE(MAX(first_experiment_variant), '') AS first_experiment_variant,
            COALESCE(MAX(split_visit_id), '') AS split_visit_id,
            COALESCE(MAX(device_type), 'unknown') AS device_type,
            COALESCE(MAX(browser_name), 'unknown') AS browser_name,
            COALESCE(MAX(os_name), 'unknown') AS os_name,
            COALESCE(MAX(in_app_browser), '') AS in_app_browser,
            COALESCE(MAX(visitor_type), '') AS visitor_type,
            MAX(session_index) AS session_index,
            COALESCE(MAX(cf_country), '') AS country,
            COALESCE(MAX(cf_region), '') AS region,
            COALESCE(MAX(cf_city), '') AS city,
            COALESCE(MAX(cf_as_organization), '') AS as_organization,
            MAX(cf_asn) AS asn,
            COALESCE(MAX(cf_colo), '') AS colo,
            MAX(max_scroll_depth) AS max_scroll_depth,
            MAX(duration_ms) AS duration_ms,
            COUNT(*) AS event_count
     FROM tracking_events
     WHERE created_at >= datetime('now', '${lookbackSql}')
     GROUP BY session_id
     ORDER BY datetime(MAX(created_at)) DESC
     LIMIT ?`,
    [limit],
  )

  if (sessions.length === 0) return []

  const ids = sessions.map((session) => session.session_id)
  const placeholders = ids.map(() => '?').join(',')
  const events = await safeAll(
    env,
    `SELECT session_id, event_name, route_path, ${CANONICAL_ROUTE_SQL} AS canonical_route_path,
            experiment_id, experiment_variant, first_experiment_variant, split_visit_id,
            section_id, cta_id, target_text,
            scroll_depth, max_scroll_depth, duration_ms, is_bounce,
            source_channel, utm_source, utm_medium, utm_campaign, click_id_type,
            created_at
     FROM tracking_events
     WHERE session_id IN (${placeholders})
     ORDER BY datetime(created_at) ASC, id ASC`,
    ids,
  )
  const eventsBySession = new Map()

  for (const event of events) {
    const list = eventsBySession.get(event.session_id) || []
    list.push({
      eventName: event.event_name,
      routePath: event.route_path,
      canonicalRoutePath: event.canonical_route_path,
      experimentId: event.experiment_id,
      experimentVariant: event.experiment_variant,
      firstExperimentVariant: event.first_experiment_variant,
      splitVisitId: event.split_visit_id,
      sectionId: event.section_id,
      ctaId: event.cta_id,
      targetText: event.target_text,
      scrollDepth: event.scroll_depth,
      maxScrollDepth: event.max_scroll_depth,
      durationMs: event.duration_ms,
      isBounce: Boolean(event.is_bounce),
      sourceChannel: event.source_channel,
      utmSource: event.utm_source,
      utmMedium: event.utm_medium,
      utmCampaign: event.utm_campaign,
      clickIdType: event.click_id_type,
      createdAt: event.created_at,
    })
    eventsBySession.set(event.session_id, list)
  }

  return sessions.map((session) => ({
    sessionId: session.session_id,
    anonymousId: session.anonymous_id,
    startedAt: session.started_at,
    lastAt: session.last_at,
    sourceChannel: session.source_channel,
    landingPath: session.landing_path,
    firstLandingPath: session.first_landing_path,
    experimentId: session.experiment_id,
    experimentVariant: session.experiment_variant,
    firstExperimentVariant: session.first_experiment_variant,
    splitVisitId: session.split_visit_id,
    deviceType: session.device_type,
    browserName: session.browser_name,
    osName: session.os_name,
    inAppBrowser: session.in_app_browser,
    visitorType: session.visitor_type,
    sessionIndex: toNumber(session.session_index),
    country: session.country,
    region: session.region,
    city: session.city,
    asOrganization: session.as_organization,
    asn: toNumber(session.asn),
    colo: session.colo,
    maxScrollDepth: toNumber(session.max_scroll_depth),
    durationMs: toNumber(session.duration_ms),
    eventCount: toNumber(session.event_count),
    events: (eventsBySession.get(session.session_id) || []).slice(-60),
  }))
}

async function getSummary(env, url) {
  const light = url.searchParams.get('light') === '1'
  const orderSummary =
    (await safeFirst(
      env,
      `SELECT COUNT(*) AS total_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders,
              COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_orders,
              COALESCE(SUM(CASE WHEN status = 'free_reserved' THEN 1 ELSE 0 END), 0) AS free_reserved_orders,
              COALESCE(SUM(CASE WHEN status IN (${ATTENTION_STATUSES.map(() => '?').join(',')}) THEN 1 ELSE 0 END), 0) AS attention_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_value ELSE 0 END), 0) AS paid_revenue
       FROM course_orders`,
      ATTENTION_STATUSES,
    )) || {}

  const statusBreakdown = await safeAll(
    env,
    `SELECT status, COUNT(*) AS count,
            COALESCE(SUM(amount_value), 0) AS amount
     FROM course_orders
     GROUP BY status
     ORDER BY count DESC`,
  )

  const eventBreakdown = light
    ? []
    : await safeAll(
        env,
        `SELECT event_name, COUNT(*) AS count, MAX(created_at) AS last_at
         FROM tracking_events
         WHERE created_at >= datetime('now', '-7 days')
         GROUP BY event_name
         ORDER BY count DESC
         LIMIT 20`,
      )

  const eventSummary = light
    ? {}
    : (await safeFirst(
        env,
        `SELECT COUNT(*) AS total_events,
                COUNT(DISTINCT anonymous_id) AS anonymous_visitors,
                COUNT(DISTINCT session_id) AS sessions
         FROM tracking_events
         WHERE created_at >= datetime('now', '-7 days')`,
      )) || {}

  const lineSummary =
    (await safeFirst(
      env,
      `SELECT COUNT(*) AS total_line_customers,
              COALESCE(SUM(CASE WHEN is_friend = 1 THEN 1 ELSE 0 END), 0) AS friends
       FROM line_customers`,
    )) || {}

  return {
    orders: {
      total: toNumber(orderSummary.total_orders),
      paid: toNumber(orderSummary.paid_orders),
      pending: toNumber(orderSummary.pending_orders),
      freeReserved: toNumber(orderSummary.free_reserved_orders),
      attention: toNumber(orderSummary.attention_orders),
      paidRevenue: toNumber(orderSummary.paid_revenue),
    },
    statusBreakdown: statusBreakdown.map((row) => ({
      status: row.status,
      count: toNumber(row.count),
      amount: toNumber(row.amount),
    })),
    events: {
      total: toNumber(eventSummary.total_events),
      anonymousVisitors: toNumber(eventSummary.anonymous_visitors),
      sessions: toNumber(eventSummary.sessions),
      breakdown: eventBreakdown.map((row) => ({
        eventName: row.event_name,
        count: toNumber(row.count),
        lastAt: row.last_at,
      })),
    },
    line: {
      totalCustomers: toNumber(lineSummary.total_line_customers),
      friends: toNumber(lineSummary.friends),
    },
  }
}

function routeParts(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\/admin\/?/, '')
  return {
    url,
    parts: path.split('/').filter(Boolean),
  }
}

async function linkOrderLineCustomer(env, referenceId, lineUserId) {
  const customer = await safeFirst(
    env,
    `SELECT line_user_id, display_name, picture_url, email, email_verified, is_friend
     FROM line_customers
     WHERE line_user_id = ?`,
    [lineUserId],
  )

  if (!customer) {
    return null
  }

  await env.DB.prepare(
    `UPDATE course_orders
     SET line_user_id = ?,
         line_display_name = ?,
         line_picture_url = ?,
         line_email = ?,
         line_email_verified = ?,
         line_is_friend = ?,
         line_context_json = ?,
         updated_at = datetime('now')
     WHERE reference_id = ?`,
  )
    .bind(
      customer.line_user_id,
      customer.display_name,
      customer.picture_url || null,
      customer.email || null,
      customer.email_verified ? 1 : 0,
      customer.is_friend ? 1 : 0,
      JSON.stringify({
        lineUserId: customer.line_user_id,
        displayName: customer.display_name,
        pictureUrl: customer.picture_url || null,
        email: customer.email || null,
        emailVerified: Boolean(customer.email_verified),
        isFriend: Boolean(customer.is_friend),
        source: 'admin_manual_link',
      }),
      referenceId,
    )
    .run()

  const order = await getOrder(env, referenceId)
  if (order?.status === 'free_reserved') {
    await notifyLineFreeTrialReservation(env, referenceId)
  } else if (order?.status === 'paid') {
    await notifyLinePaymentSuccess(env, referenceId)
  }

  return order
}

async function resendOrderLineConfirmation(env, referenceId) {
  const order = await safeFirst(
    env,
    `SELECT reference_id, status, line_user_id
     FROM course_orders
     WHERE reference_id = ?`,
    [referenceId],
  )

  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' }
  }
  if (!order.line_user_id) {
    return {
      ok: false,
      status: 400,
      error: '訂單沒有綁定 LINE user，無法重送確認卡',
    }
  }

  let lineNotify
  if (order.status === 'free_reserved') {
    lineNotify = await notifyLineFreeTrialReservation(env, referenceId)
  } else if (order.status === 'paid') {
    lineNotify = await notifyLinePaymentSuccess(env, referenceId)
  } else {
    return {
      ok: false,
      status: 400,
      error: '只有免費體驗預約與已付款訂單可以重送 LINE 確認卡',
    }
  }

  return {
    ok: true,
    referenceId,
    lineNotify,
    order: await getOrder(env, referenceId),
  }
}

function createRecoveryId() {
  if (globalThis.crypto?.randomUUID) {
    return `lr_${globalThis.crypto.randomUUID()}`
  }
  return `lr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function createRecoveryBatchId() {
  if (globalThis.crypto?.randomUUID) {
    return `lrb_${globalThis.crypto.randomUUID()}`
  }
  return `lrb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function formatLineMoney(value, currency = 'TWD') {
  const amount = Number(value || 0)
  if (currency !== 'TWD') return `${currency} ${amount.toLocaleString('en-US')}`
  return `NT$${amount.toLocaleString('zh-TW')}`
}

function getPublicOrigin(env, request) {
  const configured =
    env.PUBLIC_SITE_URL ||
    env.SITE_ORIGIN ||
    env.PUBLIC_ORIGIN ||
    env.VITE_PUBLIC_SITE_URL

  if (configured) {
    try {
      return new URL(configured).origin
    } catch {
      // Fall back to the request origin below.
    }
  }

  try {
    return new URL(request.url).origin
  } catch {
    return DEFAULT_PUBLIC_ORIGIN
  }
}

function buildRecoveryTicketUrl(env, request, recoveryId, templateId) {
  const url = new URL('/', getPublicOrigin(env, request))
  url.searchParams.set('utm_source', 'line')
  url.searchParams.set('utm_medium', 'recovery')
  url.searchParams.set('utm_campaign', templateId)
  url.searchParams.set('recovery_id', recoveryId)
  url.hash = 'single-session-pass'
  return url.toString()
}

function isPendingOrderStatus(status) {
  return ['pending', 'payment_processing', 'session_failed'].includes(
    String(status || ''),
  )
}

function getAllowedRecoveryTemplateId(requestedTemplateId) {
  return LINE_RECOVERY_TEMPLATE_IDS.includes(requestedTemplateId)
    ? requestedTemplateId
    : null
}

function getRecoverySegment(customer) {
  if (toNumber(customer?.paid_orders) > 0) return 'paid'
  if (toNumber(customer?.pending_orders) > 0) return 'checkout_started_unpaid'
  if (toNumber(customer?.free_reserved_orders) > 0) return 'free_reserved_unpaid'
  if (toNumber(customer?.total_orders) <= 0 && toNumber(customer?.access_count) > 1) {
    return 'multi_visit_unreserved'
  }
  if (toNumber(customer?.total_orders) <= 0) return 'line_friend_unreserved'
  return 'unpaid_unknown'
}

function chooseRecoveryTemplate(customer, requestedTemplateId) {
  const allowedTemplateId = getAllowedRecoveryTemplateId(requestedTemplateId)
  if (allowedTemplateId) return allowedTemplateId
  if (customer.latest_order_reference_id && isPendingOrderStatus(customer.latest_order_status)) {
    return 'pending_checkout'
  }
  if (toNumber(customer.free_reserved_orders) > 0 || customer.latest_order_status === 'free_reserved') {
    return 'reserved_to_first_purchase'
  }
  if (toNumber(customer.access_count) > 1) return 'course_reminder'
  return 'newcomer_entry'
}

function buildLineImageUrl(env, request, fileName) {
  return `${getPublicOrigin(env, request)}/line-recovery/${fileName}`
}

function buildRecoveryOfferUrl(env, request, recoveryId, templateId) {
  const url = new URL('/offers', getPublicOrigin(env, request))
  url.searchParams.set('from', 'line-recovery')
  url.searchParams.set('utm_source', 'line')
  url.searchParams.set('utm_medium', 'recovery')
  url.searchParams.set('utm_campaign', templateId)
  url.searchParams.set('recovery_id', recoveryId)
  return url.toString()
}

function getRecoveryMessageCopy(customer, templateId) {
  const latestCourseName = trimText(customer.latest_order_course_name, 80)
  const latestAmount =
    customer.latest_order_amount_value == null
      ? ''
      : formatLineMoney(customer.latest_order_amount_value)

  const copyByTemplate = {
    pending_checkout: {
      eyebrow: 'PAYMENT PAUSED',
      title: '如果你剛剛停在付款前',
      body: latestCourseName
        ? `你剛剛選的「${latestCourseName}」還沒完成付款。`
        : '你剛剛建立的預約還沒完成付款。',
      meta: latestAmount ? `目前金額 ${latestAmount}` : '付款完成後才算正式保留',
      button: '完成這場預約',
      cards: [
        {
          eyebrow: 'PAYMENT PAUSED',
          title: '如果你剛剛停在付款前',
          paragraphs: [
            '你可能不是不想來，只是還在確認這是不是又一個要入會、要諮詢、要被推銷的健身房流程。',
            latestCourseName
              ? `你剛剛選的「${latestCourseName}」還沒完成付款。`
              : '你剛剛建立的預約還沒完成付款。',
            '這一場不用談方案。完成一次付款，就把這場 UFC GYM 單堂體驗保留下來。',
          ],
          meta: latestAmount ? `目前金額 ${latestAmount}` : '付款完成後 LINE 會收到確認',
          button: '完成這場預約',
        },
        {
          image: 'flow-step-3.jpg',
          eyebrow: 'NO MEMBERSHIP',
          title: '不是入會前導',
          paragraphs: [
            'UFC GYM 單堂體驗是一場已經編排好的夜晚體驗。',
            '你不用先承諾長期課程，也不需要在現場跟業務談方案。',
            '到場後跟著音樂、倒數、教練口令和全場節奏完成這 50 分鐘。',
          ],
          meta: '一次付款 · 一場完整體驗',
          button: '完成這場預約',
        },
        {
          image: 'collective-euphoria-card.jpg',
          eyebrow: 'CONFIRMATION',
          title: '付款後 LINE 會收到確認',
          paragraphs: [
            '完成付款後，確認卡會放在 LINE 裡。',
            '當天照卡片資訊到場就可以，不用再等人工確認，也不用重新填一次資料。',
          ],
          meta: '保留成功後再進場',
          button: '完成這場預約',
        },
      ],
    },
    weekly_trial_invite: {
      eyebrow: 'FREE TRIAL',
      title: '如果你其實不想去健身房',
      body: '不用入會，不用先懂拳擊或泰拳。先選一場能進場的時間，到現場跟著教練完成整段體驗。',
      meta: '新手可進 · 不對打 · LINE 內確認',
      button: '保留免費體驗',
      cards: [
        {
          eyebrow: 'FREE TRIAL',
          title: '如果你其實不想去健身房',
          paragraphs: [
            '很多人不是不知道該運動。',
            '是不想入會、不想被推銷，也覺得一般運動課很無聊。',
            'UFC GYM 單堂體驗 解決的是這件事：把一堂課變成一場有情緒、有節奏、有現場感的夜晚體驗。',
          ],
          meta: '先保留一場，不用先承諾長期課程',
          button: '保留免費體驗',
        },
        {
          image: 'hero-poster.jpg',
          eyebrow: 'UFC GYM',
          title: '你不是來被上課',
          paragraphs: [
            '你是進到一個已經排好的現場。',
            '音樂、倒數、拳套聲、教練口令和其他人的節奏，會把你帶進去。',
          ],
          meta: '50 分鐘教練帶領 · 新手可進',
          button: '選一場時間',
        },
        {
          image: 'flow-step-5.jpg',
          eyebrow: 'LINE CONFIRM',
          title: '保留後在 LINE 裡確認',
          paragraphs: [
            '留下資料並保留場次後，LINE 會收到免費體驗確認卡。',
            '預約先完成，再決定要不要看 618 首購優惠。',
          ],
          meta: '先確認預約，再看首購優惠',
          button: '保留免費體驗',
        },
      ],
    },
    reserved_to_first_purchase: {
      eyebrow: '618 OFFER',
      title: '你的免費體驗已經保留',
      body: '預約先算完成。接下來如果想把體驗變成固定訓練，可以先看 618 首購優惠。',
      meta: '確認預約後再看優惠，不會被推銷',
      button: '查看 618 首購',
      cards: [
        {
          eyebrow: 'RESERVED',
          title: '你的免費體驗已保留',
          paragraphs: [
            latestCourseName
              ? `「${latestCourseName}」已進入你的 LINE 預約流程。`
              : '你已完成免費體驗預約流程。',
            '當天照 LINE 確認資訊到場即可。',
            '接下來的優惠不是現場推銷，是你可以先在線上自己看的下一步。',
          ],
          meta: '預約已完成 · 不用再重填資料',
          button: '查看 618 首購',
        },
        {
          image: 'offers-hero-octagon-poster.jpg',
          eyebrow: 'FIRST PURCHASE',
          title: '想固定開始，再看首購優惠',
          paragraphs: [
            '如果你想把一次體驗接成固定訓練，可以先看 618 首購。',
            '不用在現場談方案，線上看懂再決定。',
          ],
          meta: '拳擊／泰拳訓練方案或 UFC GYM 單堂體驗 都可選',
          button: '看 618 方案',
        },
        {
          image: 'training-plan-origin-poster.jpg',
          eyebrow: 'NEXT STEP',
          title: '把一次體驗接成下一步',
          paragraphs: [
            '如果你想更穩定進步，可以直接選 2 堂或 4 堂 拳擊／泰拳訓練方案。',
            '先把節奏建立起來，再決定要走多遠。',
          ],
          meta: '平易近人的付款流程',
          button: '查看方案',
        },
      ],
    },
    offer_viewed_unpaid: {
      eyebrow: '618 OFFER',
      title: '你看過的首購優惠還在',
      body: '如果你想把 UFC GYM 單堂體驗 變成固定開始的一步，可以回到 618 首購方案，直接完成付款。',
      meta: '不用入會 · 不用現場談方案',
      button: '回到 618 首購',
      cards: [
        {
          eyebrow: '618 OFFER',
          title: '如果你其實已經想開始',
          paragraphs: [
            '你可能已經看過 618 首購，只是還沒決定要不要付款。',
            '這裡不是入會合約，也不是現場諮詢。',
            '你只是在線上選一個開始的組合，完成付款後，LINE 收到確認。',
          ],
          meta: '首購限定優惠',
          button: '回到 618 首購',
        },
        {
          image: 'training-plan-origin-poster.jpg',
          eyebrow: '訓練方案',
          title: '想更穩定，就選 拳擊／泰拳訓練方案',
          paragraphs: [
            '把拳擊或泰拳拆成更容易跟上的幾堂課。',
            '適合體驗後想繼續，但不想一次被推到長期方案的人。',
          ],
          meta: '2 堂或 4 堂可選',
          button: '查看方案',
        },
        {
          image: 'collective-euphoria-card.jpg',
          eyebrow: 'UFC GYM',
          title: '也可以繼續買單場體驗',
          paragraphs: [
            '如果你只想先保留下一場 UFC GYM 單堂體驗，也可以用單場方式進場。',
            '一次付款，一場完整體驗。',
          ],
          meta: '一次付款 · 一場完整體驗',
          button: '看可購買場次',
        },
      ],
    },
    course_reminder: {
      eyebrow: 'UFC GYM 單堂體驗',
      title: '如果你也一直卡在心裡',
      body: '如果你只是還在看，可以先從一場能跟上的 UFC GYM 單堂體驗 開始。不用入會，不會中途推銷。',
      meta: '50 分鐘教練帶領 · 新手可進',
      button: '看本週可預約',
      cards: [
        {
          eyebrow: 'UFC GYM',
          title: '如果你也一直卡在心裡',
          paragraphs: [
            '也許你不是沒興趣。',
            '你只是想到健身房，就想到入會、推銷、合約，或一堂很無聊的運動課。',
            '這件事不用自己猜到很煩。',
            '先讓一場 UFC GYM 單堂體驗 告訴你：運動也可以是一段情緒價值體驗。',
          ],
          meta: '不用入會 · 不被推銷',
          button: '看本週可預約',
        },
        {
          image: 'collective-euphoria-card.jpg',
          eyebrow: 'ATMOSPHERE',
          title: '你不用自己找動力',
          paragraphs: [
            '現場的音樂、倒數、教練口令和其他人的節奏會把你帶進去。',
            '你只需要跟上這一場。',
          ],
          meta: '不用自己找動力',
          button: '看本週可預約',
        },
        {
          image: 'train-different-poster.jpg',
          eyebrow: 'NO SALES',
          title: '不想入會，也可以買一場',
          paragraphs: [
            '不用諮詢，不用談合約。',
            '你只需要選時間，完成一次預約或付款。',
          ],
          meta: '單場體驗路徑',
          button: '選一場開始',
        },
      ],
    },
    newcomer_entry: {
      eyebrow: 'FIRST NIGHT',
      title: '這週先保留一場夜晚體驗',
      body: '你不用先有拳擊或泰拳基礎。先選一場 UFC GYM 單堂體驗，進場完成一段有節奏的體驗。',
      meta: '不用入會 · 不對打 · LINE 確認',
      button: '看 UFC GYM 單堂體驗場次',
      cards: [
        {
          eyebrow: 'FIRST NIGHT',
          title: '這週先保留一場夜晚體驗',
          paragraphs: [
            '你不用先喜歡運動，也不用先決定入會。',
            '先把一場 UFC GYM 單堂體驗保留下來。',
            '進場後，跟著教練、音樂和全場節奏完成 50 分鐘。',
          ],
          meta: '首堂免費體驗',
          button: '看 UFC GYM 單堂體驗場次',
        },
        {
          image: 'hero-poster.jpg',
          eyebrow: 'UFC GYM',
          title: '不是冷冰冰的課程表',
          paragraphs: [
            '這是一場把拳擊、泰拳、節奏、教練帶領和現場氛圍編排好的體驗。',
            '你只要選一場，照時間到場。',
          ],
          meta: '適合第一次來的人',
          button: '選一場體驗',
        },
        {
          image: 'flow-step-5.jpg',
          eyebrow: 'LINE CONFIRM',
          title: '預約完成後在 LINE 確認',
          paragraphs: [
            '送出資料後，你會收到免費體驗確認卡。',
            '預約先完成，再決定要不要看首購優惠。',
          ],
          meta: '先預約，再看優惠',
          button: '保留免費體驗',
        },
      ],
    },
  }

  return copyByTemplate[templateId] || copyByTemplate.newcomer_entry
}

function getRecoveryCardParagraphs(card) {
  if (Array.isArray(card.paragraphs)) {
    return card.paragraphs.map((item) => trimText(item, 220)).filter(Boolean)
  }
  return String(card.body || '')
    .split(/\n\s*\n/)
    .map((item) => trimText(item, 220))
    .filter(Boolean)
}

function buildRecoveryCardBubble(card, targetUrl, env, request) {
  const paragraphs = getRecoveryCardParagraphs(card)
  const hasImage = Boolean(card.image)

  if (card.imageOnly && hasImage) {
    return {
      type: 'bubble',
      size: 'mega',
      hero: {
        type: 'image',
        url: buildLineImageUrl(env, request, card.image),
        size: 'full',
        aspectRatio: card.imageAspectRatio || '3:4',
        aspectMode: card.imageAspectMode || 'cover',
      },
    }
  }

  return {
    type: 'bubble',
    size: 'mega',
    styles: {
      body: { backgroundColor: LINE_STORY_CARD_BG },
      footer: { backgroundColor: LINE_STORY_CARD_BG },
    },
    ...(hasImage
      ? {
          hero: {
            type: 'image',
            url: buildLineImageUrl(env, request, card.image),
            size: 'full',
            aspectRatio: card.imageAspectRatio || '20:13',
            aspectMode: card.imageAspectMode || 'cover',
          },
        }
      : {}),
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      paddingAll: 'xl',
      contents: [
        {
          type: 'text',
          text: card.eyebrow,
          size: 'xs',
          weight: 'bold',
          color: LINE_STORY_CARD_BLUE,
        },
        {
          type: 'text',
          text: card.title,
          weight: 'bold',
          size: 'xl',
          color: LINE_STORY_CARD_BLUE,
          wrap: true,
        },
        ...paragraphs.map((paragraph, index) => ({
          type: 'text',
          text: paragraph,
          size: 'md',
          color: LINE_STORY_CARD_TEXT,
          wrap: true,
          lineSpacing: '7px',
          margin: index === 0 ? 'md' : 'lg',
        })),
        {
          type: 'separator',
          margin: 'xl',
          color: '#DDE7F5',
        },
        {
          type: 'text',
          text: card.meta,
          size: 'sm',
          color: LINE_STORY_CARD_MUTED,
          wrap: true,
          margin: 'md',
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: 'xl',
      paddingTop: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'md',
          color: LINE_STORY_CARD_BLUE,
          action: {
            type: 'uri',
            label: card.button,
            uri: targetUrl,
          },
        },
      ],
    },
  }
}

function buildRecoveryMessage({ customer, templateId, targetUrl, env, request }) {
  const copy = getRecoveryMessageCopy(customer, templateId)
  const cards = copy.cards || [copy]

  return {
    type: 'flex',
    altText: `${copy.title}｜${copy.button}`,
    contents: {
      type: 'carousel',
      contents: cards.map((card) =>
        buildRecoveryCardBubble(card, targetUrl, env, request),
      ),
    },
  }
}

function buildRecoveryPreview({ customer, templateId, targetUrl, env, request }) {
  const copy = getRecoveryMessageCopy(customer, templateId)
  const cards = copy.cards || [copy]
  return {
    templateId,
    targetUrl,
    altText: `${copy.title}｜${copy.button}`,
    eyebrow: copy.eyebrow,
    title: copy.title,
    body: copy.body,
    meta: copy.meta,
    button: copy.button,
    cards: cards.map((card) => {
      const paragraphs = getRecoveryCardParagraphs(card)
      return {
        eyebrow: card.eyebrow,
        title: card.title,
        body: card.body || paragraphs.join('\n\n'),
        paragraphs,
        meta: card.meta,
        button: card.button,
        imageUrl: card.image ? buildLineImageUrl(env, request, card.image) : null,
        imageOnly: Boolean(card.imageOnly),
        imageAspectRatio: card.imageAspectRatio || null,
        imageAspectMode: card.imageAspectMode || null,
      }
    }),
    targetKind:
      templateId === 'pending_checkout' &&
      customer.latest_order_shopline_session_url &&
      String(customer.latest_order_status || '') === 'pending'
        ? 'shopline_checkout'
        : 'site_recovery',
  }
}

function parseD1Time(value) {
  if (!value) return null
  const normalized = String(value).includes('T')
    ? String(value)
    : `${String(value).replace(' ', 'T')}Z`
  const time = new Date(normalized).getTime()
  return Number.isFinite(time) ? time : null
}

function isWithinHours(value, hours) {
  const time = parseD1Time(value)
  if (!time) return false
  return Date.now() - time < hours * 60 * 60 * 1000
}

function getRecoveryBlockers(customer, env, templateId) {
  const blockers = []
  if (!customer?.line_user_id) blockers.push('缺少 LINE userId')
  if (!customer?.is_friend) blockers.push('不是 LINE 好友，不能由後台推播')
  if (toNumber(customer?.paid_orders) > 0) blockers.push('已有付款紀錄，避免再發喚回訊息')
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) blockers.push('Missing LINE_CHANNEL_ACCESS_TOKEN')
  if (
    templateId &&
    customer?.latest_recovery_template_id === templateId &&
    isWithinHours(
      customer.latest_recovery_sent_at || customer.latest_recovery_attempted_at,
      24,
    )
  ) {
    blockers.push('24 小時內已發過相同喚回卡')
  }
  return blockers
}

function buildRecoveryTarget(env, request, customer, recoveryId, templateId) {
  if (
    templateId === 'pending_checkout' &&
    customer.latest_order_shopline_session_url &&
    String(customer.latest_order_status || '') === 'pending'
  ) {
    return customer.latest_order_shopline_session_url
  }

  if (
    templateId === 'reserved_to_first_purchase' ||
    templateId === 'offer_viewed_unpaid'
  ) {
    return buildRecoveryOfferUrl(env, request, recoveryId, templateId)
  }

  return buildRecoveryTicketUrl(env, request, recoveryId, templateId)
}
async function previewLineRecoveryMessage(env, request, lineUserId, requestedTemplateId) {
  const customer = await getRecoveryCustomer(env, lineUserId)
  if (!customer) return { error: 'LINE customer not found', status: 404 }

  const templateId = chooseRecoveryTemplate(customer, requestedTemplateId)
  const targetUrl = buildRecoveryTarget(env, request, customer, 'preview', templateId)
  const blockers = getRecoveryBlockers(customer, env, templateId)

  return {
    ok: true,
    canSend: blockers.length === 0,
    blockers,
    preview: buildRecoveryPreview({ customer, templateId, targetUrl, env, request }),
  }
}

function normalizeLineUserIds(value, max = 100) {
  const ids = Array.isArray(value) ? value : []
  const seen = new Set()
  const normalized = []

  for (const id of ids) {
    const lineUserId = trimText(id, 160)
    if (!lineUserId || seen.has(lineUserId)) continue
    seen.add(lineUserId)
    normalized.push(lineUserId)
    if (normalized.length >= max) break
  }

  return normalized
}

async function previewLineRecoveryBatch(env, request, body = {}) {
  const lineUserIds = normalizeLineUserIds(body?.lineUserIds, 100)
  if (lineUserIds.length === 0) {
    return { error: '請先勾選 LINE 用戶', status: 400 }
  }

  const requestedTemplateId = trimText(body?.templateId, 80)
  const requestedSegment = trimText(body?.segment, 100) || null
  const recipients = []
  const previewsByTemplate = new Map()

  for (const lineUserId of lineUserIds) {
    const customer = await getRecoveryCustomer(env, lineUserId)
    if (!customer) {
      recipients.push({
        lineUserId,
        displayName: null,
        templateId: null,
        segment: requestedSegment || 'missing_customer',
        canSend: false,
        blockers: ['找不到 LINE 用戶'],
      })
      continue
    }

    const templateId = chooseRecoveryTemplate(customer, requestedTemplateId)
    const segment = requestedSegment || getRecoverySegment(customer)
    const targetUrl = buildRecoveryTarget(env, request, customer, 'preview', templateId)
    const blockers = getRecoveryBlockers(customer, env, templateId)
    const preview = buildRecoveryPreview({ customer, templateId, targetUrl, env, request })

    if (!previewsByTemplate.has(templateId)) {
      previewsByTemplate.set(templateId, preview)
    }

    recipients.push({
      lineUserId: customer.line_user_id,
      displayName: customer.display_name || null,
      pictureUrl: customer.picture_url || null,
      templateId,
      segment,
      targetUrl,
      canSend: blockers.length === 0,
      blockers,
    })
  }

  const sendableCount = recipients.filter((recipient) => recipient.canSend).length
  const blockedCount = recipients.length - sendableCount

  return {
    ok: true,
    templateId: getAllowedRecoveryTemplateId(requestedTemplateId) || 'auto',
    selectedCount: recipients.length,
    sendableCount,
    blockedCount,
    previews: Array.from(previewsByTemplate.values()),
    recipients,
  }
}

async function insertManualLineMessageLog(
  env,
  { recoveryId, customer, templateId, targetUrl, message, batchId, segment, staffNote },
) {
  await ensureLineMessageSendsTable(env)
  await ensureLineMessageSendMetadataColumns(env)
  await env.DB.prepare(
    `INSERT INTO line_message_sends (
       message_id, line_user_id, reference_id, source, message_type,
       template_id, target_url, status, message_json, batch_id, segment,
       staff_note, template_version, attempted_at
     ) VALUES (?, ?, ?, 'admin_manual', 'manual_recovery', ?, ?, 'sending', ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      recoveryId,
      customer.line_user_id,
      customer.latest_order_reference_id || null,
      templateId,
      targetUrl,
      JSON.stringify(message).slice(0, 8000),
      batchId || null,
      segment || null,
      staffNote || null,
      LINE_RECOVERY_TEMPLATE_VERSION,
    )
    .run()
}

async function updateManualLineMessageLog(env, recoveryId, result) {
  await env.DB.prepare(
    `UPDATE line_message_sends
     SET status = ?,
         response_json = ?,
         error = ?,
         sent_at = CASE WHEN ? = 'sent' THEN datetime('now') ELSE sent_at END,
         attempted_at = datetime('now')
     WHERE message_id = ?`,
  )
    .bind(
      trimText(result.status, 80),
      result.response ? JSON.stringify(result.response).slice(0, 8000) : null,
      result.error ? trimText(result.error, 1000) : null,
      result.status,
      recoveryId,
    )
    .run()
}

async function getRecoveryCustomer(env, lineUserId) {
  const hasOrdersTable = Boolean(
    await safeFirst(
      env,
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = 'course_orders'`,
    ),
  )

  if (!hasOrdersTable) {
    return safeFirst(
      env,
      `SELECT lc.line_user_id, lc.display_name, lc.picture_url, lc.email,
              lc.email_verified, lc.is_friend, lc.access_count, lc.last_seen_at,
              0 AS total_orders, 0 AS paid_orders, 0 AS pending_orders,
              0 AS free_reserved_orders, 0 AS paid_revenue,
              NULL AS latest_recovery_template_id,
              NULL AS latest_recovery_status,
              NULL AS latest_recovery_sent_at,
              NULL AS latest_recovery_attempted_at
       FROM line_customers lc
       WHERE lc.line_user_id = ?`,
      [lineUserId],
    )
  }

  return safeFirst(
    env,
    `WITH order_ranked AS (
       SELECT co.line_user_id, co.reference_id, co.status, co.course_name,
              co.amount_value, co.currency, co.shopline_session_url,
              co.source_path, co.created_at, co.updated_at, co.paid_at,
              ROW_NUMBER() OVER (
                PARTITION BY co.line_user_id
                ORDER BY
                  CASE WHEN co.status IN ('pending', 'payment_processing', 'session_failed') THEN 0 ELSE 1 END,
                  datetime(COALESCE(co.paid_at, co.updated_at, co.created_at)) DESC,
                  co.reference_id DESC
              ) AS rn
       FROM course_orders co
       WHERE co.line_user_id = ?
     ),
     order_stats AS (
       SELECT line_user_id,
              COUNT(*) AS total_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END), 0) AS paid_orders,
              COALESCE(SUM(CASE WHEN status IN ('pending', 'payment_processing', 'session_failed') THEN 1 ELSE 0 END), 0) AS pending_orders,
              COALESCE(SUM(CASE WHEN status = 'free_reserved' THEN 1 ELSE 0 END), 0) AS free_reserved_orders,
              COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_value ELSE 0 END), 0) AS paid_revenue
       FROM order_ranked
       GROUP BY line_user_id
     ),
     latest_recovery AS (
       SELECT line_user_id, template_id, status, sent_at, attempted_at,
              ROW_NUMBER() OVER (
                PARTITION BY line_user_id
                ORDER BY datetime(COALESCE(sent_at, attempted_at, created_at)) DESC, id DESC
              ) AS rn
       FROM line_recovery_messages
     )
     SELECT lc.line_user_id, lc.display_name, lc.picture_url, lc.email,
            lc.email_verified, lc.is_friend, lc.access_count, lc.last_seen_at,
            COALESCE(os.total_orders, 0) AS total_orders,
            COALESCE(os.paid_orders, 0) AS paid_orders,
            COALESCE(os.pending_orders, 0) AS pending_orders,
            COALESCE(os.free_reserved_orders, 0) AS free_reserved_orders,
            COALESCE(os.paid_revenue, 0) AS paid_revenue,
            latest.reference_id AS latest_order_reference_id,
            latest.status AS latest_order_status,
            latest.course_name AS latest_order_course_name,
            latest.amount_value AS latest_order_amount_value,
            latest.currency AS latest_order_currency,
            latest.shopline_session_url AS latest_order_shopline_session_url,
            latest.source_path AS latest_order_source_path,
            lr.template_id AS latest_recovery_template_id,
            lr.status AS latest_recovery_status,
            lr.sent_at AS latest_recovery_sent_at,
            lr.attempted_at AS latest_recovery_attempted_at
     FROM line_customers lc
     LEFT JOIN order_stats os ON os.line_user_id = lc.line_user_id
     LEFT JOIN order_ranked latest
       ON latest.line_user_id = lc.line_user_id AND latest.rn = 1
     LEFT JOIN latest_recovery lr ON lr.line_user_id = lc.line_user_id AND lr.rn = 1
     WHERE lc.line_user_id = ?`,
    [lineUserId, lineUserId],
  )
}

async function sendLineRecoveryMessage(env, request, lineUserId, body = {}) {
  const customer = await getRecoveryCustomer(env, lineUserId)
  if (!customer) return { error: 'LINE customer not found', status: 404 }
  if (!customer.is_friend) {
    return { error: '這位用戶不是 LINE 好友，無法主動推播。', status: 409 }
  }
  if (toNumber(customer.paid_orders) > 0) {
    return { error: '這位用戶已有付款紀錄，已略過喚回訊息。', status: 409 }
  }
  if (!env.LINE_CHANNEL_ACCESS_TOKEN) {
    return { error: 'Missing LINE_CHANNEL_ACCESS_TOKEN', status: 503 }
  }

  const recoveryId = createRecoveryId()
  const templateId = chooseRecoveryTemplate(
    customer,
    trimText(body?.templateId, 80),
  )
  const blockers = getRecoveryBlockers(customer, env, templateId)
  if (blockers.length > 0) {
    return { error: blockers.join('；'), status: 409, templateId, blockers }
  }

  const batchId = trimText(body?.batchId, 100) || null
  const segment = trimText(body?.segment || getRecoverySegment(customer), 100) || null
  const staffNote = trimText(body?.staffNote, 500) || null
  const targetUrl = buildRecoveryTarget(env, request, customer, recoveryId, templateId)
  const message = buildRecoveryMessage({ customer, templateId, targetUrl, env, request })

  await env.DB.prepare(
    `INSERT INTO line_recovery_messages (
       recovery_id, line_user_id, batch_id, template_id, segment, target_url, status,
       message_json, staff_note, template_version, attempted_at
     ) VALUES (?, ?, ?, ?, ?, ?, 'sending', ?, ?, ?, datetime('now'))`,
  )
    .bind(
      recoveryId,
      customer.line_user_id,
      batchId,
      templateId,
      segment,
      targetUrl,
      JSON.stringify(message),
      staffNote,
      LINE_RECOVERY_TEMPLATE_VERSION,
    )
    .run()
  await insertManualLineMessageLog(env, {
    recoveryId,
    customer,
    templateId,
    targetUrl,
    message,
    batchId,
    segment,
    staffNote,
  })

  try {
    const response = await fetch(LINE_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        to: customer.line_user_id,
        messages: [message],
      }),
    })
    const responseBody = await response.json().catch(() => null)

    if (!response.ok) {
      const error = `LINE push failed with HTTP ${response.status}`
      await env.DB.prepare(
        `UPDATE line_recovery_messages
         SET status = 'failed',
             response_json = ?,
             error = ?,
             attempted_at = datetime('now')
         WHERE recovery_id = ?`,
      )
        .bind(
          responseBody ? JSON.stringify(responseBody).slice(0, 8000) : null,
          error,
          recoveryId,
        )
        .run()

      await updateManualLineMessageLog(env, recoveryId, {
        status: 'failed',
        response: responseBody,
        error,
      })

      return { error, status: 502, recoveryId, templateId, response: responseBody }
    }

    await env.DB.prepare(
      `UPDATE line_recovery_messages
       SET status = 'sent',
           response_json = ?,
           sent_at = datetime('now'),
           attempted_at = datetime('now')
       WHERE recovery_id = ?`,
    )
      .bind(
        responseBody ? JSON.stringify(responseBody).slice(0, 8000) : JSON.stringify({ ok: true }),
        recoveryId,
      )
      .run()
    await updateManualLineMessageLog(env, recoveryId, {
      status: 'sent',
      response: responseBody || { ok: true },
    })

    return {
      ok: true,
      status: 'sent',
      recoveryId,
      templateId,
      targetUrl,
    }
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : 'LINE push request failed'
    await env.DB.prepare(
      `UPDATE line_recovery_messages
       SET status = 'failed',
           error = ?,
           attempted_at = datetime('now')
       WHERE recovery_id = ?`,
    )
      .bind(messageText, recoveryId)
      .run()
    await updateManualLineMessageLog(env, recoveryId, {
      status: 'failed',
      error: messageText,
    })

    return { error: messageText, status: 502, recoveryId, templateId }
  }
}

async function sendLineRecoveryBatch(env, request, body = {}) {
  if (body?.confirmed !== true) {
    return { error: '批次發送前必須先確認預覽結果', status: 400 }
  }

  const lineUserIds = normalizeLineUserIds(body?.lineUserIds, LINE_RECOVERY_BATCH_LIMIT)
  if (lineUserIds.length === 0) {
    return { error: '請先勾選 LINE 用戶', status: 400 }
  }

  const requestedTemplateId = trimText(body?.templateId, 80)
  const segment = trimText(body?.segment, 100) || null
  const staffNote = trimText(body?.staffNote, 500) || null
  const batchPreview = await previewLineRecoveryBatch(env, request, {
    lineUserIds,
    templateId: requestedTemplateId,
    segment,
  })

  if (!batchPreview.ok) return batchPreview

  const batchId = createRecoveryBatchId()
  const sendableRecipients = batchPreview.recipients.filter((recipient) => recipient.canSend)
  const blockedRecipients = batchPreview.recipients.filter((recipient) => !recipient.canSend)

  await env.DB.prepare(
    `INSERT INTO line_recovery_batches (
       batch_id, template_id, segment, selected_count, sendable_count,
       blocked_count, status, staff_note, created_by, confirmed_at
     ) VALUES (?, ?, ?, ?, ?, ?, 'sending', ?, 'admin', datetime('now'))`,
  )
    .bind(
      batchId,
      batchPreview.templateId,
      segment,
      batchPreview.selectedCount,
      batchPreview.sendableCount,
      batchPreview.blockedCount,
      staffNote,
    )
    .run()

  const results = []
  let sentCount = 0
  let failedCount = 0

  for (const recipient of sendableRecipients) {
    const result = await sendLineRecoveryMessage(env, request, recipient.lineUserId, {
      templateId: recipient.templateId,
      batchId,
      segment: recipient.segment,
      staffNote,
    })

    if (result.ok) {
      sentCount += 1
    } else {
      failedCount += 1
    }

    results.push({
      lineUserId: recipient.lineUserId,
      displayName: recipient.displayName || null,
      templateId: recipient.templateId,
      segment: recipient.segment,
      ok: Boolean(result.ok),
      status: result.status || null,
      recoveryId: result.recoveryId || null,
      error: result.error || null,
    })
  }

  const finalStatus =
    failedCount > 0 ? 'completed_with_errors' : 'completed'

  await env.DB.prepare(
    `UPDATE line_recovery_batches
     SET sent_count = ?,
         failed_count = ?,
         status = ?,
         completed_at = datetime('now')
     WHERE batch_id = ?`,
  )
    .bind(sentCount, failedCount, finalStatus, batchId)
    .run()

  return {
    ok: true,
    batchId,
    status: finalStatus,
    selectedCount: batchPreview.selectedCount,
    sendableCount: batchPreview.sendableCount,
    blockedCount: batchPreview.blockedCount,
    sentCount,
    failedCount,
    blockedRecipients,
    results,
  }
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  const authError = assertAdmin(request, env)
  if (authError) return authError

  const { url, parts } = routeParts(request)
  const resource = parts[0] || 'summary'
  const id = parts[1] ? decodeURIComponent(parts[1]) : ''
  const action = parts[2] || ''
  const needsFullTrackingEnsure =
    resource === 'traffic' ||
    resource === 'changes' ||
    resource === 'journeys' ||
    resource === 'events' ||
    (resource === 'summary' && url.searchParams.get('light') !== '1')

  if (needsFullTrackingEnsure) {
    await ensureCustomerTrackingTablesOnce(env)
  } else {
    await ensureAdminCoreTablesOnce(env)
  }

  if (resource === 'summary') {
    return json({ ok: true, summary: await getSummary(env, url) })
  }

  if (resource === 'orders' && id) {
    const order = await getOrder(env, id)
    return order ? json({ ok: true, order }) : json({ error: 'Order not found' }, { status: 404 })
  }

  if (resource === 'orders') {
    return json({ ok: true, orders: await listOrders(env, url) })
  }

  if (resource === 'inventory') {
    return json({ ok: true, inventory: await listInventory(env, url) })
  }

  if (resource === 'events') {
    return json({ ok: true, events: await listEvents(env, url) })
  }

  if (resource === 'traffic') {
    return json({ ok: true, traffic: await getTraffic(env, url) })
  }

  if (resource === 'changes') {
    return json({ ok: true, changes: await getChanges(env, url) })
  }

  if (resource === 'journeys') {
    return json({ ok: true, journeys: await listJourneys(env, url) })
  }

  if (resource === 'line-customers' && id && action === 'recovery-preview') {
    const result = await previewLineRecoveryMessage(
      env,
      request,
      id,
      trimText(url.searchParams.get('templateId'), 80),
    )
    if (result.ok) return json(result)
    return json({ error: result.error, ...result }, { status: result.status || 500 })
  }

  if (resource === 'line-customers' && id) {
    const customer = await getLineCustomer(env, id)
    return customer
      ? json({ ok: true, customer })
      : json({ error: 'LINE customer not found' }, { status: 404 })
  }

  if (resource === 'line-customers') {
    return json({ ok: true, customers: await listLineCustomers(env, url) })
  }

  if (resource === 'line-messages') {
    return json({ ok: true, messages: await listLineMessages(env, url) })
  }

  return json({ error: 'Not found' }, { status: 404 })
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Missing D1 binding DB' }, { status: 503 })
  }

  const authError = assertAdmin(request, env)
  if (authError) return authError

  const { parts } = routeParts(request)
  const resource = parts[0] || ''
  const id = parts[1] ? decodeURIComponent(parts[1]) : ''
  const action = parts[2] || ''

  await ensureAdminCoreTablesOnce(env)

  if (resource === 'orders' && id && action === 'link-line') {
    const body = await request.json().catch(() => null)
    const lineUserId = String(body?.lineUserId || '').trim()
    if (!lineUserId) {
      return json({ error: 'Missing lineUserId' }, { status: 400 })
    }

    const order = await linkOrderLineCustomer(env, id, lineUserId)
    return order
      ? json({ ok: true, order })
      : json({ error: 'Order or LINE customer not found' }, { status: 404 })
  }

  if (resource === 'orders' && id && action === 'resend-line-confirmation') {
    const result = await resendOrderLineConfirmation(env, id)
    if (result.ok) return json(result)
    return json({ error: result.error, ...result }, { status: result.status || 500 })
  }

  if (resource === 'line-recovery' && id === 'preview-batch') {
    const body = await request.json().catch(() => ({}))
    const result = await previewLineRecoveryBatch(env, request, body)
    if (result.ok) return json(result)
    return json({ error: result.error, ...result }, { status: result.status || 500 })
  }

  if (resource === 'line-recovery' && id === 'send-batch') {
    const body = await request.json().catch(() => ({}))
    const result = await sendLineRecoveryBatch(env, request, body)
    if (result.ok) return json(result)
    return json({ error: result.error, ...result }, { status: result.status || 500 })
  }

  if (resource === 'line-customers' && id && action === 'send-recovery') {
    const body = await request.json().catch(() => ({}))
    const result = await sendLineRecoveryMessage(env, request, id, body)
    if (result.ok) return json(result)
    return json({ error: result.error, ...result }, { status: result.status || 500 })
  }

  return json({ error: 'Not found' }, { status: 404 })
}
