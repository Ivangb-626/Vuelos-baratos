import { useMemo, useState } from 'react'
import { searchFlights } from './api/client'
import { ResultCard } from './components/ResultCard'
import { airportZones } from './lib/airportZones'
import { cheapestByDestination, dedupeFlights, filterFlights, sortByPrice } from './lib/flightUtils'
import type { DateMode, FlightResult, SearchPayload } from './types'
import './App.css'

const parseAirports = (value: string): string[] =>
  value
    .split(',')
    .map((airport) => airport.trim().toUpperCase())
    .filter((airport) => airport.length >= 3)

function App() {
  const [zone, setZone] = useState(airportZones[0].id)
  const [customAirports, setCustomAirports] = useState('')
  const [destinationType, setDestinationType] = useState<'specific' | 'anywhere'>('anywhere')
  const [destination, setDestination] = useState('')
  const [dateMode, setDateMode] = useState<DateMode>('range')
  const [outboundDate, setOutboundDate] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [month, setMonth] = useState('')
  const [minNights, setMinNights] = useState(2)
  const [maxNights, setMaxNights] = useState(5)
  const [passengers, setPassengers] = useState(1)
  const [maxPrice, setMaxPrice] = useState<number | undefined>()
  const [maxStops, setMaxStops] = useState<number | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [partialErrors, setPartialErrors] = useState<string[]>([])
  const [results, setResults] = useState<FlightResult[]>([])

  const selectedAirports = useMemo(() => {
    const selectedZone = airportZones.find((item) => item.id === zone)
    const combined = [...(selectedZone?.airports ?? []), ...parseAirports(customAirports)]
    return [...new Set(combined)]
  }, [zone, customAirports])

  const destinationBestPrices = useMemo(() => cheapestByDestination(results), [results])

  const filteredResults = useMemo(
    () => sortByPrice(filterFlights(dedupeFlights(results), maxPrice, maxStops)),
    [results, maxPrice, maxStops],
  )

  const submitSearch = async () => {
    setLoading(true)
    setError('')
    setPartialErrors([])

    const payload: SearchPayload = {
      originAirports: selectedAirports,
      destinationType,
      destination: destinationType === 'specific' ? destination : undefined,
      dateMode,
      outboundDate: dateMode === 'exact' ? outboundDate : undefined,
      dateFrom: ['range', 'weekend', 'period'].includes(dateMode) ? dateFrom : undefined,
      dateTo: ['range', 'weekend', 'period'].includes(dateMode) ? dateTo : undefined,
      month: dateMode === 'month' ? month : undefined,
      minNights,
      maxNights,
      passengers,
    }

    try {
      const response = await searchFlights(payload)
      setResults(response.results)
      setPartialErrors(response.partialErrors)
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Error desconocido')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="layout">
      <section className="panel">
        <h1>Vuelos baratos con Skyscanner</h1>
        <p>Compara múltiples aeropuertos de origen y descubre oportunidades por precio.</p>

        <div className="grid">
          <label>
            Zona de origen
            <select value={zone} onChange={(event) => setZone(event.target.value)}>
              {airportZones.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Aeropuertos personalizados (IATA, separados por coma)
            <input
              type="text"
              value={customAirports}
              onChange={(event) => setCustomAirports(event.target.value)}
              placeholder="FRA, STR, FKB"
            />
          </label>

          <label>
            Destino
            <select value={destinationType} onChange={(event) => setDestinationType(event.target.value as 'specific' | 'anywhere')}>
              <option value="anywhere">Cualquier destino</option>
              <option value="specific">Destino concreto</option>
            </select>
          </label>

          {destinationType === 'specific' ? (
            <label>
              IATA destino
              <input
                type="text"
                value={destination}
                onChange={(event) => setDestination(event.target.value.toUpperCase())}
                placeholder="ROM"
              />
            </label>
          ) : null}

          <label>
            Modo de fechas
            <select value={dateMode} onChange={(event) => setDateMode(event.target.value as DateMode)}>
              <option value="exact">Fecha concreta</option>
              <option value="range">Rango</option>
              <option value="month">Mes completo</option>
              <option value="weekend">Fin de semana</option>
              <option value="period">Cualquier fecha del período</option>
            </select>
          </label>

          {dateMode === 'exact' ? (
            <label>
              Fecha de salida
              <input type="date" value={outboundDate} onChange={(event) => setOutboundDate(event.target.value)} />
            </label>
          ) : null}

          {['range', 'weekend', 'period'].includes(dateMode) ? (
            <>
              <label>
                Desde
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
              </label>
              <label>
                Hasta
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
              </label>
            </>
          ) : null}

          {dateMode === 'month' ? (
            <label>
              Mes
              <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            </label>
          ) : null}

          <label>
            Duración mínima (días)
            <input type="number" min={1} value={minNights} onChange={(event) => setMinNights(Number(event.target.value))} />
          </label>

          <label>
            Duración máxima (días)
            <input type="number" min={1} value={maxNights} onChange={(event) => setMaxNights(Number(event.target.value))} />
          </label>

          <label>
            Pasajeros
            <input type="number" min={1} value={passengers} onChange={(event) => setPassengers(Number(event.target.value))} />
          </label>
        </div>

        <div className="chips">
          {selectedAirports.map((airport) => (
            <span key={airport}>{airport}</span>
          ))}
        </div>

        <button onClick={() => void submitSearch()} disabled={loading || selectedAirports.length === 0}>
          {loading ? 'Buscando...' : 'Buscar vuelos'}
        </button>

        {error ? <p className="error">{error}</p> : null}
        {partialErrors.length > 0 ? (
          <ul className="warn-list">
            {partialErrors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="panel">
        <h2>Filtros rápidos</h2>
        <div className="grid">
          <label>
            Precio máximo
            <input
              type="number"
              min={0}
              value={maxPrice ?? ''}
              onChange={(event) => setMaxPrice(event.target.value ? Number(event.target.value) : undefined)}
            />
          </label>

          <label>
            Escalas máximas
            <input
              type="number"
              min={0}
              value={maxStops ?? ''}
              onChange={(event) => setMaxStops(event.target.value ? Number(event.target.value) : undefined)}
            />
          </label>
        </div>

        <h2>Resultados ({filteredResults.length})</h2>
        <div className="results-grid">
          {filteredResults.map((flight) => (
            <ResultCard
              key={flight.id}
              flight={flight}
              destinationBestPrice={destinationBestPrices[flight.destinationAirport] ?? flight.price}
            />
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
