import type { FlightResult, SearchRequest } from '../types.js'

export interface FlightProvider {
  searchByOrigin(originAirport: string, request: SearchRequest): Promise<FlightResult[]>
}
