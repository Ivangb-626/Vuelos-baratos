# Vuelos baratos (Skyscanner)

Aplicación web para descubrir vuelos baratos comparando múltiples aeropuertos de origen usando la API de Skyscanner desde un backend seguro.

## MVP implementado

- Selección de múltiples aeropuertos de origen por zona + lista personalizada.
- Búsqueda por destino concreto o **"Cualquier destino"**.
- Fechas flexibles: fecha concreta, rango, mes completo, fin de semana y período.
- Duración aproximada del viaje (mín/máx días) y número de pasajeros.
- Comparación inteligente entre orígenes, deduplicación y ordenación por precio.
- Filtros rápidos por precio máximo y número de escalas.
- Etiquetado de oportunidad de precio cuando la API devuelve referencia histórica.
- Capa de proveedor para desacoplar Skyscanner y permitir añadir otros proveedores.
- Caché en memoria y control básico de concurrencia para evitar peticiones innecesarias.

## Arquitectura

- **Frontend (`/src`)**: interfaz React + Vite.
- **Lógica de búsqueda y filtros (`/src/lib`)**: deduplicación, ordenación y filtros básicos.
- **Backend (`/server`)**: API Express y orquestación de búsquedas multi-origen.
- **Integración Skyscanner (`/server/providers`)**: adaptador con endpoint configurable.
- **Procesamiento/normalización (`/server/providers/skyscannerProvider.ts`)**: mapeo de respuesta a un modelo interno.
- **Secrets/API key**: solo en variables de entorno del backend (`.env`).

## Configuración

1. Copia `.env.example` a `.env`.
2. Rellena `SKYSCANNER_API_KEY` con tu API key real.
3. Si tu contrato de API usa rutas distintas, ajusta `SKYSCANNER_API_BASE_URL` y `SKYSCANNER_SEARCH_ENDPOINT`.

> Nota: no se exponen credenciales en el frontend.

## Ejecutar

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:8787`

## Comandos de verificación

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

## Limitaciones reales de API y extensibilidad

La API oficial puede variar por contrato (endpoints habilitados, campos históricos y cobertura de "anywhere").
El proyecto está diseñado para:

- soportar la búsqueda actual con los endpoints configurados;
- **no inventar históricos** cuando la API no los devuelve;
- permitir ampliar el proveedor para:
  - alertas de bajadas de precio,
  - seguimiento de rutas,
  - históricos enriquecidos,
  - cuentas de usuario,
  - notificaciones.
