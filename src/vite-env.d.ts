/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_META_PIXEL_ID?: string
  readonly VITE_LINE_TAG_ID?: string
  readonly VITE_LINE_LIFF_ID?: string
  readonly VITE_EVENT_LINE_LIFF_ID?: string
  readonly VITE_BOOTCAMP_LINE_LIFF_ID?: string
  readonly VITE_LINE_LOGIN_CHANNEL_ID?: string
  readonly VITE_LINE_LOGIN_REDIRECT_URI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
