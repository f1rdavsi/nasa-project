import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  try {
    // eslint-disable-next-line no-console
    console.log('[API →]', config.method?.toUpperCase(), `${config.baseURL}${config.url}`, config.params || config.data)
  } catch {}
  return config
})
api.interceptors.response.use((response) => {
  try {
    // eslint-disable-next-line no-console
    console.log('[API ←]', response.status, response.config.url, response.data)
  } catch {}
  return response
})

export type HistoricalRow = {
  date: string
  pm25?: number
  pm10?: number
  no2?: number
  o3?: number
  so2?: number
  co?: number
  aqi: number
  aqi_category?: string
}

export type PredictionPoint = {
  date: string
  predicted_aqi: number
  category: string
  confidence?: { low_80: number; high_80: number; low_95: number; high_95: number }
}

export const fetchCurrentLocation = async () => {
  const { data } = await api.get('/api/location/current')
  return data as { city?: string; country?: string; lat: number; lon: number }
}

export const fetchCurrentPollutionByCoords = async (params: {
  lat: number
  lon: number
  radius_m?: number
}) => {
  const { data } = await api.get('/api/pollution/current/location', { params })
  return data as {
    location: { lat: number; lon: number; radius_m: number }
    measurements: { parameter: string; value: number; unit: string; last_updated: string }[]
    aqi: number
    aqi_category: string
    aqi_breakdown: Record<string, number>
    last_updated: string
    station_count: number
  }
}

export const fetchHistorical = async (params: {
  country?: string
  lat?: number
  lon?: number
  start: string
  end: string
  page?: number
  page_size?: number
}) => {
  const { data } = await api.get('/api/pollution/history', { params })
  return data as {
    location: any
    range: { start: string; end: string }
    measurements: HistoricalRow[]
    total_count: number
    page: number
    page_size: number
  }
}

export const fetchPrediction = async (params: {
  country?: string
  lat?: number
  lon?: number
  start: string
  end: string
  model?: string
}) => {
  const { data } = await api.get('/api/pollution/predict', { params })
  return data as {
    predictions: PredictionPoint[]
    alerts: any[]
    meta: any
  }
}


