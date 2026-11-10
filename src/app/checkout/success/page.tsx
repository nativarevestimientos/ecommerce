"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from '@/context/AuthContext';
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  CheckCircleIcon,
  TruckIcon,
  DocumentTextIcon,
  HomeIcon,
  ShoppingBagIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import { auth } from '@/lib/firebase'
import { useAppDispatch } from "@/lib/hooks/redux";
import { setCart } from "@/lib/features/carts/cartsSlice";
import { trackMetaPurchase } from "@/lib/meta-pixel";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  image?: string;
}

interface Order {
  orderId: string;
  items: OrderItem[];
  total: number;
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    dni: string;
  };
  deliveryInfo: {
    address: string;
    city: string;
    postalCode: string;
    deliveryMethod: string;
  };
  status: string;
  createdAt: any;
}

const SuccessPage = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFade, setShowFade] = useState(true);
  const [numeroPedido, setNumeroPedido] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ventaCreated, setVentaCreated] = useState(false);
  const processedReferenceRef = useRef<string | null>(null);
  const purchaseTrackedRef = useRef<string>("");
  const searchParams = useSearchParams();

  const cargarOrdenProcesada = async (externalReference: string, orderData: any) => {
    try {
      console.log('📦 Cargando orden ya procesada:', externalReference);
      
      // Convertir los datos guardados al formato de la UI
      const convertedItems = (orderData.items || []).map((item: any) => ({
        ...item,
        totalPrice: (item.price || 0) * (item.quantity || 1)
      }));
      
      const convertedOrder: Order = {
        orderId: orderData.id || externalReference,
        items: convertedItems,
        total: orderData.total || convertedItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0),
        customerInfo: {
          fullName: orderData.customerInfo?.nombre || "",
          email: orderData.customerInfo?.email || "",
          phone: orderData.customerInfo?.telefono || "",
          dni: orderData.customerInfo?.dni || ""
        },
        deliveryInfo: {
          address: orderData.deliveryInfo?.direccion || "",
          city: orderData.deliveryInfo?.ciudad || "",
          postalCode: orderData.deliveryInfo?.codigoPostal || "",
          deliveryMethod: orderData.deliveryInfo?.metodoEntrega || ""
        },
        status: "success",
        createdAt: orderData.createdAt || new Date().toISOString()
      };
      
      setOrder(convertedOrder);
      
      // Si hay número de pedido guardado, mostrarlo
      if (orderData.numeroPedido) {
        setNumeroPedido(orderData.numeroPedido);
      }
      
    } catch (error) {
      console.error('❌ Error al cargar orden procesada:', error);
    }
  };

  const processSuccessPayment = async () => {
    if (!searchParams) return;

    const externalReference = searchParams.get("external_reference");
    const paymentId = searchParams.get("payment_id");
    const status = searchParams.get("status");
    const collectionStatus = searchParams.get("collection_status");
    const provider = searchParams.get("provider");
    const isMercadoPagoFlow = Boolean(paymentId || status || collectionStatus);
    const isExternalCheckoutFlow = isMercadoPagoFlow || provider === "nave_galicia";

    if (!externalReference) {
      console.error("No se encontró referencia de la orden");
      setLoading(false);
      return;
    }

    if (processedReferenceRef.current === externalReference) {
      return;
    }
    processedReferenceRef.current = externalReference;

    try {
      const orderResponse = await fetch(`/api/orders/${encodeURIComponent(externalReference)}`);
      
      if (!orderResponse.ok) {
        throw new Error(`Error al obtener orden: ${orderResponse.status}`);
      }
      
      const orderData = await orderResponse.json();
      console.log('📦 Orden obtenida:', orderData);
      
      if (orderData && orderData.data) {
        const convertedItems = (orderData.data.items || []).map((item: any) => ({
          ...item,
          totalPrice: (item.price || 0) * (item.quantity || 1)
        }));
        
        const convertedOrder: Order = {
          orderId: orderData.data.id || externalReference,
          items: convertedItems,
          total: orderData.data.total || convertedItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0),
          customerInfo: {
            fullName: orderData.data.customerInfo?.nombre || "",
            email: orderData.data.customerInfo?.email || "",
            phone: orderData.data.customerInfo?.telefono || "",
            dni: orderData.data.customerInfo?.dni || ""
          },
          deliveryInfo: {
            address: orderData.data.deliveryInfo?.direccion || "",
            city: orderData.data.deliveryInfo?.ciudad || "",
            postalCode: orderData.data.deliveryInfo?.codigoPostal || "",
            deliveryMethod: orderData.data.deliveryInfo?.metodoEntrega || ""
          },
          status: "success",
          createdAt: orderData.data.createdAt || new Date().toISOString()
        };

        setOrder(convertedOrder);
        
        if (!isExternalCheckoutFlow && orderData.data.status !== "success") {
          console.log('🔄 Actualizando estado de orden a success...');
          await updateOrderStatus(externalReference);
        } else {
          console.log('✅ Orden ya está en estado success, saltando actualización');
        }
        
        try {
          const ventaRes = await fetch(`/api/ventas/buscar/${encodeURIComponent(externalReference)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (ventaRes.ok) {
            const venta = await ventaRes.json();
            const numeroExistente =
              venta?.numeroPedido ||
              venta?.data?.numeroPedido ||
              venta?.data?.[0]?.numeroPedido ||
              null;
            if (numeroExistente) {
              console.log('✅ Venta ya existente, evitando duplicar');
              setNumeroPedido(String(numeroExistente));
            } else if (!isExternalCheckoutFlow && !orderData.data.markedSuccessAt) {
              console.log('🔄 Creando venta final (no marcada y no encontrada existente)...');
              await createVentaFromOrder(orderData.data, externalReference);
            } else if (!isExternalCheckoutFlow) {
              console.log('✅ Orden marcada como success, creando venta si no existe...');
              await createVentaFromOrder(orderData.data, externalReference);
            } else {
              await buscarNumeroPedidoExistente(externalReference);
            }
          } else {
            if (!isExternalCheckoutFlow) {
              console.log('⚠️ No se pudo verificar venta existente, intentando crear...');
              await createVentaFromOrder(orderData.data, externalReference);
            } else {
              await buscarNumeroPedidoExistente(externalReference);
            }
          }
        } catch {
          if (!isExternalCheckoutFlow) {
            console.log('⚠️ Error al verificar venta existente, intentando crear...');
            await createVentaFromOrder(orderData.data, externalReference);
          } else {
            await buscarNumeroPedidoExistente(externalReference);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error al procesar pago exitoso:', error);
      setErrorMessage('Hubo un error al procesar tu pago. Por favor contacta a soporte.');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string) => {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/mark-success`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Error al actualizar estado: ${response.status}`);
        }
        
        console.log("Estado de la orden actualizado a success");
      } catch (error) {
        console.error("Error al actualizar el estado de la orden:", error);
      }
    };

    const buscarNumeroPedidoExistente = async (externalReference: string) => {
      try {
        console.log('🔍 Buscando número de pedido existente para:', externalReference);
        
        const response = await fetch(`/api/ventas/buscar/${encodeURIComponent(externalReference)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.numeroPedido) {
            console.log('✅ Número de pedido encontrado:', result.numeroPedido);
            setNumeroPedido(result.numeroPedido);
          } else {
            console.log('⚠️ No se encontró número de pedido existente');
          }
        } else {
          console.log('⚠️ No se pudo buscar el número de pedido existente');
        }
      } catch (error) {
        console.error('❌ Error al buscar número de pedido existente:', error);
      }
    };

    const createVentaFromOrder = async (orderData: Order, externalReference: string) => {
      if (ventaCreated) {
        console.log('⚠️ Venta ya creada en esta sesión, saltando...');
        return;
      }
      
      try {
        setVentaCreated(true);
        console.log('🔄 Iniciando creación de venta...');
        
        // Obtener email del usuario de manera segura
        const userEmail = user?.email || orderData.customerInfo?.email || 'usuario@desconocido.com';
        
        console.log('🔄 Creando venta con datos:', { 
          externalReference, 
          userEmail,
          orderData: {
            customerInfo: orderData.customerInfo,
            deliveryInfo: orderData.deliveryInfo,
            items: orderData.items,
            total: orderData.total,
            id: orderData.orderId
          }
        });

        const response = await fetch('/api/save-venta', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(auth?.currentUser ? { Authorization: `Bearer ${await auth.currentUser.getIdToken(true)}` } : {}),
          },
          body: JSON.stringify({
            externalReference,
            orderData,
            userEmail
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          setNumeroPedido(result.numeroPedido);
        } else {
          console.error('❌ Error al crear la venta:', result.error);
          setVentaCreated(false); // Reset para permitir reintento
        }
      } catch (error) {
        console.error('❌ Error al crear la venta:', error);
        setVentaCreated(false); // Reset para permitir reintento
      }
    };

  useEffect(() => {
    processSuccessPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!order?.items?.length) return;
    const externalReference = searchParams?.get("external_reference") || order.orderId;
    const key = `${externalReference}:${order.total}:${order.items.length}`;
    if (purchaseTrackedRef.current === key) return;
    purchaseTrackedRef.current = key;

    trackMetaPurchase(
      order.items.map((item) => ({
        id: item.id,
        productId: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
      })),
      Number(order.total) || 0,
      externalReference
    );
  }, [order, searchParams]);

  const clearCart = async () => {
    try {
      dispatch(setCart({ items: [], totalQuantities: 0 } as any));
    } catch (error) {
      console.error("Error al limpiar el carrito:", error);
    }
  };

  useEffect(() => {
    clearCart();

    const timer = setTimeout(() => {
      setShowFade(false);
    }, 2000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, user]);

  const features = [
    {
      icon: TruckIcon,
      title: "Seguimiento de envío",
      description: "Te mantendremos informado sobre el estado de tu pedido",
      action: "Rastrear pedido",
      href: "/orders",
    },
    {
      icon: DocumentTextIcon,
      title: "Detalles del pedido",
      description: "Revisa los detalles completos de tu compra",
      action: "Ver detalles",
      href: "/orders",
    },
    {
      icon: HomeIcon,
      title: "Seguir comprando",
      description: "Explora más productos en nuestra tienda",
      action: "Ir a la tienda",
      href: "/",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--brand-300))]"></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[rgb(var(--page-bg))] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mx-auto flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-6">
            <XCircleIcon className="w-16 h-16 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-[rgb(var(--brand-900))] mb-3">Error al cargar la orden</h1>
          <p className="text-lg text-[rgb(var(--brand-700))] mb-6">{errorMessage}</p>
          <div className="space-x-4">
            <Link 
              href="/orders" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Ver mis pedidos
            </Link>
            <Link 
              href="/" 
              className="btn-surface inline-flex items-center px-6 py-3 border border-[rgb(var(--brand-200))] text-base font-medium rounded-md text-[rgb(var(--brand-900))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--brand-50))]"
            >
              Ir a la tienda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--page-bg))] py-12 px-4 sm:px-6 lg:px-8">
      <AnimatePresence>
        {showFade && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.5, ease: "easeOut" } }}
            className="fixed inset-0 bg-[rgb(var(--brand-600))] z-50 flex items-center justify-center"
          >
            <CheckCircleIcon className="w-24 h-24 text-white" />
          </motion.div>
        )}
      </AnimatePresence>

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
        <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className="text-center mb-12">
          <div className="mx-auto flex items-center justify-center w-24 h-24 rounded-full bg-[rgb(var(--brand-50))] border border-[rgb(var(--brand-200))] mb-6">
            <CheckCircleIcon className="w-16 h-16 text-[rgb(var(--brand-600))]" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <h1 className="text-4xl font-bold text-[rgb(var(--brand-900))]">¡Pago exitoso!</h1>
          </div>
          <p className="text-lg text-[rgb(var(--brand-700))]">
            Gracias por tu compra. Tu pedido ha sido procesado correctamente.
          </p>
          {order && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-[rgb(var(--brand-600))]">ID de orden: {order.orderId}</p>
              {numeroPedido && (
                <p className="text-sm font-medium text-green-600">Número de pedido: {numeroPedido}</p>
              )}
            </div>
          )}
        </motion.div>

        {order && (
          <motion.div
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            className="bg-[rgb(var(--surface))] rounded-2xl p-6 shadow-lg border border-[rgb(var(--brand-200))] mb-12"
          >
            <div className="flex items-center gap-2 mb-6">
              <ShoppingBagIcon className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-[rgb(var(--brand-900))]">Resumen de tu compra</h2>
            </div>

            {order.items.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-[rgb(var(--brand-200))] last:border-0">
                <div className="relative h-20 w-20 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image || PLACEHOLDER_IMAGE}
                    alt={item.name}
                    className="rounded-lg object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-[rgb(var(--brand-900))]">{item.name}</p>
                  <p className="text-sm text-[rgb(var(--brand-600))]">Cantidad: {item.quantity}</p>
                  <p className="text-sm font-medium text-[rgb(var(--brand-900))]">
                    ${item.price.toFixed(2)} c/u
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-[rgb(var(--brand-900))]">
                    ${item.totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}

            <div className="border-t border-[rgb(var(--brand-200))] pt-6">
              <h3 className="text-base font-semibold text-[rgb(var(--brand-900))] mb-4">Información de envío</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[rgb(var(--brand-600))]">Dirección de entrega:</p>
                  <p className="font-medium text-[rgb(var(--brand-900))]">{order.deliveryInfo.address}</p>
                  <p className="font-medium text-[rgb(var(--brand-900))]">
                    {order.deliveryInfo.city}, {order.deliveryInfo.postalCode}
                  </p>
                </div>
                <div>
                  <p className="text-[rgb(var(--brand-600))]">Método de envío:</p>
                  <p className="font-medium text-[rgb(var(--brand-900))]">{order.deliveryInfo.deliveryMethod}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[rgb(var(--brand-200))] pt-6">
              <div className="flex justify-between items-center">
                <p className="text-base font-semibold text-[rgb(var(--brand-900))]">Total</p>
                <p className="text-xl font-bold text-[rgb(var(--brand-900))]">${order.total.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>
        )}

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
                  <Icon className="w-8 h-8 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold text-[rgb(var(--brand-900))] mb-1">{feature.title}</h3>
                  <p className="text-sm text-[rgb(var(--brand-600))] mb-3">{feature.description}</p>
                  <Link href={feature.href} className="text-green-600 font-medium text-sm hover:underline">
                    {feature.action}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default SuccessPage;
