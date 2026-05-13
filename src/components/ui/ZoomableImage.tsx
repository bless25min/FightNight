import { useEffect, useState } from 'react'

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in appearance-none border-0 bg-transparent p-0 text-left"
        aria-label={`放大查看：${alt}`}
      >
        <img src={src} alt={alt} className={className} loading={loading} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-[100] bg-abyss/95 p-3 backdrop-blur-md"
        >
          <button
            type="button"
            aria-label="關閉圖片"
            onClick={() => setOpen(false)}
            className="fixed right-3 top-3 z-[101] h-11 w-11 rounded-full border border-pearl/20 bg-black/70 text-xl font-heading text-pearl shadow-lg"
          >
            x
          </button>

          <button
            type="button"
            aria-label="關閉放大圖片"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-zoom-out"
          />

          <div className="relative z-[100] h-full w-full overflow-auto overscroll-contain">
            <div className="flex min-h-full min-w-full items-start justify-center px-1 py-14">
              <img
                src={src}
                alt={alt}
                className="h-auto w-[140vw] max-w-none rounded-xl border border-pearl/10 shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:w-[110vw] md:w-[92vw] xl:w-[1400px]"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
