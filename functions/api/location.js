const VENUE_LOCATIONS = [
  {
    id: 'venue-dunnan',
    latitude: 25.03931467772036,
    longitude: 121.54767441193627,
  },
  {
    id: 'venue-neihu',
    latitude: 25.079304677694402,
    longitude: 121.57099151193722,
  },
  {
    id: 'venue-taichung',
    latitude: 24.151235378309035,
    longitude: 120.66126771191507,
  },
]

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...init.headers,
    },
  })
}

function readNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function readText(value, maxLength = 80) {
  return String(value || '').trim().slice(0, maxLength) || null
}

function toRadians(value) {
  return (value * Math.PI) / 180
}

function distanceKm(from, to) {
  const earthRadiusKm = 6371
  const deltaLatitude = toRadians(to.latitude - from.latitude)
  const deltaLongitude = toRadians(to.longitude - from.longitude)
  const startLatitude = toRadians(from.latitude)
  const endLatitude = toRadians(to.latitude)

  const angle =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2)

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(angle), Math.sqrt(1 - angle))
}

function nearestVenue(location) {
  return VENUE_LOCATIONS.map((venue) => ({
    venueId: venue.id,
    distanceKm: distanceKm(location, venue),
  })).sort((a, b) => a.distanceKm - b.distanceKm)[0]
}

export async function onRequestGet({ request }) {
  const latitude = readNumber(request.cf?.latitude)
  const longitude = readNumber(request.cf?.longitude)
  const location = latitude !== null && longitude !== null
    ? { latitude, longitude }
    : null

  return json({
    location: {
      city: readText(request.cf?.city),
      region: readText(request.cf?.region),
      country: readText(request.cf?.country),
    },
    recommendation: location
      ? {
          ...nearestVenue(location),
          source: 'cloudflare',
        }
      : null,
  })
}
