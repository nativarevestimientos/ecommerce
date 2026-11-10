# Integración de comprobantes de pago (Transferencia)

## Endpoint
- POST /api/ventas/{orderId}/comprobante
- Autenticación: Bearer token o API key
- Content-Type: multipart/form-data

## Payload (multipart)
- orderId: string
- email: string
- file: blob (pdf, jpg, png)
- mimeType: string opcional
- comments: string opcional (observaciones del cliente)

## Validaciones
- Tipos permitidos: application/pdf, image/jpeg, image/png
- Límite de tamaño: sugerido 10 MB
- (Opcional) Antivirus/scan del archivo
- Rechazar archivos corruptos o con mimetypes no válidos

## Persistencia
- Guardar el archivo asociado a la venta (orderId)
- Marcar comprobante_recibido=true
- Almacenar metadatos: nombre, tamaño, mimeType, fecha de recepción, email del remitente

## Flujo de aprobación
- Validar acreditación bancaria del comprobante
- Cambiar estado a "pagado"
- Setear montoAbonado = total
- (Opcional) Callback hacia ecommerce para disparar email de confirmación:
  - POST /api/orders/{orderId}/mark-success
  - Body: { paymentMethod: "transferencia", paidAmount: total }

## Respuestas
- 201 Created: { success: true, id: "<comprobanteId>" }
- 400 Bad Request: { error: "Archivo inválido" }
- 401 Unauthorized / 403 Forbidden
- 413 Payload Too Large
- 500 Error interno
