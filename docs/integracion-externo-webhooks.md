# Integración de Checkout y Webhooks (Equipo Sistema Externo)

Este documento detalla los puntos que su API debe soportar para un flujo 100% automático, incluyendo autenticación HMAC, actualización de estado por webhook y persistencia de cliente y dirección.

## Autenticación HMAC (todas las llamadas server‑to‑server)
- Cabeceras:
  - `X-Api-Key`: API Key compartida
  - `X-Request-Timestamp`: `Date.now()` en milisegundos
  - `X-Request-Hash`: `HMAC-SHA256`
  - `X-Request-Signature`: `hmac_sha256(SHARED_SECRET, \`\${timestamp}:\${raw_body}\`)`
- Ventana de tiempo: ±300 segundos
- `raw_body`:
  - GET sin cuerpo: `""`
  - POST/PUT: JSON serializado exacto
- Opcional: `Authorization: Bearer <SERVICE_TOKEN>` si desean token de servicio adicional.

## Endpoints usados por el e‑commerce
1. Clientes
   - GET `/api/v1/clientes/by-email?email={email}` → 200 cliente | 404 not_found
   - POST `/api/v1/clientes` → Crea cliente (201). Si ya existe pueden responder 200 actualizado.
   - PUT `/api/v1/clientes/by-email/{email}` → Upsert por email (200 actualizado | 201 creado)
2. Direcciones de cliente
   - GET `/api/v1/clientes/{clienteId}/direcciones`
   - POST `/api/v1/clientes/{clienteId}/direcciones` → 201 con `id`
   - PUT `/api/v1/clientes/{clienteId}/direcciones/{dirId}` (opcional)
3. Órdenes
   - POST `/api/orders` → `{ orderId, userId(email), customerInfo, deliveryInfo, items[], total, status }`
   - GET `/api/orders/{id}` → retorna datos de la orden creada (items, customerInfo, deliveryInfo, total, status, etc.)
4. Reserva de stock (idempotente)
   - POST `/api/v1/stock/reservar`
   - Cabecera adicional: `Idempotency-Key: {orderId}:{productoId}`
   - TTL recomendado: 900 s. Si repiten la misma clave durante el TTL, devolver el resultado previo.

## Webhook de Mercado Pago (comportamiento esperado)
Nuestro servidor recibirá notificaciones en `/api/mercadopago/webhook` y:
1) Validará el pago llamando a `https://api.mercadopago.com/v1/payments/{paymentId}` con nuestro `MERCADOPAGO_ACCESS_TOKEN`.
2) Derivará el estado resultante a su API:
   - POST `/api/orders/{id}/payment-webhook` con cuerpo:
     ```json
     {
       "paymentId": "...",
       "paymentStatus": "approved|rejected|pending",
       "status": "success|failed|pending",
       "metadata": { "orderId": "...", "customerEmail": "..." }
     }
     ```
   - Debe aceptar HMAC y API Key.
   - Debe actualizar la orden y persistir auditoría/registro de transacción.
3) Si el estado es `approved`, nuestro servidor:
   - GET `/api/orders/{id}` y luego envía email de confirmación al cliente.

### Requisitos de su endpoint `/api/orders/{id}/payment-webhook`
- Idempotencia: si llega repetido el mismo `paymentId`, no duplicar efectos.
- Estados permitidos y transición:
  - `approved` → marcar orden como exitosa (`status: success`) y cerrar reserva de stock.
  - `rejected` → `status: failed`; liberar stock si corresponde.
  - `pending` → mantener `status: pending`.
- Responder 200 con JSON `{ ok: true }` o `{ success: true }`.

## Variables de entorno que usamos (lado e‑commerce)
- Mercado Pago:
  - `MERCADOPAGO_ACCESS_TOKEN` (obligatoria)
  - `MERCADOPAGO_CURRENCY` (opcional, default `ARS`)
  - `MERCADOPAGO_STATEMENT_DESCRIPTOR` (opcional)
  - `NEXT_PUBLIC_BASE_URL` (para `back_urls` y `notification_url`)
- Resend (emails):
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`
- API Externa:
  - `NEXT_PUBLIC_API_BASE` o `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_API_USE_PROXY` (opcional; default “true” para carts)
  - `EXTERNAL_API_API_KEY`
  - `EXTERNAL_API_SHARED_SECRET`
  - `EXTERNAL_API_SERVICE_TOKEN` (opcional)

## Observaciones
- Todas las llamadas server‑to‑server se firman con HMAC.
- La lógica es 100% automática por webhook: si el usuario no vuelve al sitio, el estado se actualiza vía `/api/mercadopago/webhook` → `/api/orders/{id}/payment-webhook`.
- Invitado o logueado, se realiza **upsert** de cliente por email y se asocia al menos una dirección en el checkout.

## Flujo End‑to‑End
- El cliente crea una orden y se genera una preferencia de Mercado Pago con `notification_url`.
- Mercado Pago notifica a `https://www.nativarevestimientos.com.ar/api/mercadopago/webhook` con `paymentId`.
- El e‑commerce consulta el pago a MP y deduce `approved|rejected|pending`.
- Se envía al sistema externo `POST /api/orders/{id}/payment-webhook` con HMAC y API Key.
- Si `approved`, además se envía el email de confirmación al cliente vía Resend.

## Qué debe modificar el equipo del sitio (infraestructura)
- Configurar dominio canónico con “www” y usarlo en la `notification_url` de MP.
- Permitir `POST` público al endpoint `/api/mercadopago/webhook`:
  - Sin autenticación previa.
  - Sin bloqueo por firewall/WAF/CDN.
  - Sin rate limit agresivo sobre `/api/*`.
- Evitar redirecciones en la URL del webhook:
  - Si el dominio apex redirige a “www”, configurar en MP la URL con “www”.
- Verificar acceso externo:
  - `curl -i -X POST https://www.nativarevestimientos.com.ar/api/mercadopago/webhook -H "Content-Type: application/json" -d "{\"type\":\"payment\",\"data\":{\"id\":\"123\"}}"` debe responder 200.

## Qué ya está implementado en el e‑commerce (código)
- Webhook MP: recibe notificaciones, consulta el pago, y reenvía al sistema externo con HMAC.
- Tolerancia a pruebas de MP:
  - Si MP envía un `paymentId` inexistente, se responde 200 para que la “prueba de webhook” no falle.
- Envío de email de confirmación en `approved` usando Resend.
- Archivos clave:
  - `src/app/api/mercadopago/webhook/route.ts`
  - `src/app/api/orders/[id]/payment-webhook/route.ts`
  - `src/app/api/create-checkout/route.ts`
  - `src/services/emailService.ts`

## Qué debe implementar el equipo del sistema externo
- Endpoint `POST /api/orders/{id}/payment-webhook`:
  - Autenticación por cabeceras: `X-Api-Key`, `X-Request-Timestamp`, `X-Request-Hash`, `X-Request-Signature`.
  - Verificar firma: `signature = HMAC_SHA256(SHARED_SECRET, "\{timestamp}:\{raw_body}")`.
  - Validar ventana de tiempo: rechazar si `|now - timestamp| > 300s`.
  - Idempotencia: si llega el mismo `paymentId` más de una vez, no duplicar efectos.
  - Actualizar estado de la orden en base a `paymentStatus`:
    - `approved` → `status: success`, cerrar reserva de stock.
    - `rejected` → `status: failed`, liberar stock.
    - `pending` → `status: pending`.
  - Responder `200` con `{ success: true }`.
- Endpoints de soporte ya usados por el e‑commerce:
  - Clientes, direcciones, órdenes y reserva de stock (ver secciones anteriores).

## Configuración en Mercado Pago
- Webhook: `https://www.nativarevestimientos.com.ar/api/mercadopago/webhook`.
- Eventos: “Pagos” (`payment.*`).
- La prueba integrada de MP puede enviar IDs ficticios; el e‑commerce responde 200 aunque MP devuelva 404 al consultar ese ID.

## Pruebas (sandbox)
- Crear preferencia y pagar en sandbox (tarjeta 5031 7557 3453 0604, 11/30, 123).
- No volver al sitio; validar que el webhook dispare la actualización automática en el sistema externo.
- Verificar email de confirmación al cliente en estado `approved`.

## Lista de verificación rápida
- Variables de entorno configuradas (MP, Resend, API externa).
- Webhook en MP apuntando al dominio con “www”.
- Endpoint público sin auth ni bloqueo en CDN/WAF.
- Sistema externo valida HMAC y actualiza estados correctamente.
