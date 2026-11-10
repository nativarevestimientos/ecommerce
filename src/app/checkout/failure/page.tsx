"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from '@/context/AuthContext';
import { api } from "@/lib/api";
import { useCart } from "@/lib/hooks/useCart";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  XCircleIcon,
  ArrowLeftIcon,
  HomeIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

const FailurePage = () => {
  const { user } = useAuth();
  const { carritoRemotoId } = useCart();
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;

    const externalReference = searchParams.get("external_reference");
    const status = searchParams.get("status");
    
    if (externalReference) {
      setOrderId(externalReference);
    }

    setLoading(false);
  }, [searchParams]);

  const features = [
    {
      icon: ArrowLeftIcon,
      title: "Reintentar pago",
      description: "Puedes volver al carrito y intentar el pago nuevamente",
      action: "Volver al carrito",
      href: "/cart",
    },
    {
      icon: HomeIcon,
      title: "Continuar comprando",
      description: "Explora más productos en nuestra tienda",
      action: "Ir a la tienda",
      href: "/",
    },
    {
      icon: ShoppingBagIcon,
      title: "Contactar soporte",
      description: "Si el problema persiste, contáctanos",
      action: "Contactar",
      href: "/contact",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--page-bg))] py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { delayChildren: 0.3, staggerChildren: 0.2 },
          },
        }}
        className="max-w-4xl mx-auto"
      >
        <motion.div 
          variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} 
          className="text-center mb-12"
        >
          <div className="mx-auto flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-6">
            <XCircleIcon className="w-16 h-16 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-[rgb(var(--brand-900))] mb-3">Pago no procesado</h1>
          <p className="text-lg text-[rgb(var(--brand-700))] mb-4">
            Hubo un problema al procesar tu pago. No se ha realizado ningún cobro.
          </p>
          {orderId && (
            <p className="text-sm text-[rgb(var(--brand-600))]">ID de orden: {orderId}</p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-[rgb(var(--surface))] rounded-2xl p-6 shadow-lg border border-[rgb(var(--brand-200))] hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex flex-col items-center text-center">
                  <Icon className="w-8 h-8 text-red-600 mb-4" />
                  <h3 className="text-lg font-semibold text-[rgb(var(--brand-900))] mb-1">{feature.title}</h3>
                  <p className="text-sm text-[rgb(var(--brand-600))] mb-3">{feature.description}</p>
                  <Link 
                    href={feature.href} 
                    className="text-red-600 font-medium text-sm hover:underline"
                  >
                    {feature.action}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
          className="bg-[rgb(var(--surface))] rounded-2xl p-6 shadow-lg border border-[rgb(var(--brand-200))]"
        >
          <h3 className="text-lg font-semibold text-[rgb(var(--brand-900))] mb-4">¿Qué puede haber pasado?</h3>
          <ul className="space-y-2 text-sm text-[rgb(var(--brand-700))]">
            <li>• Fondos insuficientes en tu cuenta</li>
            <li>• Datos de la tarjeta incorrectos</li>
            <li>• Límite de la tarjeta excedido</li>
            <li>• Problemas de conectividad</li>
            <li>• Tiempo de sesión agotado</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FailurePage;
