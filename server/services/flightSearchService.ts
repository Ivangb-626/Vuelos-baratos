import { appConfig } from '../config.js'
import { SkyscannerProvider } from '../providers/skyscannerProvider.js'
import type { FlightProvider } from '../providers/types.js'
import type { FlightResult, SearchRequest, SearchResponse } from '../types.js'

class InMemoryCache {
  private readonly cache = new Map<string, { expiresAt: number; value: SearchResponse }>()

  get(key: string): SearchResponse | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: SearchResponse): void {
    this.cache.set(key, {
      expiresAt: Date.now() + appConfig.cacheTtlMs,
      value,
    })
  }
}

const cache = new InMemoryCache()

const dedupeAndSort = (results: FlightResult[]): FlightResult[] => {
  const map = new Map<string, FlightResult>()

  for (const flight of results) {
    const key = `${flight.originAirport}-${flight.destinationAirport}-${flight.departureDate}-${flight.airline}`
    const existing = map.get(key)
    if (!existing || flight.price < existing.price) {
      map.set(key, flight)
    }
  }

  return [...map.values()].sort((a, b) => a.price - b.price)
}

const sanitizeIata = (code: string): string => code.trim().toUpperCase()

const validateRequest = (request: SearchRequest): SearchRequest => {
  const originAirports = request.originAirports.map(sanitizeIata).filter((value) => value.length >= 3)
  if (originAirports.length === 0) {
    throw new Error('Selecciona al menos un aeropuerto de origen')
  }

  if (request.destinationType === 'specific') {
    const destination = sanitizeIata(request.destination ?? '')
    if (!destination) {
      throw new Error('Indica un destino o selecciona "Cualquier destino"')
    }
    return { ...request, originAirports, destination }
  }

  return { ...request, originAirports }
}

const runWithConcurrency = async <T>(
  values: string[],
  worker: (value: string) => Promise<T>,
  concurrency: number,
): Promise<PromiseSettledResult<T>[]> => {
  const results: PromiseSettledResult<T>[] = []
  let index = 0

  const runners = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (index < values.length) {
      const currentIndex = index
      index += 1
      try {
        const data = await worker(values[currentIndex])
        results[currentIndex] = { status: 'fulfilled', value: data }
      } catch (error) {
        results[currentIndex] = { status: 'rejected', reason: error }
      }
    }
  })

  await Promise.all(runners)
  return results
}

export class FlightSearchService {
  private provider: FlightProvider | null

  constructor(provider: FlightProvider | null = null) {
    this.provider = provider
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    if (!this.provider) {
      this.provider = new SkyscannerProvider()
    }
    const provider = this.provider

    const normalizedRequest = validateRequest(request)
    const cacheKey = JSON.stringify(normalizedRequest)
    const cached = cache.get(cacheKey)

    if (cached) {
      return cached
    }

    const settled = await runWithConcurrency(
      normalizedRequest.originAirports,
      (originAirport) => provider.searchByOrigin(originAirport, normalizedRequest),
      appConfig.concurrency,
    )

    const results: FlightResult[] = []
    const partialErrors: string[] = []

    settled.forEach((item, idx) => {
      if (item?.status === 'fulfilled') {
        results.push(...item.value)
      }
      if (item?.status === 'rejected') {
        partialErrors.push(`Error en ${normalizedRequest.originAirports[idx]}: ${String(item.reason)}`)
      }
    })

    const response: SearchResponse = {
      results: dedupeAndSort(results),
      partialErrors,
    }

    cache.set(cacheKey, response)
    return response
  }
}

export const __internal = {
  dedupeAndSort,
}
