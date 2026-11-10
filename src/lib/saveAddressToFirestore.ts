import { Step2Data } from '../app/checkout/schema'
import { api } from '@/lib/api'

/**
 * Guarda los datos de dirección del usuario en Firestore bajo el documento "users/{email}"
 * @param email - El email del usuario
 * @param data - Los datos del paso 2 (dirección)
 */
export const saveAddressToExternalApi = async (email: string, data: Step2Data) => {
  try {
    await api.put(`/users/${encodeURIComponent(email)}/address`, data)
    console.log('Dirección guardada correctamente en API externa')
  } catch (error) {
    console.error('Error al guardar dirección en API externa:', error)
  }
}
