# UFC GYM Taiwan Course Booking

This repository contains the production landing and booking system for the UFC
GYM Taiwan course reservation flow.

The site is a Cloudflare Pages application with React/Vite frontend pages,
Cloudflare Pages Functions APIs, D1-backed order/event storage, SHOPLINE
checkout handoff, Meta conversion tracking, LINE confirmation support, and an
operations admin dashboard.

## Repository Status

This is a private production repository.

Do not make this repository public without creating a sanitized copy first. The
codebase contains client-specific business logic, official brand assets, coach
materials, campaign drafts, payment flow details, tracking logic, admin routes,
and database schema. Secret values are not supposed to be committed, but the
implementation itself still exposes enough operational detail to be treated as
confidential.

If a public portfolio version is needed, create a separate repository that only
contains a de-identified frontend demo or static case study.

## Production Context

- Production domain: `https://booking.ufcgym.com.tw`
- Hosting: Cloudflare Pages
- Runtime APIs: Cloudflare Pages Functions
- Database: Cloudflare D1
- Payment provider: SHOPLINE Payments
- Conversion tracking: Meta Pixel and Meta Conversions API
- Post-booking confirmation: LINE Official Account flow
- Admin surface: `/admin`

## User Flow

1. Ad or social traffic lands on the official booking page.
2. User selects a venue, course, date, and entry option.
3. Paid course users fill buyer details and start SHOPLINE checkout.
4. SHOPLINE redirects back to the payment result page.
5. Server-side webhook or fallback reconciliation confirms payment status.
6. Meta Purchase is emitted from paid order truth.
7. User is prompted to confirm registration with the official LINE channel.
8. Free trial users fill reservation details and are routed to the same
   confirmation handoff pattern.

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Primary public booking landing page |
| `/offers` | Course offer and booking flow |
| `/payment/success` | Payment result and confirmation CTA |
| `/privacy-policy` | Privacy policy |
| `/terms-of-service` | Terms of service |
| `/refund-policy` | Refund and cancellation policy |
| `/admin` | Internal operations dashboard |

SEO guide routes live under `/guides/*`.

## Project Structure

```text
src/
  assets/                 Frontend images and static visual assets
  components/             Shared UI, sections, layout, and booking controls
  data/                   Landing copy, venue data, schedule, coach profiles
  hooks/                  Tracking, locale, session availability, scroll state
  lib/                    Analytics, checkout tracking, URL and route helpers
  pages/                  Public pages, admin page, policy pages, result page
  store/                  UI state
  types/                  Shared TypeScript types

functions/
  _middleware.js          Domain redirects and server-rendered metadata updates
  api/                    Cloudflare Pages Functions APIs

database/
  *.sql                   D1 table setup and migration reference

public/
  robots.txt, sitemap.xml, icons, public OG/recovery assets
```

Temporary creative work, generated ad drafts, recovered production bundles, and
local previews should not be treated as public release material.

## Local Development

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

Preview the built frontend locally:

```bash
npm run preview
```

Cloudflare Pages Functions require the Pages runtime and configured bindings for
full end-to-end behavior. Local Vite preview does not fully emulate D1,
SHOPLINE, Meta CAPI, or LINE push behavior.

## Environment Configuration

Production configuration belongs in Cloudflare Pages environment variables and
secrets. Do not commit secret values.

Public or non-secret runtime variables include:

```text
PUBLIC_ORIGIN
VITE_META_PIXEL_ID
META_PIXEL_ID
VITE_LINE_LIFF_ID
LINE_LIFF_ID
VITE_LINE_TAG_CUSTOMER_TYPE
LANDING_SPLIT_ENABLED
LANDING_SPLIT_ONLY_PAID
LANDING_SPLIT_EXPERIMENT_ID
LANDING_SPLIT_WEIGHTS
```

Secret values include:

```text
ADMIN_TOKEN
META_CAPI_ACCESS_TOKEN
LINE_CHANNEL_ACCESS_TOKEN
SHOPLINE_API_KEY_*
SHOPLINE_WEBHOOK_SIGN_KEY_*
```

Payment provider configuration may also include merchant identifiers and
provider-specific options. Keep real values in Cloudflare, not in public docs.

## Data And Tracking

The system keeps these layers separate:

- Browser tracking: frontend analytics and Meta Pixel events.
- First-party event storage: `POST /api/events` writes anonymous funnel events
  to D1 for admin reporting.
- Checkout intent: course selection and buyer details create a local pending
  order before redirecting to SHOPLINE.
- Payment truth: webhook, payment result fallback, and admin reconciliation
  update local order status.
- Meta Purchase truth: server-side Purchase is emitted only from paid order
  confirmation logic.
- LINE confirmation: confirmation messages are sent only when the order or free
  reservation has the required LINE context and messaging token.

Do not change event names, order status transitions, webhook verification, or
Purchase emission logic without checking both browser events and server-side
Meta CAPI behavior.

## Admin Dashboard

The admin page is intended for internal operations only.

It reads an operator-provided `ADMIN_TOKEN` in the browser and sends it as an
admin request header. The token must never be exposed through Vite client
environment variables or committed into the repository.

The dashboard covers:

- Version history and conversion impact.
- Orders and buyer follow-up state.
- Inventory and session capacity.
- Funnel events and route attribution.
- LINE customer and recovery workflows.

## Deployment Notes

The production build output is `dist/`, configured through `wrangler.toml`.

Before deployment:

1. Run `npm run build`.
2. Confirm the production environment variables and secrets are set in
   Cloudflare Pages.
3. Confirm `PUBLIC_ORIGIN`, sitemap, robots, canonical URL, and Open Graph URLs
   use the production domain.
4. Confirm SHOPLINE webhook and return URLs point to the intended production
   domain.
5. Confirm Meta Events Manager receives PageView, Lead, AddToCart,
   InitiateCheckout, and Purchase events from the production domain.
6. Confirm the payment result page and LINE confirmation CTA work on the
   production domain.

## Security And Public Release Checklist

Before sharing code outside the project team:

- Remove or replace official UFC GYM assets unless explicit permission exists.
- Remove coach screenshots, coach photos, temporary product images, generated ad
  drafts, failed creative drafts, and recovered production bundles.
- Remove `ad-temp/`, `tmp/`, `offline-preview/`, local server PID/port files, and
  other non-source artifacts.
- Remove real domains, tracking IDs, LIFF IDs, D1 IDs, merchant IDs, webhook
  details, and admin route documentation from the public copy.
- Remove or mock payment, webhook, admin, D1, LINE push, and Meta CAPI code if
  the public version is only for portfolio display.
- Create a fresh public repository instead of changing this production repo to
  public, because old commit history can still reveal removed material.

## Operational Boundaries

Treat these areas as protected business infrastructure:

- Meta Pixel and Meta CAPI
- LINE and LIFF identity handling
- SHOPLINE checkout and webhook verification
- D1 order, inventory, and tracking schema
- Admin dashboard and admin APIs
- Payment result page
- Confirmation and follow-up messages
- SEO metadata, canonical URLs, Open Graph tags, sitemap, and robots rules

Changes in these areas should be verified with a production-like flow, not only
with local UI inspection.

## Troubleshooting Notes

- Opening `index.html` through `file://` will not work for this Vite app. Use a
  local dev server instead.
- A successful frontend build does not prove payment, webhook, D1, Meta CAPI, or
  LINE push behavior. Those require runtime bindings and provider credentials.
- If the official domain changes, update Cloudflare Pages custom domains,
  `PUBLIC_ORIGIN`, sitemap, robots, canonical URLs, OG URLs, SHOPLINE webhook
  settings, and Meta domain verification before sending ads to review.
- If Meta review flags inconsistency, compare the page as a normal browser and
  as Meta crawler traffic, then check redirects, canonical URLs, OG tags,
  ad-account/page ownership, and advertiser transparency settings.
