import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Eliminar la cookie de sesión
    cookies().delete('session')

    return NextResponse.json(
      { message: 'Sesión cerrada correctamente' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en logout:', error)
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
} 