import { config } from 'dotenv'

config()

const parsedPort = Number(process.env.PORT ?? '8787')

export const appConfig = {
  port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 8787,
  cacheTtlMs: Number(process.env.API_CACHE_TTL_MS ?? '300000'),
  concurrency: Math.max(1, Number(process.env.API_CONCURRENCY ?? '4')),
  skyscanner: {
    baseUrl: (process.env.SKYSCANNER_API_BASE_URL ?? 'https://partners.api.skyscanner.net').replace(/\/$/, ''),
    searchPath: process.env.SKYSCANNER_SEARCH_ENDPOINT ?? '/apiservices/v3/flights/indicative/search',
    apiKey: process.env.SKYSCANNER_API_KEY,
    apiKeyHeader: process.env.SKYSCANNER_API_KEY_HEADER ?? 'x-api-key',
    market: process.env.SKYSCANNER_MARKET ?? 'ES',
    locale: process.env.SKYSCANNER_LOCALE ?? 'es-ES',
    currency: process.env.SKYSCANNER_CURRENCY ?? 'EUR',
  },
}
