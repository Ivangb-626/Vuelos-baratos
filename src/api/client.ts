import type { SearchPayload, SearchResponse } from '../types'

export const searchFlights = async (payload: SearchPayload): Promise<SearchResponse> => {
  const response = await fetch('/api/flights/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'No se pudo consultar la API de vuelos')
  }

  return (await response.json()) as SearchResponse
}
