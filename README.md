# Fight Night Pass — Landing Page

> 集體進入狀態的娛樂型壓力釋放夜場入場券落地頁

## 本地開發

```bash
npm install
npm run dev
```

## 建置 & 部署

```bash
npm run build    # 輸出到 dist/
npm run preview  # 本地預覽 production build
```

可直接部署 `dist/` 至 **Cloudflare Pages** 或任何靜態主機。

## 專案結構

```
src/
  assets/          # Logo、圖片等靜態資源
  components/
    layout/        # Header
    sections/      # 14 個 Section 元件
    ui/            # Button, Card, Accordion, Badge, SectionWrapper, SectionHeading
  data/
    landingContent.ts   # ← 所有文案在這裡修改
  hooks/           # useTracking, useScrollProgress
  lib/             # analytics 初始化
  store/           # Zustand (FAQ 狀態)
  types/           # TypeScript 型別定義
  App.tsx          # Section 組裝
  main.tsx         # 入口
```

## 文案修改

所有文字內容集中在 `src/data/landingContent.ts`，修改此檔即可更新頁面文案。

## 方案設定

首頁已不直接顯示方案；目前 `/offers` 頁的價格與方案文案集中在 `landingContent.ts` 的 `offersPlans` 陣列：

| 方案 | 價格 |
|------|------|
| 初次體驗一堂 | NT$1,800 |
| 初次體驗一堂＋拳套 | NT$2,800 |
| Signature 四堂系統 | NT$3,800 |
| Signature 四堂＋專屬裝備 | NT$4,800 |
| Private Onboarding | 私訊詢問 |

## CTA 串接

- **購票連結**：修改 `siteConfig.ticketUrl`
- **LINE 官方帳號**：修改 `siteConfig.lineUrl`（目前指向 `https://page.line.me/488ujlbg`，官方帳號 `@488ujlbg`）

## 追蹤埋點

### 環境變數

複製 `.env.example` 為 `.env`，填入：

```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_META_PIXEL_ID=1234567890
```

### 預埋事件

| 事件 | 觸發時機 |
|------|---------|
| `hero_cta_click` | Hero 主 CTA |
| `secondary_cta_click` | 次 CTA |
| `ticket_view` | 票種區進入視窗 |
| `ticket_cta_click` | 票種 CTA |
| `faq_expand` | FAQ 展開 |
| `line_cta_click` | LINE CTA |
| `scroll_25/50/75/100` | 頁面滾動里程碑 |

### Data Attributes

- `data-section` — 每個 Section 的 ID
- `data-cta` — 按鈕類型標記
- `data-ticket` — 票種 ID
- `data-faq` — FAQ 項目 ID

## 技術棧

- React 19 + TypeScript
- Vite
- Tailwind CSS v3
- Framer Motion
- Zustand

## Advertising Tracking

Production browser tracking and server-side Meta CAPI are controlled by these variables:

```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_META_PIXEL_ID=1234567890
META_CAPI_ACCESS_TOKEN=EA...
META_GRAPH_API_VERSION=v21.0
META_TEST_EVENT_CODE=optional-meta-test-code
VITE_LINE_TAG_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_LINE_TAG_CUSTOMER_TYPE=lap
```

Primary conversion events:

| Event | Purpose |
| --- | --- |
| `ticket_view` | User reaches the unlocked offer area. |
| `gate_access_click` | User starts LINE Login / unlock flow. |
| `bootcamp_route_select` | User selects Boxing or Muay Thai / Kickboxing path. |
| `bootcamp_package_select` | User selects 2-session or 4-session Boot Camp package. |
| `course_purchase_click` | User clicks a concrete session purchase button. First-party/custom intent event. |
| `shopline_checkout_submit` | SHOPLINE checkout session is created successfully. Sent as Meta `InitiateCheckout`. |
| `line_cta_click` | User clicks LINE CTA. |
| `scroll_25/50/75/100` | Page-depth signals. |

Recommended ad-platform conversion setup:

| Platform signal | Use as |
| --- | --- |
| Meta `InitiateCheckout` from `shopline_checkout_submit` | Checkout-start optimization; fires only after SHOPLINE returns a usable checkout URL. |
| Meta CAPI `Purchase` from `POST /api/shopline/webhook` | Primary conversion after SHOPLINE confirms payment success. Requires `META_CAPI_ACCESS_TOKEN`. |
| Meta `Lead` from `gate_access_click`, `ticket_cta_click`, and plan CTAs | Secondary conversion / retargeting audience. |
| Meta `ViewContent` from ticket and Boot Camp route/package interest | Funnel audience, not the main optimization event. |

Meta Pixel events include `eventID`. Purchases use the local order `event_id` (`purchase.<referenceId>`) from the SHOPLINE webhook source of truth.

The same browser events are also posted to `POST /api/events` and stored in D1 as first-party anonymous funnel data. This lets `/admin` show page views, route/package selections, checkout starts, and other behavior without relying only on ad-platform dashboards.

### Homepage Destination Split Test

Meta ads can keep pointing to the current homepage URL while Cloudflare Pages decides the first page before HTML is rendered:

| Variant | Destination |
| --- | --- |
| `home` | `/` |
| `bootcamp` | `/boot-camp` |
| `event` | `/fight-night-event` |

Runtime variables:

```
LANDING_SPLIT_ENABLED=false
LANDING_SPLIT_ONLY_PAID=true
LANDING_SPLIT_EXPERIMENT_ID=home_destination_split_v1
LANDING_SPLIT_WEIGHTS=home:34,bootcamp:33,event:33
```

Use `?split=home`, `?split=bootcamp`, or `?split=event` to force a preview route without enabling the experiment. Use `?split=off` to bypass it. When enabled, the middleware only handles root document requests and keeps API, payment, admin, and static assets unchanged.

Each split visit sends `landing_split_arrival` and adds these fields to first-party events, LIFF access tracking, free-trial reservation tracking, and checkout tracking context: `experiment_id`, `experiment_variant`, `first_experiment_variant`, `split_visit_id`, `split_assignment_mode`, `split_original_path`, and `split_assigned_path`.

Traffic events also include `canonical_route_path`, so `/`, `/boot-camp`, and `/fight-night-event` can be compared in `/admin` without query-string fragmentation. `/admin` traffic now includes a Landing Split Test report for variant-level and section-level behavior.

## SHOPLINE Payments

Course purchase buttons now create a SHOPLINE Payments redirect checkout session through Cloudflare Pages Functions:

| Route | Purpose |
| --- | --- |
| `POST /api/shopline/checkout-session` | Creates a pending local order and requests a SHOPLINE checkout `sessionUrl`. |
| `POST /api/shopline/webhook` | Verifies SHOPLINE webhook signature and marks successful payments as paid. |
| `GET /api/shopline/order-status?referenceId=...` | Reads local order state and queries SHOPLINE as a fallback when the order is still pending. |
| `POST /api/shopline/reconcile-pending` | Admin-only compensation job. Scans recent pending/payment-processing/session-failed/paid/refund-processing orders, queries SHOPLINE, and reconciles paid/expired/failed/cancelled/refunded orders. |

Required production secrets:

```
SHOPLINE_API_KEY_DUNNAN=your_dunnan_api_key
SHOPLINE_WEBHOOK_SIGN_KEY_DUNNAN=your_dunnan_sign_key
SHOPLINE_API_KEY_TAICHUNG=your_taichung_api_key
SHOPLINE_WEBHOOK_SIGN_KEY_TAICHUNG=your_taichung_sign_key
SHOPLINE_API_KEY_NEIHU=your_neihu_api_key
SHOPLINE_WEBHOOK_SIGN_KEY_NEIHU=your_neihu_sign_key
SHOPLINE_API_BASE_URL=https://api.shoplinepayments.com
```

Venue merchant IDs are mapped in code and can be overridden by env vars:

```
SHOPLINE_MERCHANT_ID_DUNNAN=7510215296725291122
SHOPLINE_MERCHANT_ID_TAICHUNG=7510218907366723700
SHOPLINE_MERCHANT_ID_NEIHU=7511230868669859116
```

Optional:

```
META_CAPI_ACCESS_TOKEN=EA...
LINE_CHANNEL_ACCESS_TOKEN=your_line_messaging_api_channel_access_token
META_GRAPH_API_VERSION=v21.0
META_TEST_EVENT_CODE=optional-meta-test-code
SHOPLINE_PAYMENT_METHODS=CreditCard,ApplePay,LinePay
SHOPLINE_LANGUAGE=zh-TW
SHOPLINE_SESSION_EXPIRE_MINUTES=60
SHOPLINE_CREDIT_CARD_INSTALLMENTS=3,6
SHOPLINE_WEBHOOK_TOLERANCE_MS=900000
SHOPLINE_API_VERSION=V1.2
SHOPLINE_RECONCILE_LIMIT=40
SHOPLINE_RECONCILE_LOOKBACK_HOURS=48
SHOPLINE_REFUND_RECONCILE_LOOKBACK_HOURS=720
SHOPLINE_RECONCILE_MIN_AGE_SECONDS=90
```

`allowPaymentMethodList` is required by the SHOPLINE session API. If `SHOPLINE_PAYMENT_METHODS` is unset, the checkout uses `CreditCard,ApplePay,LinePay` by default. All three methods were verified by creating live SHOPLINE checkout sessions before launch.

Database setup:

```bash
wrangler d1 execute <database_name> --remote --file database/session_inventory.sql
wrangler d1 execute <database_name> --remote --file database/shopline_orders.sql
wrangler d1 execute <database_name> --remote --file database/customer_tracking.sql
```

Webhook URL to configure in SHOPLINE Payments:

```
https://<your-domain>/api/shopline/webhook
```

Each SHOPLINE Payments merchant should point to the same webhook URL and use the matching per-venue sign key. Subscribe to both checkout-session and trade events, at minimum `session.succeeded` and `trade.succeeded`; also include expired, failed, cancelled, pending/processing, void/reversal, and refund events when available. If SHOPLINE sends a refund/void/reversal event for a paid order, the webhook marks the order `refunded` and releases the seat.

Manual reconciliation:

```bash
curl -X POST https://<your-domain>/api/shopline/reconcile-pending \
  -H "x-admin-token: <ADMIN_TOKEN>"
```

Run this after changing SHOPLINE webhook event settings, or schedule an external/Worker cron to call it every 3-5 minutes. It is idempotent: already paid/refunded/locked orders are not double-counted. Seat increments are claimed before the order is finalized as paid, and full refunds discovered during reconciliation release the seat and mark the order as `refunded`.

Payment-complete LINE reservation cards:

- When an order becomes `paid`, the server pushes a LINE reservation confirmation card to the linked `line_user_id`.
- The card button uses a LINE `message` action. When the customer taps it, the Official Account chat receives a visible customer message containing venue, course, date/time, buyer name, buyer phone, and order id.
- The same notification helper is called from the SHOPLINE webhook, the order-status fallback query, and the manual reconciliation endpoint.
- `line_payment_notified_at` prevents duplicate card sends for the same order.
- If `LINE_CHANNEL_ACCESS_TOKEN` is missing, the order records `line_payment_notify_status = skipped_missing_token` and can be retried after the secret is configured.
- If the order has no linked LINE user, the order records `skipped_no_line_user`; manually linking a paid order in `/admin` will try the card again.

## Customer Tracking Admin

The admin dashboard is available at:

```
https://<your-domain>/admin
```

Required secret:

```
ADMIN_TOKEN=your_private_admin_token
```

Admin APIs:

| Route | Purpose |
| --- | --- |
| `GET /api/admin/summary` | Revenue, pending orders, attention statuses, 7-day event and LINE summary. |
| `GET /api/admin/orders` | SHOPLINE checkout customers, linked LINE user, and order status. |
| `GET /api/admin/inventory` | Per-session capacity, sold, and remaining seats. |
| `GET /api/admin/events` | Anonymous first-party funnel events written by `/api/events`. |
| `GET /api/admin/line-customers` | LINE users verified through LIFF access token, access counts, and linked payment status. |

The dashboard reads `ADMIN_TOKEN` from the browser input and sends it as `x-admin-token`. Do not expose this token in client-side environment variables.

Tracked first-party traffic attributes include source URL, referrer host, UTM parameters, ad click ID type/value, first landing path, new/returning session state, device type, browser, operating system, in-app browser, viewport/screen size, scroll depth, page duration, bounce state, section exposure, CTA clicks, Cloudflare country/region/city/colo, ASN, AS organization, HTTP protocol, and TLS version. These are trend and behavior signals for landing-page optimization, not person-level demographic identity.

## LINE LIFF Gate

The offer cards use LIFF login to unlock member-only content. The frontend first uses page-specific Vite build variables when present, then falls back to `GET /api/config`, which reads the Cloudflare Pages runtime variables. Fight Night event and Boot Camp pages must use their own LIFF IDs so login returns to the correct page instead of the homepage.

```
LINE_LIFF_ID=your_liff_id
EVENT_LINE_LIFF_ID=your_event_page_liff_id
BOOTCAMP_LINE_LIFF_ID=your_bootcamp_page_liff_id
LINE_LOGIN_CHANNEL_ID=your_line_login_channel_id
```

If the event or Boot Camp runtime value is missing, the frontend uses the page-specific fallback IDs configured in `useLiffGate.ts`. It does not fall back to the homepage LIFF ID for those pages.

When a logged-in LIFF user starts checkout, the browser sends the LINE user context with the SHOPLINE session request. New `course_orders` rows store `line_user_id`, LINE display name, picture URL, LINE email when LIFF provides it, friend flag, and raw line context so the admin dashboard can connect the paid order back to the LINE user. LINE email is stored separately from the SHOPLINE checkout buyer email because the two addresses can be different. If `LINE_LOGIN_CHANNEL_ID` is configured, the server verifies the LIFF ID token before marking the LINE email as verified. Orders created before this field existed may remain unlinked unless they are manually associated later.
