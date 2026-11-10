import { z } from 'zod'

// Paso 1: datos personales (depende si está logueado o no)
export const stepOneSchema = (isLoggedIn: boolean) =>
  z.object({
    nombre: z.string().min(1, 'Requerido'),
    email: isLoggedIn
      ? z.string().optional()
      : z.string().min(1, 'Requerido').email('Email inválido'),
    telefono: z.string().min(1, 'Requerido'),
    dni: z.string().min(1, 'Requerido'),
    paymentMethod: z.enum(['mercadopago', 'transferencia', 'nave_galicia'], {
      errorMap: () => ({ message: 'Seleccioná un método de pago' }),
    }),
  })

export type Step1Data = z.infer<ReturnType<typeof stepOneSchema>>

// Paso 2: dirección y documento
export const stepTwoSchema = z
  .object({
    direccion: z.string().optional(),
    ciudad: z.string().optional(),
    codigoPostal: z.string().optional(),
    metodoEntrega: z.enum(['envio', 'retiro', 'cotizar'], {
      errorMap: () => ({ message: 'Seleccioná un método de entrega' }),
    }),
    lat: z.number().optional().nullable(),
    lng: z.number().optional().nullable(),
    storeId: z.string().optional().nullable(),
    sucursal: z.any().optional(),
    shippingPrice: z.number().optional().nullable(),
    shippingEstimatedPrice: z.number().optional().nullable(),
    shippingTierKm: z.number().optional().nullable(),
    distanciaKm: z.number().optional().nullable(),
    maxRadiusKm: z.number().optional().nullable(),
    requiresQuote: z.boolean().optional(),
    cotizacionReason: z.enum(["peso", "zona"]).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.metodoEntrega === 'envio') {
      if (!data.direccion || data.direccion.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['direccion'],
          message: 'La dirección es obligatoria',
        });
      }
      if (!data.ciudad || data.ciudad.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ciudad'],
          message: 'La ciudad es obligatoria',
        });
      }
      if (!data.codigoPostal || data.codigoPostal.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['codigoPostal'],
          message: 'El código postal es obligatorio',
        });
      }
      if (data.lat == null || data.lng == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lat'],
          message: 'No se pudo validar la ubicación',
        });
      }
    } else if (data.metodoEntrega === 'retiro') {
      if (!data.storeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['storeId'],
          message: 'Seleccioná una tienda para retiro',
        });
      }
      if (!data.direccion || data.direccion.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['direccion'],
          message: 'La dirección de la tienda es obligatoria',
        });
      }
      if (!data.ciudad || data.ciudad.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ciudad'],
          message: 'La ciudad/sucursal es obligatoria',
        });
      }
      // Para retiro, el código postal NO es obligatorio
    }
  })
  
  export type Step2Data = z.infer<typeof stepTwoSchema>

// Paso 3: facturación
export const stepThreeSchema = z.object({
  comment: z.string().optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar los términos y condiciones' }),
  }),
})

export type Step3Data = z.infer<typeof stepThreeSchema>
export const fullSchema = z
  .object({})
  .merge(stepOneSchema(false))
  .merge(stepTwoSchema as unknown as z.AnyZodObject)
  .merge(stepThreeSchema)

export type FormData = z.infer<typeof fullSchema>
