import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    
    if (!orderId) {
      return NextResponse.json(
        { error: "ID de orden requerido" },
        { status: 400 }
      );
    }

    console.log('🔄 Marcando orden como exitosa:', orderId);

    // Enviar a la API externa para marcar como exitosa
    const externalApiUrl = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://maderascaballero.vercel.app';
    const fullUrl = `${externalApiUrl.replace(/\/+$/, '')}/api/orders/${encodeURIComponent(orderId)}/mark-success`;
    
    console.log('🌐 Enviando a API externa:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API externa respondió con ${response.status}: ${errorText}`);
    }

    const responseData = await response.json();
    
    console.log('✅ Orden marcada como exitosa:', responseData);

    return NextResponse.json({
      success: true,
      message: "Orden marcada como exitosa",
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error al marcar orden como exitosa:', error);
    
    return NextResponse.json(
      { 
        error: "Error al marcar orden como exitosa",
        details: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}
