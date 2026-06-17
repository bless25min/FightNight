import { useEffect } from 'react'
import { toAbsoluteUrl } from '../lib/url'

type StructuredData = Record<string, unknown>

type SeoProps = {
  title: string
  description: string
  canonicalPath: string
  keywords?: string[]
  image?: string
  type?: 'website' | 'article'
  structuredData?: StructuredData | StructuredData[]
}

function upsertMeta(
  selector: string,
  attributes: Record<string, string>,
) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)

  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value)
  })
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  )

  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }

  element.href = href
}

function upsertJsonLd(data: StructuredData | StructuredData[]) {
  const id = 'ufcgym-page-jsonld'
  let element = document.getElementById(id) as HTMLScriptElement | null

  if (!element) {
    element = document.createElement('script')
    element.id = id
    element.type = 'application/ld+json'
    document.head.appendChild(element)
  }

  const payload = Array.isArray(data)
    ? { '@context': 'https://schema.org', '@graph': data }
    : { '@context': 'https://schema.org', ...data }

  element.textContent = JSON.stringify(payload)
}

export function Seo({
  title,
  description,
  canonicalPath,
  keywords = [],
  image,
  type = 'website',
  structuredData,
}: SeoProps) {
  useEffect(() => {
    const canonicalUrl = toAbsoluteUrl(canonicalPath)
    const imageUrl = image ? toAbsoluteUrl(image) : undefined

    document.title = title

    upsertMeta('meta[name="description"]', {
      name: 'description',
      content: description,
    })

    if (keywords.length > 0) {
      upsertMeta('meta[name="keywords"]', {
        name: 'keywords',
        content: keywords.join(', '),
      })
    }

    upsertMeta('meta[property="og:title"]', {
      property: 'og:title',
      content: title,
    })
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: description,
    })
    upsertMeta('meta[property="og:type"]', {
      property: 'og:type',
      content: type,
    })
    upsertMeta('meta[property="og:url"]', {
      property: 'og:url',
      content: canonicalUrl,
    })
    upsertMeta('meta[property="og:site_name"]', {
      property: 'og:site_name',
      content: 'UFCGYM TAIWAN',
    })
    upsertMeta('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: imageUrl ? 'summary_large_image' : 'summary',
    })
    upsertMeta('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: title,
    })
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: description,
    })

    if (imageUrl) {
      upsertMeta('meta[property="og:image"]', {
        property: 'og:image',
        content: imageUrl,
      })
      upsertMeta('meta[name="twitter:image"]', {
        name: 'twitter:image',
        content: imageUrl,
      })
    }

    upsertCanonical(canonicalUrl)

    if (structuredData) {
      upsertJsonLd(structuredData)
    }
  }, [
    canonicalPath,
    description,
    image,
    keywords,
    structuredData,
    title,
    type,
  ])

  return null
}
