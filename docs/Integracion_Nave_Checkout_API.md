# Integración Nave Checkout API

## Fuente de contrato

Usar el portal oficial de [Nave Developers – Checkout](https://developer-portal-doc-mfe-website-mfe.ranty.io/nave/online-payments/checkout). Esta guía del proyecto resume el flujo usado por la tienda; ante diferencias, prevalece el portal.

## Flujo implementado

1. La tienda guarda la orden con estado `pending_payment`.
2. El servidor vuelve a leer esa orden y crea la intención con el total persistido.
3. La tienda redirige al comprador a `checkout_url`.
4. Nave notifica al webhook configurado para el punto de venta.
5. El servidor consulta `payment_check_url` con el Bearer token y valida orden, punto de venta, importe, moneda y estado.
6. Solo entonces actualiza la orden mediante el endpoint exclusivo de Nave (`/api/orders/{id}/nave-payment-webhook`) y, si fue aprobada, crea la venta.
7. Al volver el comprador, la página solicita una reconciliación server-side; la redirección por sí sola nunca acredita el pago.

## Autenticación

Sandbox:
`POST https://homoservices.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate`

Producción:
`POST https://services.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate`

```json
{
  "client_id": "...",
  "client_secret": "...",
  "audience": "https://naranja.com/ranty/merchants/api"
}
```

La respuesta contiene `access_token` y `expires_in`. Las credenciales de sandbox y producción son distintas.

## Crear intención de pago

Sandbox:
`POST https://api-sandbox.ranty.io/integrations/payment_requests/ecommerce`

Producción:
`POST https://api.ranty.io/integrations/payment_requests/ecommerce`

Headers: `Authorization: Bearer <access_token>` y `Content-Type: application/json`.

El payload requiere `external_payment_id` (máximo 36 caracteres), `seller.pos_id` y `transactions`. Los importes deben ser strings con dos decimales. `buyer` es opcional. `duration_time` se expresa en segundos; Nave indica una semana por defecto.

La respuesta incluye `id`, `external_payment_id`, `checkout_url` y, opcionalmente, `qr_data`.

`additional_info.callback_url` es el retorno del comprador tras aprobarse el pago; **no es el webhook**.

## Notificaciones y confirmación

Al dar de alta la integración en Nave, registrar una URL pública distinta para sandbox y producción en **Integraciones → Tienda Online Propia**. El evento documentado contiene `payment_id`, `payment_check_url` y `external_payment_id`.

Consultar el `payment_check_url` recibido con:

```http
GET https://api-sandbox.ranty.io/integrations/payments/{payment_id}
Authorization: Bearer <access_token>
```

En producción, usar `https://api.ranty.io`. El servidor limita la URL de consulta al host oficial del entorno configurado. La respuesta canónica incluye `status.name`, `external_payment_id`, `transactions`, moneda e información del vendedor.

Solo `APPROVED` se considera pagado. Los estados posibles incluyen `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `REFUNDED`, `PURCHASE_REVERSED`, `CHARGEBACK_REVIEW` y `CHARGED_BACK`.

## Consultar intención

Sandbox:
`GET https://api-sandbox.ranty.io/integrations/payment_requests/{payment_request_id}`

Producción:
`GET https://api.ranty.io/integrations/payment_requests/{payment_request_id}`

La consulta puede vincular el pago mediante `payment_attempts.payments[].payment_id`.

## Configuración de producción

- Usar las credenciales, `pos_id` y endpoints correspondientes al entorno.
- Registrar el webhook de producción en Nave y comprobar que responda desde Internet.
- Configurar `BLOB_READ_WRITE_TOKEN` y `PAYMENT_SESSION_ENCRYPTION_KEY` para persistir las sesiones en producción.
- No habilitar firmas HMAC inventadas: activar `NAVE_GALICIA_WEBHOOK_SIGNATURE_MODE` solo si Nave entrega oficialmente el secreto y el nombre/formato del header.
- Probar aprobaciones, rechazos, duplicados, interrupciones y reconciliación en sandbox antes de cobrar en producción.

## Separación entre desarrollo y producción

- `tienda/.env.local` es exclusivamente local: tienda en `http://localhost:3000`, Nave sandbox y API de `sistema` en `http://localhost:3001`.
- Para operar localmente, iniciar también `sistema` en el puerto 3001 y configurarlo con un proyecto Firebase de desarrollo. Las claves HMAC/API de desarrollo deben coincidir entre ambos proyectos y ser distintas de producción.
- Nave no puede notificar a `localhost`: registrar en sandbox una URL pública de túnel o staging que apunte a `/api/nave-galicia/webhook`.
- Configurar producción en las variables del hosting (por ejemplo, el entorno Production de Vercel), con dominio, API externa, POS y credenciales de producción. No copiar esas credenciales a `.env.local` ni versionar secretos.
- Los endpoints de Nave se seleccionan automáticamente desde `NAVE_GALICIA_ENV`; no configurar overrides de endpoints antiguos.
