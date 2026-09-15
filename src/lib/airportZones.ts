export interface AirportZone {
  id: string
  label: string
  airports: string[]
}

export const airportZones: AirportZone[] = [
  {
    id: 'southwest-germany',
    label: 'Mannheim + Frankfurt + Stuttgart + Karlsruhe',
    airports: ['MHG', 'FRA', 'STR', 'FKB'],
  },
  {
    id: 'germany-main',
    label: 'Alemania (principales)',
    airports: ['FRA', 'MUC', 'BER', 'DUS', 'HAM', 'CGN', 'STR', 'FKB'],
  },
  {
    id: 'spain-main',
    label: 'España (principales)',
    airports: ['MAD', 'BCN', 'VLC', 'AGP', 'SVQ', 'BIO', 'PMI'],
  },
  {
    id: 'custom',
    label: 'Lista personalizada',
    airports: [],
  },
]
