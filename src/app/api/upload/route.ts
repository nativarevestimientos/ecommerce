import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('Iniciando proceso de subida...')
    
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.log('No se encontró archivo en la solicitud')
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    console.log('Archivo recibido:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!validTypes.includes(file.type)) {
      console.log('Tipo de archivo no válido:', file.type)
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG o GIF' },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      console.log('Archivo demasiado grande:', file.size)
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. El tamaño máximo es 2MB' },
        { status: 400 }
      )
    }

    // Generar un nombre único para el archivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const fileName = `${timestamp}-${randomString}.${fileExtension}`

    // Crear la ruta de almacenamiento
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const path = `products/${year}/${month}/${fileName}`

    console.log('Preparando subida a Vercel Blob:', {
      path,
      storeId: 'store_4BvpH4yKQt2JVyBf'
    })

    // Verificar que el token esté configurado
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN no está configurado')
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    // Convertir el archivo a buffer
    const buffer = await file.arrayBuffer()

    // Subir el archivo a Vercel Blob
    const response = await fetch(`https://blob.vercel-storage.com/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        'x-store-id': 'store_4BvpH4yKQt2JVyBf',
        'Content-Type': file.type,
        'x-content-type': file.type,
        'x-access': 'public',
        'x-content-disposition': 'inline',
        'x-cache-control': 'public, max-age=31536000'
      },
      body: buffer
    })

    console.log('Respuesta de Vercel Blob:', {
      status: response.status,
      statusText: response.statusText
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Error de Vercel Blob:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`Error al subir el archivo: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Usar la URL completa que incluye el sufijo único
    const blobUrl = data.url

    console.log('Subida exitosa:', { 
      blobUrl,
      path,
      response: data
    })

    return NextResponse.json({
      url: blobUrl,
      pathname: path,
      contentType: file.type,
      publicUrl: blobUrl
    })
  } catch (error) {
    console.error('Error detallado al subir archivo:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al subir el archivo' },
      { status: 500 }
    )
  }
} 