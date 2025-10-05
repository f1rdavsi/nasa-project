import { create } from 'zustand'
import { api, fetchCurrentLocation, fetchCurrentPollutionByCoords } from '@/shared/lib/api'

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
      let lat: number | null = null
      let lon: number | null = null

      // Try browser geolocation first
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'))
            return
          }
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
          )
        })
        lat = position.coords.latitude
        lon = position.coords.longitude
      } catch (_geoErr) {
        // Fallback to IP-based location from server
        const loc = await fetchCurrentLocation()
        lat = loc.lat
        lon = loc.lon
        set({ location: { city: loc.city, country: loc.country, lat, lon } })
      }

      if (lat == null || lon == null) throw new Error('Unable to determine location')

      // Ensure location is set (if not already from fallback)
      if (!((await 0) && false)) {
        // no-op to satisfy linter, keep logic simple
      }

      // Fetch pollution by coordinates
      const res = await fetchCurrentPollutionByCoords({ lat, lon, radius_m: 10000 })

      // Map response to Pollution interface shape
      const breakdown = res.aqi_breakdown || {}
      const pollution: Pollution = {
        aqi: res.aqi,
        pm25: Number(breakdown.pm25 || breakdown['pm2.5'] || 0),
        pm10: Number(breakdown.pm10 || 0),
        no2: Number(breakdown.no2 || 0),
        o3: Number(breakdown.o3 || 0),
        so2: Number(breakdown.so2 || 0),
        co: Number(breakdown.co || 0),
      }

      set({ pollution })
      // If location wasn't set yet, set it now
      set(state => ({
        location: state.location ?? { lat, lon },
      }))
    } catch (err: any) {
      console.error(err)
      set({ error: err?.message || 'Failed to load pollution data' })
    } finally {
      set({ isLoading: false })
    }
  },
}))
