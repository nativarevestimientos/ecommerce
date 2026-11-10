import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export interface Location {
  id?: string
  nombre: string
  direccion: string
  lat: number
  lng: number
  radio: number // metros
}

export type DeliveryValidationResult =
  | {
      disponible: true
      sucursal: Location
      distanciaM: number
      distanciaKm: number
      /** Precio estimado devuelto por la API externa (si hay tiers configurados) */
      price?: number | null
      /** Tramo de km aplicado por la API externa */
      tierKm?: number | null
      /** Indica si el peso permite el envío (según API externa) */
      canShip?: boolean
    }
  | {
      disponible: false
      nearestStore?: Location
      distanciaKm?: number
      maxRadiusKm?: number
      price?: number | null
      tierKm?: number | null
      canShip?: boolean
    }

export function useDeliveryValidation() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchLocations() {
      setLoading(true)
      setError(null)
      try {
        const data = await api.get<{ locations?: Location[] }>(`/settings/general`)
        setLocations(data.locations || [])
      } catch (err) {
        setLocations([])
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    fetchLocations()
  }, [])

  function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371e3 // metros
    const rad = Math.PI / 180
    const dLat = (lat2 - lat1) * rad
    const dLng = (lng2 - lng1) * rad
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  function validateAddress(lat: number, lng: number): DeliveryValidationResult {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { disponible: false }
    if (locations.length === 0) return { disponible: false }

    let nearestStore: Location | undefined
    let shortestDistanceM = Infinity

    for (const loc of locations) {
      const distM = getDistance(lat, lng, loc.lat, loc.lng)
      if (distM < shortestDistanceM) {
        shortestDistanceM = distM
        nearestStore = loc
      }
      if (distM <= loc.radio) {
        return {
          disponible: true,
          sucursal: loc,
          distanciaM: distM,
          distanciaKm: distM / 1000,
        }
      }
    }

    if (!nearestStore || !Number.isFinite(shortestDistanceM)) return { disponible: false }

    return {
      disponible: false,
      nearestStore,
      distanciaKm: shortestDistanceM / 1000,
      maxRadiusKm: nearestStore.radio / 1000,
    }
  }

  async function validateAddressAsync(lat: number, lng: number, weightKg?: number | null): Promise<DeliveryValidationResult> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { disponible: false }
    try {
      const w = Number(weightKg)
      const qs = Number.isFinite(w) && w > 0 ? `&weightKg=${w}` : ""
      const data = await api.get<{
        isInRadius: boolean
        distance: number
        maxRadius: number
        canShip?: boolean
        price?: number | null
        tierKm?: number | null
        nearestStore?: Location
      }>(`/check-delivery-radius?lat=${lat}&lng=${lng}${qs}`)

      if (data && typeof data.isInRadius === 'boolean') {
        const canShip = data.canShip ?? true
        const priceRaw = Number(data.price ?? 0)
        const hasTierPrice = Number.isFinite(priceRaw) && priceRaw > 0
        const isAvailable = canShip && Boolean(data.nearestStore) && (data.isInRadius || hasTierPrice)

        if (isAvailable && data.nearestStore) {
          return {
            disponible: true,
            sucursal: data.nearestStore,
            distanciaM: (data.distance || 0) * 1000,
            distanciaKm: data.distance || 0,
            price: data.price ?? null,
            tierKm: data.tierKm ?? null,
            canShip: data.canShip ?? true,
          }
        }
        return {
          disponible: false,
          nearestStore: data.nearestStore,
          distanciaKm: data.distance,
          maxRadiusKm: data.maxRadius,
          price: data.price ?? null,
          tierKm: data.tierKm ?? null,
          canShip: data.canShip ?? undefined,
        }
      }
    } catch {
      // Ignorar y caer al cálculo local
    }
    return validateAddress(lat, lng)
  }

  return { locations, loading, error, validateAddress, validateAddressAsync }
} 
