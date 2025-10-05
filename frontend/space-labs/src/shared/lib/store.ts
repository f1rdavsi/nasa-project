import { create } from 'zustand'
import { fetchCurrentLocation, fetchHistorical, fetchPrediction, HistoricalRow, PredictionPoint } from './api'

export type PollutionState = {
  country?: string
  lat?: number
  lon?: number
  start: string
  end: string
  measurements: HistoricalRow[]
  predictions: PredictionPoint[]
  loading: boolean
  error?: string
  setRange: (start: string, end: string) => void
  setCountry: (country?: string) => void
  detectLocation: () => Promise<void>
  loadHistory: () => Promise<void>
  loadPrediction: () => Promise<void>
}

export const usePollutionStore = create<PollutionState>((set, get) => ({
  country: 'TJ',
  lat: undefined,
  lon: undefined,
  start: '',
  end: '',
  measurements: [],
  predictions: [],
  loading: false,
  error: undefined,

  setRange: (start, end) => set({ start, end }),
  setCountry: (country) => set({ country }),

  detectLocation: async () => {
    try {
      set({ loading: true, error: undefined })
      const loc = await fetchCurrentLocation()
      set({ lat: loc.lat, lon: loc.lon, country: loc.country })
    } catch (e: any) {
      set({ error: e?.message || 'Failed to detect location' })
    } finally {
      set({ loading: false })
    }
  },

  loadHistory: async () => {
    const { country, lat, lon, start, end } = get()
    if (!start || !end) return
    try {
      set({ loading: true, error: undefined })
      const res = await fetchHistorical({ country, lat, lon, start, end, page: 1, page_size: 1000 })
      const rows: HistoricalRow[] = (res.measurements || []).map((m) => ({
        date: m.date as unknown as string,
        aqi: m.aqi,
        aqi_category: m.aqi_category,
        pm25: m.pm25,
        pm10: m.pm10,
        no2: m.no2,
        o3: m.o3,
        so2: m.so2,
        co: m.co,
      }))
      set({ measurements: rows })
    } catch (e: any) {
      set({ error: e?.message || 'Failed to load history' })
    } finally {
      set({ loading: false })
    }
  },

  loadPrediction: async () => {
    const { country, lat, lon, start, end } = get()
    if (!start || !end) return
    try {
      set({ loading: true, error: undefined })
      const res = await fetchPrediction({ country, lat, lon, start, end, model: 'openrouter' })
      set({ predictions: res.predictions || [] })
    } catch (e: any) {
      set({ error: e?.message || 'Failed to load prediction' })
    } finally {
      set({ loading: false })
    }
  },
}))
