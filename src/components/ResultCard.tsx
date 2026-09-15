import type { FlightResult } from '../types'

interface ResultCardProps {
  flight: FlightResult
  destinationBestPrice: number
}

const fmtDate = (value?: string): string => {
  if (!value) return 'N/D'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-ES')
}

export function ResultCard({ flight, destinationBestPrice }: ResultCardProps) {
  const isBest = flight.price === destinationBestPrice
  const difference = flight.price - destinationBestPrice

  return (
    <article className="result-card">
      <header>
        <p className="price">
          {Math.round(flight.price)} {flight.currency}
        </p>
        {isBest ? <span className="badge best">Más barato</span> : <span className="badge">+{Math.round(difference)} {flight.currency}</span>}
      </header>

      <h3>
        {flight.originAirport} → {flight.destinationAirport}
      </h3>
      <p>{flight.destinationCity}</p>
      <dl>
        <div>
          <dt>Salida</dt>
          <dd>{fmtDate(flight.departureDate)}</dd>
        </div>
        <div>
          <dt>Vuelta</dt>
          <dd>{fmtDate(flight.returnDate)}</dd>
        </div>
        <div>
          <dt>Duración</dt>
          <dd>{flight.durationDays ? `${flight.durationDays} días` : 'Flexible'}</dd>
        </div>
        <div>
          <dt>Escalas</dt>
          <dd>{flight.stops}</dd>
        </div>
        <div>
          <dt>Aerolínea</dt>
          <dd>{flight.airline}</dd>
        </div>
      </dl>

      {flight.deepLink ? (
        <a href={flight.deepLink} target="_blank" rel="noreferrer" className="booking-link">
          Continuar reserva
        </a>
      ) : null}
    </article>
  )
}
