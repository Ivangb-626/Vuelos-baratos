import type { FlightResult } from '../types'

export const dedupeFlights = (flights: FlightResult[]): FlightResult[] => {
  const byKey = new Map<string, FlightResult>()

  for (const flight of flights) {
    const key = `${flight.originAirport}-${flight.destinationAirport}-${flight.departureDate}-${flight.airline}`
    const existing = byKey.get(key)

    if (!existing || flight.price < existing.price) {
      byKey.set(key, flight)
    }
  }

  return [...byKey.values()]
}

export const sortByPrice = (flights: FlightResult[]): FlightResult[] => [...flights].sort((a, b) => a.price - b.price)

export const filterFlights = (
  flights: FlightResult[],
  maxPrice?: number,
  maxStops?: number,
): FlightResult[] =>
  flights.filter((flight) => {
    if (typeof maxPrice === 'number' && flight.price > maxPrice) return false
    if (typeof maxStops === 'number' && flight.stops > maxStops) return false
    return true
  })

export const cheapestByDestination = (flights: FlightResult[]): Record<string, number> => {
  return flights.reduce<Record<string, number>>((acc, flight) => {
    const key = flight.destinationAirport
    if (!acc[key] || flight.price < acc[key]) {
      acc[key] = flight.price
    }
    return acc
  }, {})
}
