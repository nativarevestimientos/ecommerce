"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
} from "./toast"
import { useToast } from "./use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, XCircle, Info, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"

type ToastVariant = NonNullable<ToastProps["variant"]>

const icons = {
  default: Info,
  success: CheckCircle,
  destructive: XCircle,
  cart: ShoppingCart,
} as const

export function Toaster() {
  const { toasts } = useToast()
  const router = useRouter()

  const handleToastClick = (variant?: ToastVariant) => {
    if (variant === 'cart') {
      router.push('/cart')
    }
  }

  return (
    <ToastProvider>
      <AnimatePresence>
        {toasts.map(({ id, title, description, action, variant = "default", ...props }) => {
          const Icon = icons[variant as keyof typeof icons] || icons.default
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30
              }}
              onClick={() => handleToastClick(variant as ToastVariant)}
              className={variant === 'cart' ? 'cursor-pointer' : ''}
            >
              <Toast variant={variant} {...props}>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  {/* Bloque 1: Título con icono */}
                  {title && (
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <ToastTitle className="text-xs sm:text-sm font-semibold truncate">
                        {title}
                      </ToastTitle>
                    </div>
                  )}
                  
                  {/* Bloque 2: Descripción dividida en dos líneas */}
                  {description && typeof description === 'string' && (
                    <div className="ml-6 sm:ml-0 space-y-1 min-w-0">
                      {/* Línea 1: Nombre del producto */}
                      <div className="text-xs sm:text-sm font-medium text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap">
                        {description.includes(' ha sido') 
                          ? description.split(' ha sido')[0] 
                          : description
                        }
                      </div>
                      {/* Línea 2: Texto de confirmación - solo si contiene " ha sido" */}
                      {description.includes(' ha sido') && (
                        <div className="text-xs sm:text-sm opacity-90">
                          ha sido agregado correctamente al carrito.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {action}
                <ToastClose />
              </Toast>
            </motion.div>
          )
        })}
      </AnimatePresence>
      <ToastViewport />
    </ToastProvider>
  )
} 
