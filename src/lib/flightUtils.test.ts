import { describe, expect, it } from 'vitest'
import { cheapestByDestination, dedupeFlights, filterFlights, sortByPrice } from './flightUtils'
import type { FlightResult } from '../types'

const sampleFlights: FlightResult[] = [
  {
    id: '1',
    price: 52,
    currency: 'EUR',
    originAirport: 'FRA',
    destinationAirport: 'ROM',
    destinationCity: 'Roma',
    airline: 'Ryanair',
    stops: 0,
    departureDate: '2026-10-20',
    source: 'skyscanner',
  },
  {
    id: '2',
    price: 39,
    currency: 'EUR',
    originAirport: 'STR',
    destinationAirport: 'ROM',
    destinationCity: 'Roma',
    airline: 'Ryanair',
    stops: 0,
    departureDate: '2026-10-20',
    source: 'skyscanner',
  },
  {
    id: '3',
    price: 47,
    currency: 'EUR',
    originAirport: 'FRA',
    destinationAirport: 'ROM',
    destinationCity: 'Roma',
    airline: 'Ryanair',
    stops: 0,
    departureDate: '2026-10-20',
    source: 'skyscanner',
  },
]

describe('flightUtils', () => {
  it('deduplicates comparable flights by keeping cheapest', () => {
    const deduped = dedupeFlights(sampleFlights)
    expect(deduped).toHaveLength(2)
    expect(deduped.find((item) => item.originAirport === 'FRA')?.price).toBe(47)
  })

  it('sorts by ascending price', () => {
    const sorted = sortByPrice(sampleFlights)
    expect(sorted.map((item) => item.price)).toEqual([39, 47, 52])
  })

  it('applies max price and stop filters', () => {
    const filtered = filterFlights(sampleFlights, 47, 0)
    expect(filtered).toHaveLength(2)
  })

  it('calculates cheapest price per destination', () => {
    const map = cheapestByDestination(sampleFlights)
    expect(map.ROM).toBe(39)
  })
})
