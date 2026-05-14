import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}

export function ZoomableImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
}: Props) {
  const [open, setOpen] = useState(false)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    if (!open) return

    const originalOverflow = document.body.style.overflow
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const modal =
    open && typeof document !== 'undefined' ? (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={alt}
        className="fixed inset-0 z-[100] bg-abyss/95 backdrop-blur-md"
      >
        <div className="fixed left-3 right-3 top-3 z-[102] flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label={zoomed ? '適合螢幕' : '放大圖片'}
            onClick={() => setZoomed((value) => !value)}
            data-interaction-hint
            className="interaction-hint rounded-full border border-pearl/20 bg-black/70 px-4 py-2 text-sm font-heading font-semibold text-pearl shadow-lg"
          >
            {zoomed ? '適合螢幕' : '放大'}
          </button>

          <button
            type="button"
            aria-label="關閉圖片"
            onClick={() => setOpen(false)}
            data-interaction-hint
            className="interaction-hint h-11 w-11 rounded-full border border-pearl/20 bg-black/70 text-xl font-heading text-pearl shadow-lg"
          >
            x
          </button>
        </div>

        <div
          className="absolute inset-0"
          role="button"
          tabIndex={-1}
          aria-label="關閉放大圖片"
          onClick={() => setOpen(false)}
        />

        <div className="relative z-[101] h-full w-full overflow-auto overscroll-contain p-3 pt-16">
          <div className="flex min-h-full min-w-full items-center justify-center">
            <button
              type="button"
              onClick={() => setZoomed((value) => !value)}
              data-interaction-hint
              className="interaction-hint image-interaction-hint cursor-zoom-in appearance-none border-0 bg-transparent p-0"
              aria-label={zoomed ? '適合螢幕' : '放大圖片'}
            >
              <img
                src={src}
                alt={alt}
                className={
                  zoomed
                    ? 'h-auto w-[160vw] max-w-none rounded-xl border border-pearl/10 shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:w-[125vw] md:w-[1200px]'
                    : 'max-h-[82vh] max-w-[96vw] rounded-xl border border-pearl/10 object-contain shadow-[0_30px_90px_rgba(0,0,0,0.55)]'
                }
              />
            </button>
          </div>
        </div>
      </div>
    ) : null

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setZoomed(false)
          setOpen(true)
        }}
        data-interaction-hint
        className="interaction-hint image-interaction-hint block w-full cursor-zoom-in appearance-none border-0 bg-transparent p-0 text-left"
        aria-label={`放大查看：${alt}`}
      >
        <img src={src} alt={alt} className={className} loading={loading} />
      </button>

      {modal && createPortal(modal, document.body)}
    </>
  )
}
