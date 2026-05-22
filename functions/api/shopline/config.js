const DEFAULT_MERCHANT_IDS_BY_VENUE = {
  'venue-dunnan': '7510215296725291122',
  'venue-taichung': '7510218907366723700',
  'venue-neihu': '7511230868669859116',
}

const VENUE_ENV_SUFFIXES = {
  'venue-dunnan': 'DUNNAN',
  'venue-taichung': 'TAICHUNG',
  'venue-neihu': 'NEIHU',
}

function readVenueEnv(env, venueId, key) {
  const suffix = VENUE_ENV_SUFFIXES[venueId]
  if (!suffix) return undefined
  return env[`SHOPLINE_${key}_${suffix}`]
}

export function getShoplineConfigForVenue(env, venueId) {
  const merchantId =
    readVenueEnv(env, venueId, 'MERCHANT_ID') ||
    DEFAULT_MERCHANT_IDS_BY_VENUE[venueId] ||
    env.SHOPLINE_MERCHANT_ID
  const apiKey = readVenueEnv(env, venueId, 'API_KEY') || env.SHOPLINE_API_KEY
  const signKey =
    readVenueEnv(env, venueId, 'WEBHOOK_SIGN_KEY') ||
    env.SHOPLINE_WEBHOOK_SIGN_KEY

  return {
    venueId,
    merchantId,
    apiKey,
    signKey,
  }
}

export function getShoplineConfigs(env) {
  const venueConfigs = Object.keys(DEFAULT_MERCHANT_IDS_BY_VENUE).map((venueId) =>
    getShoplineConfigForVenue(env, venueId),
  )

  if (env.SHOPLINE_MERCHANT_ID) {
    venueConfigs.push({
      venueId: 'default',
      merchantId: env.SHOPLINE_MERCHANT_ID,
      apiKey: env.SHOPLINE_API_KEY,
      signKey: env.SHOPLINE_WEBHOOK_SIGN_KEY,
    })
  }

  const seen = new Set()
  return venueConfigs.filter((config) => {
    const key = config.merchantId || config.venueId
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function getShoplineConfigForMerchant(env, merchantId) {
  if (!merchantId) return null
  return (
    getShoplineConfigs(env).find(
      (config) => String(config.merchantId) === String(merchantId),
    ) || null
  )
}
