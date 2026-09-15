import cors from 'cors'
import express from 'express'
import { appConfig } from './config.js'
import { FlightSearchService } from './services/flightSearchService.js'
import type { SearchRequest } from './types.js'

const app = express()
const service = new FlightSearchService()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/flights/search', async (req, res) => {
  try {
    const request = req.body as SearchRequest
    const data = await service.search(request)
    res.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(400).json({ error: message })
  }
})

app.listen(appConfig.port, () => {
  console.log(`API listening on http://localhost:${appConfig.port}`)
})
