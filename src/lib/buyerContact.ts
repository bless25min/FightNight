export type SavedBuyerContact = {
  lineUserId?: string
  name: string
  phone: string
  email: string
}

type StoredBuyerContact = SavedBuyerContact & {
  updatedAt?: string
}

export const buyerContactStorageKey = 'ufcgym_buyer_contact'

function cleanLineUserId(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 128) : ''
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function cleanPhone(value: unknown) {
  const raw = cleanText(value, 32)
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('886')) {
    const nationalNumber = digits.slice(3)
    if (/^9\d{8}$/.test(nationalNumber)) return `0${nationalNumber}`
  }
  return raw
}

function isStoredContactForCurrentLineUser(
  storedLineUserId: unknown,
  currentLineUserId: string | null | undefined,
) {
  const stored = cleanLineUserId(storedLineUserId)
  const current = cleanLineUserId(currentLineUserId)

  if (!current) return false
  return stored === current
}

export function getSavedBuyerContact(lineUserId?: string | null): SavedBuyerContact | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(buyerContactStorageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredBuyerContact>
    if (!isStoredContactForCurrentLineUser(parsed.lineUserId, lineUserId)) {
      return null
    }

    const storedLineUserId = cleanLineUserId(parsed.lineUserId)
    const contact: SavedBuyerContact = {
      lineUserId: storedLineUserId || undefined,
      name: cleanText(parsed.name, 120),
      phone: cleanPhone(parsed.phone),
      email: cleanText(parsed.email, 320),
    }

    if (!contact.name && !contact.phone && !contact.email) return null
    return contact
  } catch {
    return null
  }
}

export function saveBuyerContact(
  contact: SavedBuyerContact,
  lineUserId?: string | null,
) {
  if (typeof window === 'undefined') return

  const storedLineUserId = cleanLineUserId(lineUserId || contact.lineUserId)
  if (!storedLineUserId) return

  const next: StoredBuyerContact = {
    lineUserId: storedLineUserId,
    name: cleanText(contact.name, 120),
    phone: cleanPhone(contact.phone),
    email: cleanText(contact.email, 320),
    updatedAt: new Date().toISOString(),
  }

  if (!next.name && !next.phone && !next.email) return

  try {
    window.localStorage.setItem(buyerContactStorageKey, JSON.stringify(next))
  } catch {
    // Saved contact only improves the next form; submission must still continue.
  }
}
