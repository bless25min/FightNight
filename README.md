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
| 雙人同行體驗 | NT$3,200 |
| Signature 四堂系統 | NT$6,800 |
| Signature 四堂＋專屬裝備 | NT$8,800 |
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
