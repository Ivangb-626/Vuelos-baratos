export type DateMode = 'exact' | 'range' | 'month' | 'weekend' | 'period'

export interface SearchRequest {
  originAirports: string[]
  destinationType: 'specific' | 'anywhere'
  destination?: string
  dateMode: DateMode
  outboundDate?: string
  dateFrom?: string
  dateTo?: string
  month?: string
  minNights?: number
  maxNights?: number
  passengers: number
}

export interface FlightResult {
  id: string
  price: number
  currency: string
  originAirport: string
  destinationAirport: string
  destinationCity: string
  airline: string
  stops: number
  departureDate: string
  returnDate?: string
  durationDays?: number
  deepLink?: string
  source: 'skyscanner'
}

export interface SearchResponse {
  results: FlightResult[]
  partialErrors: string[]
}
