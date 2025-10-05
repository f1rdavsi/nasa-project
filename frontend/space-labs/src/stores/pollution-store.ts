import { create } from 'zustand'
import { api } from '@/shared/lib/api'

interface Location {
  city?: string
  country?: string
  lat?: number
  lon?: number
}

interface Pollution {
  aqi: number
  pm25: number
  pm10: number
  no2: number
  o3: number
  so2: number
  co: number
}

interface PollutionState {
  location: Location | null
  pollution: Pollution | null
  isLoading: boolean
  error: string | null
  fetchCurrentPollution: () => Promise<void>
}

export const usePollutionStore = create<PollutionState>(set => ({
  location: null,
  pollution: null,
  isLoading: false,
  error: null,

  fetchCurrentPollution: async () => {
    set({ isLoading: true, error: null })
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error('Geolocation not supported'))
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      const { latitude, longitude } = position.coords

      const response = await api.get('/api/location/current', {
        params: { lat: latitude, lon: longitude },
      })

      const { city, country, lat, lon } = response.data

      set({ location: { city, country, lat, lon } })

      const pollutionResp = await api.get('/api/pollution/current/location', {
        params: { lat, lon },
      })

      set({ pollution: pollutionResp.data })
    } catch (err: any) {
      console.error(err)
      set({ error: err.message || 'Failed to load pollution data' })
    } finally {
      set({ isLoading: false })
    }
  },
}))
