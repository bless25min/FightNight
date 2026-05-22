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
- **LINE 官方帳號**：修改 `siteConfig.lineUrl`（目前指向 `https://page.line.me/340uxvgb`）

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

Production tracking is controlled by Vite environment variables:

```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_META_PIXEL_ID=1234567890
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
| `course_purchase_click` | User clicks a concrete session purchase button. Sent as Meta `InitiateCheckout`. |
| `line_cta_click` | User clicks LINE CTA. |
| `scroll_25/50/75/100` | Page-depth signals. |

Recommended ad-platform conversion setup:

| Platform signal | Use as |
| --- | --- |
| Meta `InitiateCheckout` from `course_purchase_click` | Primary conversion until real payment confirmation exists. |
| Meta `Lead` from `gate_access_click`, `ticket_cta_click`, and plan CTAs | Secondary conversion / retargeting audience. |
| Meta `ViewContent` from ticket and Boot Camp route/package interest | Funnel audience, not the main optimization event. |
| Future `Purchase` | Fire only after payment succeeds, ideally from server/webhook. |

Meta Pixel events include `eventID` so a future Conversions API implementation can deduplicate browser and server events.

The same browser events are also posted to `POST /api/events` and stored in D1 as first-party anonymous funnel data. This lets `/admin` show page views, route/package selections, checkout starts, and other behavior without relying only on ad-platform dashboards.

## SHOPLINE Payments

Course purchase buttons now create a SHOPLINE Payments redirect checkout session through Cloudflare Pages Functions:

| Route | Purpose |
| --- | --- |
| `POST /api/shopline/checkout-session` | Creates a pending local order and requests a SHOPLINE checkout `sessionUrl`. |
| `POST /api/shopline/webhook` | Verifies SHOPLINE webhook signature and marks successful payments as paid. |
| `GET /api/shopline/order-status?referenceId=...` | Reads the local order state for `/payment/success`. |

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
SHOPLINE_PAYMENT_METHODS=CreditCard,ApplePay,LinePay
SHOPLINE_LANGUAGE=zh-TW
SHOPLINE_SESSION_EXPIRE_MINUTES=60
SHOPLINE_CREDIT_CARD_INSTALLMENTS=3,6
SHOPLINE_WEBHOOK_TOLERANCE_MS=900000
SHOPLINE_API_VERSION=V1.2
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
| `GET /api/admin/orders` | SHOPLINE checkout customers and order status. |
| `GET /api/admin/inventory` | Per-session capacity, sold, and remaining seats. |
| `GET /api/admin/events` | Anonymous first-party funnel events written by `/api/events`. |
| `GET /api/admin/line-customers` | LINE users verified through LIFF access token and their access counts. |

The dashboard reads `ADMIN_TOKEN` from the browser input and sends it as `x-admin-token`. Do not expose this token in client-side environment variables.

## LINE LIFF Gate

The offer cards use LIFF login to unlock member-only content. The frontend first uses `VITE_LINE_LIFF_ID` from the Vite build, then falls back to `GET /api/config`, which reads the Cloudflare Pages runtime variable:

```
LINE_LIFF_ID=your_liff_id
```

This fallback prevents a local `wrangler pages deploy dist` from accidentally shipping a bundle with no LIFF ID.
