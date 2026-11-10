import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/')
    const url = `https://4bvph4ykqt2jvybf.public.blob.vercel-storage.com/${path}`

    console.log('Intentando servir imagen:', { path, url })

    // Verificar si la URL es válida
    if (!path || path.includes('..')) {
      console.error('Ruta inválida:', path)
      return new NextResponse('Ruta inválida', { status: 400 })
    }

    // Intentar obtener la imagen
    const response = await fetch(url, {
      headers: {
        'Accept': 'image/*',
        'Cache-Control': 'no-cache'
      }
    })
    
    if (!response.ok) {
      console.error('Error al obtener imagen:', {
        status: response.status,
        statusText: response.statusText,
        url
      })
      return new NextResponse(`Imagen no encontrada: ${response.statusText}`, { 
        status: response.status 
      })
    }

    // Verificar que sea una imagen
    const contentType = response.headers.get('content-type')
    if (!contentType?.startsWith('image/')) {
      console.error('Tipo de contenido inválido:', contentType)
      return new NextResponse('Tipo de contenido inválido', { status: 400 })
    }

    const buffer = await response.arrayBuffer()

    console.log('Imagen encontrada:', {
      contentType,
      size: buffer.byteLength,
      url
    })

    // Crear una nueva respuesta con los headers correctos
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        'Accept-Ranges': 'bytes',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless'
      }
    })
  } catch (error) {
    console.error('Error al servir imagen:', error)
    return new NextResponse('Error al cargar la imagen', { status: 500 })
  }
} 