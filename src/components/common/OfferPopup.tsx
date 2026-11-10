"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Product } from '@/types/product';
import { resolveProductPricing } from '@/lib/product-pricing';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

const OfferPopup = () => {
  const [currentOffer, setCurrentOffer] = useState<Product | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Efecto para cargar ofertas inicialmente y cada 2 minutos
  useEffect(() => {
    const fetchAndShowOffer = async () => {
      setIsLoading(true);
      try {
        const fetchedProducts = await api.get<Product[]>(`/products`);

        const commercialOffers = fetchedProducts.filter(product => 
            product.specialOffer || (product.discount?.percentage > 0 || product.discount?.amount > 0)
          );

        if (commercialOffers.length > 0) {
          const randomOffer = commercialOffers[Math.floor(Math.random() * commercialOffers.length)];
          setCurrentOffer(randomOffer);
          setIsVisible(true);
        } else {
          setCurrentOffer(null);
          setIsVisible(false);
        }

      } catch (error) {
        console.error('Error fetching offers:', error);
        setCurrentOffer(null);
        setIsVisible(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Mostrar oferta inicial después de 3 segundos
    const initialTimer = setTimeout(fetchAndShowOffer, 3000);
    
    // Mostrar nuevas ofertas cada 2 minutos
    const interval = setInterval(fetchAndShowOffer, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []); // Solo se ejecuta una vez al montar el componente

  // Efecto separado para manejar el temporizador de ocultamiento
  useEffect(() => {
    let hideTimer: NodeJS.Timeout;
    
    if (isVisible && currentOffer) {
      // Ocultar el popup después de 8 segundos
      hideTimer = setTimeout(() => {
        setIsVisible(false);
        setCurrentOffer(null);
      }, 8000);
    }

    return () => {
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [isVisible, currentOffer]); // Se ejecuta cuando cambia isVisible o currentOffer

  const handleClose = () => {
    setIsVisible(false);
    setCurrentOffer(null);
  };

  if (isLoading || !currentOffer || !isVisible) {
    return null;
  }

  // Calcular precio con descuento
  const originalPrice = currentOffer.price;
  const pricing = resolveProductPricing(currentOffer);
  const discountPercentage = Math.round(pricing.discount.percentage);
  const discountAmount = pricing.discount.amount;
  const finalPrice = pricing.finalPrice;
  const hasDiscount = discountAmount > 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-24 right-6 z-50 hidden lg:block"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
        >
          <motion.div
            className="relative bg-[rgb(var(--surface))]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[rgb(var(--brand-200))]/60 overflow-hidden max-w-sm w-64"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ 
              duration: 0.3, 
              delay: 0.1,
              ease: [0.25, 0.46, 0.45, 0.94] 
            }}
          >
            {/* Header — alineado con identidad visual */}
            <div
              className="relative p-5 pb-3"
              style={{
                background:
                  "linear-gradient(180deg, rgb(var(--brand-600) / 0.10), rgb(var(--brand-600) / 0.03))",
              }}
            >
              {/* Botón de cerrar */}
              <motion.button
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[rgb(var(--surface))]/90 hover:bg-[rgb(var(--surface))] transition-all duration-200 flex items-center justify-center text-[rgb(var(--brand-600))] hover:text-[rgb(var(--brand-900))] backdrop-blur-sm border border-[rgb(var(--brand-200))]/60"
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>

              {/* Badge de oferta */}
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "rgb(var(--brand-600))" }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-xs font-medium text-[rgb(var(--brand-900))]">
                  Oferta Especial
                </span>
              </div>

              {/* Título principal */}
              <h3 className="text-xl font-bold mb-1 text-[rgb(var(--brand-900))]">
                ¡Aprovecha!
              </h3>
              <p className="text-xs text-[rgb(var(--brand-700))]">
                Producto seleccionado con descuento
              </p>
            </div>

            {/* Contenido principal */}
            <div className="p-5 pt-3">
              <Link
                href={`/shop/product/${currentOffer.id}`}
                onClick={handleClose}
                className="group block"
              >
                <div className="flex gap-3 items-start">
                  {/* Imagen del producto */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-[rgb(var(--brand-50))] to-[rgb(var(--brand-100))] border border-[rgb(var(--brand-200))]/60 relative">
                      <Image
                        src={currentOffer.images[0] || currentOffer.srcUrl || '/placeholder.png'}
                        alt={currentOffer.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                      {hasDiscount && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "rgb(var(--brand-600))" }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                        >
                          <Sparkles className="w-2.5 h-2.5 text-white" />
                        </motion.div>
                      )}
                  </div>

                  {/* Información del producto */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[rgb(var(--brand-900))] text-xs leading-tight mb-2 line-clamp-2">
                      {currentOffer.name}
                    </h4>
                    
                    {/* Precios */}
                    <div className="space-y-1">
                      {hasDiscount && (
                        <p className="text-xs text-[rgb(var(--brand-400))] line-through">
                          ${originalPrice.toLocaleString()}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-[rgb(var(--brand-900))]">
                          ${finalPrice.toLocaleString()}
                        </span>
                          {hasDiscount && (
                            <span
                              className="text-xs font-medium px-2 py-1 rounded-full bg-[rgb(var(--brand-600))] text-white"
                            >
                              {discountPercentage > 0 ? `-${discountPercentage}%` : "Oferta"}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón de acción */}
                <motion.div
                  className="mt-3 w-full py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all duration-200 bg-[rgb(var(--brand-600))] text-white hover:bg-[rgb(var(--brand-700))]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ver oferta
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200" />
                </motion.div>
              </Link>

              {/* Footer */}
              <div
                className="mt-3 pt-3"
                style={{ borderTop: "1px solid rgb(var(--brand-200) / 0.6)" }}
              >
                <p className="text-xs text-center text-[rgb(var(--brand-600))]">
                  Oferta por tiempo limitado
                </p>
              </div>
            </div>

            {/* Indicador de tiempo */}
            <motion.div
              className="absolute bottom-0 left-0 h-0.5"
              style={{ backgroundColor: "rgb(var(--brand-600))" }}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 8, ease: "linear" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfferPopup; 
