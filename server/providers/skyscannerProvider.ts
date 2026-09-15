import { appConfig } from '../config.js'
import type { FlightResult, SearchRequest } from '../types.js'
import type { FlightProvider } from './types.js'

type AnyRecord = Record<string, unknown>

const asRecord = (value: unknown): AnyRecord | null => (value && typeof value === 'object' ? (value as AnyRecord) : null)

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const toDateCriteria = (request: SearchRequest): AnyRecord => {
  switch (request.dateMode) {
    case 'exact':
      return request.outboundDate ? { fixed_date: request.outboundDate } : {}
    case 'range':
    case 'period':
      return request.dateFrom && request.dateTo ? { date_range: { start_date: request.dateFrom, end_date: request.dateTo } } : {}
    case 'month':
      return request.month ? { whole_month: request.month } : {}
    case 'weekend':
      return request.dateFrom && request.dateTo
        ? { date_range: { start_date: request.dateFrom, end_date: request.dateTo }, weekend_only: true }
        : {}
    default:
      return {}
  }
}

const durationField = (request: SearchRequest): AnyRecord | undefined => {
  if (!request.minNights && !request.maxNights) {
    return undefined
  }

  return {
    min_days: request.minNights,
    max_days: request.maxNights,
  }
}

const inferDealTag = (price: number, reference?: number): string => {
  if (!reference || reference <= 0) {
    return 'Precio sin referencia histórica'
  }

  const ratio = price / reference
  if (ratio <= 0.6) return '🔥 Oferta excepcional'
  if (ratio <= 0.8) return 'Muy barato'
  if (ratio <= 0.95) return 'Buen precio'
  return 'Precio normal'
}

const findPlaceName = (places: AnyRecord, placeId: string): string => {
  const place = asRecord(places[placeId])
  return typeof place?.name === 'string' ? place.name : placeId
}

const buildFlightId = (origin: string, destination: string, departureDate: string, airline: string): string =>
  `${origin}-${destination}-${departureDate}-${airline}`

const parseLegRef = (
  legRef: AnyRecord | null,
  places: AnyRecord,
  carriers: AnyRecord,
): Pick<FlightResult, 'originAirport' | 'destinationAirport' | 'destinationCity' | 'airline' | 'stops' | 'departureDate' | 'returnDate'> => {
  const originPlace = typeof legRef?.originPlaceId === 'string' ? legRef.originPlaceId : 'N/A'
  const destinationPlace = typeof legRef?.destinationPlaceId === 'string' ? legRef.destinationPlaceId : 'N/A'
  const carrierId = typeof legRef?.marketingCarrierId === 'string' ? legRef.marketingCarrierId : ''
  const carrier = asRecord(carriers[carrierId])
  const segments = asArray(legRef?.segmentIds)

  return {
    originAirport: findPlaceName(places, originPlace),
    destinationAirport: findPlaceName(places, destinationPlace),
    destinationCity: findPlaceName(places, destinationPlace),
    airline: typeof carrier?.name === 'string' ? carrier.name : 'Desconocida',
    stops: Math.max(0, segments.length - 1),
    departureDate: typeof legRef?.departureDateTime === 'string' ? legRef.departureDateTime : '',
    returnDate: typeof legRef?.arrivalDateTime === 'string' ? legRef.arrivalDateTime : undefined,
  }
}

export class SkyscannerProvider implements FlightProvider {
  private readonly apiKey: string

  constructor() {
    if (!appConfig.skyscanner.apiKey) {
      throw new Error('Missing SKYSCANNER_API_KEY')
    }
    this.apiKey = appConfig.skyscanner.apiKey
  }

  async searchByOrigin(originAirport: string, request: SearchRequest): Promise<FlightResult[]> {
    const destination =
      request.destinationType === 'anywhere'
        ? { anywhere: true }
        : { iata: (request.destination ?? '').trim().toUpperCase() }

    const body: AnyRecord = {
      query: {
        market: appConfig.skyscanner.market,
        locale: appConfig.skyscanner.locale,
        currency: appConfig.skyscanner.currency,
        adults: request.passengers,
        query_legs: [
          {
            origin_place_id: { iata: originAirport },
            destination_place_id: destination,
            date: toDateCriteria(request),
            ...(durationField(request) ? { stay_length: durationField(request) } : {}),
          },
        ],
      },
    }

    const url = `${appConfig.skyscanner.baseUrl}${appConfig.skyscanner.searchPath}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [appConfig.skyscanner.apiKeyHeader]: this.apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Skyscanner error ${response.status}: ${text.slice(0, 400)}`)
    }

    const payload = (await response.json()) as AnyRecord
    const data = asRecord(payload.content) ?? payload
    const itineraries = asRecord(data.itineraries) ?? asRecord(data.results) ?? {}
    const legs = asRecord(data.legs) ?? {}
    const places = asRecord(data.places) ?? {}
    const carriers = asRecord(data.carriers) ?? {}

    return Object.values(itineraries)
      .map((item) => asRecord(item))
      .filter((item): item is AnyRecord => Boolean(item))
      .map((itinerary) => {
        const pricing = asRecord(itinerary.pricingOptions) ?? asRecord(itinerary.pricing_options) ?? itinerary
        const amount =
          typeof pricing.amount === 'number'
            ? pricing.amount
            : typeof itinerary.price === 'number'
              ? itinerary.price
              : Number.NaN

        const legIds = asArray(itinerary.legIds).filter((id): id is string => typeof id === 'string')
        const firstLeg = legIds.length > 0 ? asRecord(legs[legIds[0]]) : null
        const parsedLeg = parseLegRef(firstLeg, places, carriers)
        const departureDate = parsedLeg.departureDate || request.outboundDate || request.dateFrom || ''

        const result: FlightResult = {
          id: buildFlightId(originAirport, parsedLeg.destinationAirport, departureDate, parsedLeg.airline),
          price: Number.isFinite(amount) ? amount : Number.MAX_SAFE_INTEGER,
          currency: appConfig.skyscanner.currency,
          originAirport: parsedLeg.originAirport || originAirport,
          destinationAirport: parsedLeg.destinationAirport,
          destinationCity: parsedLeg.destinationCity,
          airline: parsedLeg.airline,
          stops: parsedLeg.stops,
          departureDate,
          returnDate: parsedLeg.returnDate,
          durationDays: request.minNights,
          deepLink: typeof itinerary.deepLink === 'string' ? itinerary.deepLink : undefined,
          source: 'skyscanner',
        }

        const historicalMedian =
          typeof itinerary.historicalMedianPrice === 'number' ? itinerary.historicalMedianPrice : undefined
        const tag = inferDealTag(result.price, historicalMedian)

        return {
          ...result,
          destinationCity: `${result.destinationCity} (${tag})`,
        }
      })
      .filter((result) => Number.isFinite(result.price) && result.price !== Number.MAX_SAFE_INTEGER)
  }
}
