"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, LogIn, ShieldCheck } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectTo?: string | null
}

export default function LoginModal({ open, onOpenChange, redirectTo }: Props) {
  const { signInWithGoogle, user, isLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (user && open) {
      onOpenChange(false)
    }
  }, [user, open, onOpenChange])

  const handleGoogle = async () => {
    setLoading(true)
    try {
      const rawTarget =
        (typeof redirectTo === "string" && redirectTo.trim() ? redirectTo : null) ||
        sessionStorage.getItem("last_path") ||
        `${window.location.pathname}${window.location.search}${window.location.hash}`

      const decodedTarget = (() => {
        try {
          return decodeURIComponent(rawTarget)
        } catch {
          return rawTarget
        }
      })()

      const target = (() => {
        try {
          const url = decodedTarget.startsWith("/")
            ? new URL(decodedTarget, window.location.origin)
            : new URL(decodedTarget)
          if (url.origin !== window.location.origin) return "/"
          url.searchParams.delete("login")
          url.searchParams.delete("redirect")
          return `${url.pathname}${url.search}${url.hash}` || "/"
        } catch {
          return decodedTarget.startsWith("/") ? decodedTarget : "/"
        }
      })()

      sessionStorage.setItem("post_login_redirect", target)
      const mode = await signInWithGoogle()
      if (mode === "popup") {
        toast.success("Inicio de sesión con Google exitoso")
        router.replace(target)
        sessionStorage.removeItem("post_login_redirect")
        onOpenChange(false)
      }
    } catch {
      toast.error("No se pudo iniciar sesión con Google.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden bg-[rgb(var(--surface)/0.96)] border border-[rgb(var(--brand-600)/0.14)] shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[linear-gradient(90deg,rgb(var(--brand-200)),rgb(var(--brand-600)),rgb(var(--brand-900)))]" />
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center text-center space-y-3">
              <Image
                src="/images/nativa_logo.png"
                alt="Nativa Revestimientos"
                width={160}
                height={48}
                priority
              />
              <div className="flex items-center gap-2">
                <LogIn className="w-5 h-5 text-[rgb(var(--brand-700))]" />
                <h1 className="text-xl sm:text-2xl font-semibold text-[rgb(var(--foreground-rgb))]">Ingresá a tu cuenta</h1>
              </div>
              <p className="text-sm text-[rgb(var(--brand-700))]">Continuá con tu cuenta de Google</p>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full h-12 sm:h-14 text-base font-semibold border border-[rgb(var(--brand-600)/0.18)] hover:border-[rgb(var(--brand-600)/0.28)] hover:bg-[rgb(var(--brand-600)/0.06)] transition-all duration-300 rounded-xl"
                onClick={handleGoogle}
                disabled={loading || isLoading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuar con Google
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-[rgb(var(--brand-700)/0.75)]">
                <ShieldCheck className="w-4 h-4 text-[rgb(var(--brand-700))]" />
                <span>Usamos Google para mantener segura tu cuenta</span>
              </div>
            </div>

            <div className="mt-5 text-center">
              {isLoading ? (
                <div className="mx-auto w-56 h-4 rounded bg-[rgb(var(--brand-200))]/40 animate-pulse" />
              ) : (
                <p className="text-xs text-[rgb(var(--brand-700)/0.75)]">
                  Al continuar, aceptás los Términos de Servicio y la Política de Privacidad.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
