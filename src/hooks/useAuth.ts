'use client'

import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

export const useAuth = () => {
  const router = useRouter()
  const { toast } = useToast()
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  const { user, setUser } = context

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Error al cerrar sesión')
      }

      // Limpiar el estado del usuario
      setUser(null)
      
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente',
      })

      // Redirigir al login
      router.push('/')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error al cerrar sesión',
      })
    }
  }

  return { user, logout }
} 