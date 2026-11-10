"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from '@/context/AuthContext';
// Firestore eliminado. A futuro, estas operaciones deben ir a la API externa.
import BreadcrumbCheckout from "@/components/cart-page/BreadcrumbCheckout";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import ProgressBar from "./components/ProgressBar";
import OrderSummary from "./components/OrderSummary";
import { UserIcon, TruckIcon, CreditCardIcon } from "@heroicons/react/24/outline";
import {
  stepOneSchema,
  stepTwoSchema,
  stepThreeSchema,
  Step1Data,
  Step2Data,
  Step3Data,
  FormData,
} from "./schema";
import clsx from "clsx";
import { satoshi } from "@/styles/fonts";
import { cn, parseDiscountPct } from "@/lib/utils";
import { FaArrowRight } from "react-icons/fa6";
import { MdInfoOutline, MdOutlineLocalOffer } from "react-icons/md";
import { TbBasketExclamation } from "react-icons/tb";
import Link from "next/link";
import { validateLocation, calculateDistance } from '@/lib/validations'
import { Product } from "./components/OrderSummary"
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { setPaymentMethod } from "@/lib/features/carts/cartsSlice";
import { setCart } from "@/lib/features/carts/cartsSlice";
import { trackMetaInitiateCheckout } from "@/lib/meta-pixel";
import { isNaveGaliciaEnabled } from "@/lib/paymentConfig";

const MySwal = withReactContent(Swal);

const showAlert = (message: string, isError = false) => {
  MySwal.fire({
    icon: isError ? 'error' : 'warning',
    title: isError ? 'Error' : 'Atención',
    text: message,
    confirmButtonColor: 'rgb(var(--brand-600))',
    confirmButtonText: 'Entendido',
    customClass: {
      popup: 'rounded-2xl shadow-xl',
      confirmButton: 'rounded-full px-6 py-2 bg-[rgb(var(--brand-600))] text-white font-medium hover:bg-[rgb(var(--brand-700))]'
    },
    buttonsStyling: false
  });
};

const checkoutSteps = [
  {
    id: 1,
    name: "Información Personal",
    description: "Datos de contacto",
    icon: UserIcon,
  },
  {
    id: 2,
    name: "Dirección de Envío",
    description: "Datos de entrega",
    icon: TruckIcon,
  },
  {
    id: 3,
    name: "Método de Pago",
    description: "Datos de pago",
    icon: CreditCardIcon,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const cart = useAppSelector((s) => s.carts.cart);
  const paymentMethod = useAppSelector((s) => s.carts.paymentMethod);
  const checkoutCart = useMemo<Product[]>(() => {
    const items = cart?.items ?? [];
    return items.map((item: any) => {
      const id = String(item.productId || item.id || "");
      const qty = Number(item.quantity) || 0;
      const unit = Number(item.price) || 0;
      return {
        id,
        name: String(item.name || ""),
        price: unit,
        quantity: qty,
        image: item.image || item.srcUrl || PLACEHOLDER_IMAGE,
        srcUrl: item.srcUrl || item.image,
        totalPrice: Math.round(unit * qty * 100) / 100,
        discount: item.discount,
        activePromo: item.activePromo,
      };
    });
  }, [cart?.items]);
  const isAuthenticated = !!user;
  const [step, setStep] = useState(0);
  const [useSavedInfo, setUseSavedInfo] = useState(!!user?.email);
  const [shippingMethod, setShippingMethod] = useState('delivery');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [unavailableItemIds, setUnavailableItemIds] = useState<string[]>([]);
  const [mustDiscardChanges, setMustDiscardChanges] = useState(false);
  const [isCheckoutBusy, setIsCheckoutBusy] = useState(false);
  const initiateCheckoutTrackedRef = useRef<string>("");

  const verifyCheckoutCartAvailability = async (items: Product[]) => {
    if (!items?.length) {
      setUnavailableItemIds([]);
      setMustDiscardChanges(false);
      return true;
    }

    setIsCheckingAvailability(true);
    try {
      const uniqueIds = Array.from(
        new Set(
          items
            .map((it: any) => String(it?.productId || it?.id || ""))
            .filter(Boolean)
        )
      );

      const results = await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
              cache: "no-store",
            });
            return res.ok;
          } catch {
            return false;
          }
        })
      );

      const unavailable = uniqueIds.filter((_, idx) => !results[idx]);
      setUnavailableItemIds(unavailable);
      setMustDiscardChanges(unavailable.length > 0);
      return unavailable.length === 0;
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const discardUnavailableItems = () => {
    const unavailableSet = new Set(unavailableItemIds);
    const updatedItems = (cart?.items || []).filter((it: any) => {
      const id = String(it?.productId || it?.id || "");
      return id && !unavailableSet.has(id);
    });

    dispatch(
      setCart({
        items: updatedItems as any,
        totalQuantities: updatedItems.reduce(
          (acc: number, it: any) => acc + (Number(it.quantity) || 0),
          0
        ),
      })
    );
    setUnavailableItemIds([]);
    setMustDiscardChanges(false);
  };

  // Efecto para scroll al cambiar de paso
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const methodsStepOne = useForm<Step1Data>({
    resolver: zodResolver(stepOneSchema(isAuthenticated)),
    mode: "onTouched",
    defaultValues: {
      email: "",
      nombre: "",
      telefono: "",
      dni: "",
      paymentMethod,
    },
  });

  const methodsStepTwo = useForm<Step2Data>({
    resolver: zodResolver(stepTwoSchema),
    mode: "onTouched",
  });

  const methodsStepThree = useForm<Step3Data>({
    resolver: zodResolver(stepThreeSchema),
    mode: "onTouched",
  });

  // Setear el email del usuario una vez esté disponible
  useEffect(() => {
    if (user?.email) {
      methodsStepOne.setValue("email", user.email);
    }
  }, [user, methodsStepOne]);

  useEffect(() => {
    methodsStepOne.setValue("paymentMethod", paymentMethod, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [methodsStepOne, paymentMethod]);

  useEffect(() => {
    if (!isNaveGaliciaEnabled && paymentMethod === "nave_galicia") {
      dispatch(setPaymentMethod("mercadopago"));
    }
  }, [dispatch, paymentMethod]);

  useEffect(() => {
    if (!cart?.items?.length) {
      router.replace("/cart");
      return;
    }
    void verifyCheckoutCartAvailability(checkoutCart);
  }, [cart?.items?.length, checkoutCart, router]);

  const handleStepOneSubmit = async (data: Step1Data) => {
    try {
      console.log("📝 Datos Step 1:", data);

      if (mustDiscardChanges) {
        showAlert("Algunos productos no se encuentran disponible para tu pedido.");
        return;
      }

      const availabilityOk = await verifyCheckoutCartAvailability(checkoutCart);
      if (!availabilityOk) {
        showAlert("Algunos productos no se encuentran disponible para tu pedido.");
        return;
      }

      const resolvedPaymentMethod = paymentMethod;

      setStep(1);
    } catch (error) {
      console.error("❌ Error guardando datos de Step 1:", error);
      showAlert("Hubo un error al procesar tu pedido. Por favor intenta de nuevo.");
    }
  };

  const handleStepTwoSubmit = async (data: Step2Data) => {
    try {
      console.log("📦 Dirección Step 2:", data);

      // TODO: Guardar dirección en API externa

      setStep(2);
    } catch (error) {
      console.error("❌ Error guardando datos de Step 2:", error);
    }
  };

  const proceedToStepThree = async () => {
    if (mustDiscardChanges) {
      showAlert("Algunos productos no se encuentran disponible para tu pedido.");
      return;
    }
    const availabilityOk = await verifyCheckoutCartAvailability(checkoutCart);
    if (!availabilityOk) {
      showAlert("Algunos productos no se encuentran disponible para tu pedido.");
      return;
    }

    const isStep1Valid = await methodsStepOne.trigger();
    await methodsStepTwo.trigger();
    if (!isStep1Valid) {
      showAlert("Revisá los datos antes de continuar.");
      return;
    }
    const step1 = methodsStepOne.getValues();
    const step2 = methodsStepTwo.getValues();
    const orderUuid = uuidv4();
    const detailedItems = checkoutCart.map((item) => {
      const qty = Number(item.quantity) || 0;
      const unit = Number(item.price) || 0;
      const promo = item.activePromo;
      let effectiveTotal = unit * qty;
      if (promo && promo.cantidad > 0) {
        const promoQty = Math.min(qty, promo.cantidad);
        const extraQty = Math.max(0, qty - promoQty);
        effectiveTotal = (promoQty > 0 ? Number(promo.precioFinal) || 0 : 0) + extraQty * unit;
      } else if (item.discount) {
        const { percentage = 0, amount = 0 } = item.discount;
        const discountedUnit =
          percentage > 0 ? unit * (1 - percentage / 100) : (amount > 0 ? unit - amount : unit);
        effectiveTotal = (Math.round(discountedUnit * 100) / 100) * qty;
      }
      const effectiveUnit = qty > 0 ? Math.round((effectiveTotal / qty) * 100) / 100 : unit;
      return {
        id: item.id,
        name: item.name,
        price: effectiveUnit,
        quantity: qty,
        totalPrice: Math.round(effectiveTotal * 100) / 100,
        image: item.image || item.srcUrl || PLACEHOLDER_IMAGE,
        discount: item.discount,
        activePromo: item.activePromo,
        category: (item as any).category,
        subcategory: (item as any).subcategory,
      };
    });
    const orderPayload = {
      orderId: orderUuid,
      userId: step1.email || user?.email || "",
      customerInfo: {
        nombre: step1.nombre,
        email: step1.email || user?.email || "",
        telefono: step1.telefono,
        dni: step1.dni,
      },
      deliveryInfo: {
        direccion: (step2 as any).direccion,
        ciudad: (step2 as any).ciudad,
        codigoPostal: (step2 as any).codigoPostal,
        metodoEntrega: (step2 as any).metodoEntrega,
        lat: (step2 as any).lat,
        lng: (step2 as any).lng,
        storeId: (step2 as any).storeId,
        sucursal: (step2 as any).sucursal,
        distanciaKm: (step2 as any).distanciaKm,
        maxRadiusKm: (step2 as any).maxRadiusKm,
        shippingPrice: (step2 as any).shippingPrice ?? null,
        shippingTierKm: (step2 as any).shippingTierKm ?? null,
      },
      items: detailedItems,
      total,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const json = await res.json().catch(() => ({}));
      const finalId = json?.orderId || orderUuid;
      setOrderId(finalId);
      setStep(2);
    } catch (e) {
      console.error("❌ Error pre-creando orden:", e);
      setStep(2);
    }
  };

  const onConfirm = async () => {
    if (mustDiscardChanges) {
      showAlert("Algunos productos no se encuentran disponible para tu pedido.");
      return;
    }
    const availabilityOk = await verifyCheckoutCartAvailability(checkoutCart);
    if (!availabilityOk) {
      showAlert("Algunos productos no se encuentran disponible para tu pedido.");
      return;
    }

    const isStep1Valid = await methodsStepOne.trigger();
    const isStep2Valid = await methodsStepTwo.trigger();
    const isStep3Valid = await methodsStepThree.trigger();

    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      showAlert("Revisá los datos antes de finalizar el checkout.");
      return;
    }

    const step1 = methodsStepOne.getValues();
    const step2 = methodsStepTwo.getValues();
    const orderUuid = uuidv4();
    const step2Shipping = [
      (step2 as any)?.shippingPrice,
      (step2 as any)?.shippingEstimatedPrice,
      (step2 as any)?.shippingCost,
      (step2 as any)?.costoEnvio,
    ].reduce((acc: number, value: any) => {
      if (acc > 0) return acc;
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }, 0);
    const shippingForOrder = (step2 as any)?.metodoEntrega === "envio" ? step2Shipping : 0;

    const detailedItems = checkoutCart.map((item) => {
      const qty = Number(item.quantity) || 0;
      const unit = Number(item.price) || 0;
      const promo = item.activePromo;
      let effectiveTotal = unit * qty;
      if (promo && promo.cantidad > 0) {
        const promoQty = Math.min(qty, promo.cantidad);
        const extraQty = Math.max(0, qty - promoQty);
        effectiveTotal = (promoQty > 0 ? Number(promo.precioFinal) || 0 : 0) + extraQty * unit;
      } else if (item.discount) {
        const { percentage = 0, amount = 0 } = item.discount;
        const discountedUnit =
          percentage > 0 ? unit * (1 - percentage / 100) : (amount > 0 ? unit - amount : unit);
        effectiveTotal = (Math.round(discountedUnit * 100) / 100) * qty;
      }
      const effectiveUnit = qty > 0 ? Math.round((effectiveTotal / qty) * 100) / 100 : unit;
      return {
        id: item.id,
        name: item.name,
        price: effectiveUnit,
        quantity: qty,
        totalPrice: Math.round(effectiveTotal * 100) / 100,
        image: item.image || item.srcUrl || PLACEHOLDER_IMAGE,
        discount: item.discount,
        activePromo: item.activePromo,
        category: (item as any).category,
        subcategory: (item as any).subcategory,
      };
    });

    const orderPayload = {
      orderId: orderUuid,
      userId: step1.email || user?.email || "",
      customerInfo: {
        nombre: step1.nombre,
        email: step1.email || user?.email || "",
        telefono: step1.telefono,
        dni: step1.dni,
      },
      deliveryInfo: {
        direccion: (step2 as any).direccion,
        ciudad: (step2 as any).ciudad,
        codigoPostal: (step2 as any).codigoPostal,
        metodoEntrega: (step2 as any).metodoEntrega,
        lat: (step2 as any).lat,
        lng: (step2 as any).lng,
        storeId: (step2 as any).storeId,
        sucursal: (step2 as any).sucursal,
        distanciaKm: (step2 as any).distanciaKm,
        maxRadiusKm: (step2 as any).maxRadiusKm,
        shippingPrice: shippingForOrder > 0 ? shippingForOrder : null,
        shippingTierKm: (step2 as any).shippingTierKm ?? null,
      },
      items: detailedItems,
      total,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    try {
      const createOrderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      if (!createOrderRes.ok) {
        const text = await createOrderRes.text();
        throw new Error(`Error al crear orden: ${text}`);
      }
      const orderResJson = await createOrderRes.json();
      const finalOrderId = orderResJson?.orderId || orderUuid;

      const mpItems = detailedItems.map((item) => ({
        title: item.name,
        unit_price: Number(item.price),
        quantity: Number(item.quantity),
      }));

      const createPrefRes = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: mpItems,
          orderId: finalOrderId,
          shipping: shippingForOrder,
          payer: {
            email: step1.email || user?.email || "",
            name: step1.nombre,
          },
        }),
      });
      const prefJson = await createPrefRes.json();
      if (!createPrefRes.ok || !prefJson?.init_point) {
        const msg = prefJson?.error || "No se pudo crear la preferencia de pago";
        throw new Error(msg);
      }

      window.location.href = prefJson.init_point;
    } catch (e) {
      showAlert(`Error al iniciar el pago: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // Calcular totales para el OrderSummary
  const subtotal = checkoutCart.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0);
  const discountTotal = checkoutCart.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const unit = Number(item.price) || 0;
    const original = unit * qty;
    const promo = item.activePromo;
    let effectiveTotal = original;
    if (promo && promo.cantidad > 0) {
      const promoQty = Math.min(qty, promo.cantidad);
      const extraQty = Math.max(0, qty - promoQty);
      effectiveTotal = (promoQty > 0 ? Number(promo.precioFinal) || 0 : 0) + extraQty * unit;
    } else if (item.discount) {
      const { percentage = 0, amount = 0 } = item.discount;
      const discountedUnit =
        percentage > 0 ? unit * (1 - percentage / 100) : (amount > 0 ? unit - amount : unit);
      effectiveTotal = (Math.round(discountedUnit * 100) / 100) * qty;
    }
    return acc + Math.max(0, original - effectiveTotal);
  }, 0);
  const transferenciaPctSafe = parseDiscountPct(process.env.NEXT_PUBLIC_TRANSFERENCIA_DESCUENTO_PCT, 0.10);
  const step2Vals = useWatch({ control: methodsStepTwo.control });
  const shippingCandidates = [
    (step2Vals as any)?.shippingPrice,
    (step2Vals as any)?.shippingEstimatedPrice,
    (step2Vals as any)?.shippingCost,
    (step2Vals as any)?.costoEnvio,
  ];
  const resolvedShipping = shippingCandidates.reduce((acc: number, value: any) => {
    if (acc > 0) return acc;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, 0);
  const shipping =
    (step2Vals as any)?.metodoEntrega === "envio"
      ? resolvedShipping
      : 0;
  const netSubtotal = Math.round((subtotal - discountTotal) * 100) / 100;
  const transferenciaDiscount =
    paymentMethod === "transferencia" && transferenciaPctSafe > 0
      ? Math.round(netSubtotal * transferenciaPctSafe * 100) / 100
      : 0;
  const total = Math.round((netSubtotal - transferenciaDiscount + shipping) * 100) / 100;
  const shippingLabel =
    (step2Vals as any)?.metodoEntrega === "cotizar"
      ? "a cotizar"
      : undefined;

  // Función para manejar el cambio de método de envío
  const handleShippingMethodChange = async (method: string) => {
    if (method === 'delivery') {
      // Obtener la ubicación actual del usuario usando la API de geolocalización
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLat = position.coords.latitude
          const userLng = position.coords.longitude
          
          // Validar la ubicación
          const isValid = await validateLocation(userLat, userLng)
          
          if (!isValid) {
            // Obtener la configuración general para mostrar la ubicación más cercana (API externa)
            let settings: any = null
            try {
              settings = await api.get<any>(`/settings/general`)
            } catch {
              settings = null
            }

            const locations = Array.isArray(settings?.locations) ? settings.locations : []
            if (!locations.length) {
              showAlert('No se encontraron ubicaciones configuradas. Por favor, intenta de nuevo.')
              return
            }
            
            // Encontrar la ubicación más cercana
            let minDistance = Infinity
            let closestLocation = null
            
            for (const location of locations) {
              const distance = calculateDistance(userLat, userLng, location.lat, location.lng)
              if (distance < minDistance) {
                minDistance = distance
                closestLocation = location
              }
            }
            
            if (closestLocation) {
              showAlert(`Lo sentimos, no realizamos envíos a esta ubicación. La ubicación más cercana es ${closestLocation.nombre} (${Math.round(minDistance * 1000)}m)`)
            } else {
              showAlert('No se encontraron ubicaciones configuradas. Por favor, intenta de nuevo.')
            }
            
            return
          }
          
          // Si la validación pasa, continuar
          setShippingMethod(method)
        },
        (error) => {
          console.error('Error al obtener la ubicación:', error)
          showAlert('No se pudo obtener tu ubicación. Por favor, intenta de nuevo.')
        }
      )
    } else {
      // Si es retiro en local, continuar
      setShippingMethod(method)
    }
  }

  useEffect(() => {
    if (!checkoutCart.length) return;
    const snapshot = JSON.stringify({
      total,
      items: checkoutCart
        .map((item) => ({
          id: String(item.id || ""),
          q: Number(item.quantity) || 0,
          p: Number(item.price) || 0,
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    });

    if (initiateCheckoutTrackedRef.current === snapshot) return;
    initiateCheckoutTrackedRef.current = snapshot;

    trackMetaInitiateCheckout(
      checkoutCart.map((item) => ({
        id: item.id,
        productId: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
      })),
      total
    );
  }, [checkoutCart, total]);

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto">
      <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
        <BreadcrumbCheckout />

        {mustDiscardChanges && (
          <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <MdInfoOutline className="mt-0.5 text-xl text-yellow-700" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">
                  Algunos productos no se encuentran disponible para tu pedido.
                </p>
              </div>
              <button
                type="button"
                onClick={discardUnavailableItems}
                className="shrink-0 rounded-full border border-yellow-200 bg-white px-4 py-2 text-sm font-medium text-yellow-900 hover:bg-yellow-100"
              >
                Descartar cambios
              </button>
            </div>
          </div>
        )}
        
        <div className="mb-8">
          <ProgressBar currentStep={step + 1} steps={checkoutSteps} />
        </div>

        <div className={clsx(
          "grid gap-8",
          step === 2 
            ? "grid-cols-1 lg:grid-cols-2" 
            : "grid-cols-1 lg:grid-cols-3"
        )}>
          <div className={clsx(
            step === 2 ? "lg:col-span-2" : "lg:col-span-2"
          )}>
            {step === 0 && (
              <FormProvider {...methodsStepOne}>
                <form onSubmit={methodsStepOne.handleSubmit(handleStepOneSubmit)}>
                  <StepOne
                    useSaved={useSavedInfo}
                    setUseSaved={setUseSavedInfo}
                    onProcessingChange={setIsCheckoutBusy}
                    onNext={methodsStepOne.handleSubmit(handleStepOneSubmit)}
                  />
                </form>
              </FormProvider>
            )}

            {step === 1 && (
              <FormProvider {...methodsStepTwo}>
                <form onSubmit={methodsStepTwo.handleSubmit(handleStepTwoSubmit)}>
                  <StepTwo
                    register={methodsStepTwo.register}
                    errors={methodsStepTwo.formState.errors}
                    setValue={methodsStepTwo.setValue}
                    onNext={proceedToStepThree}
                    setStep={setStep}
                    onProcessingChange={setIsCheckoutBusy}
                  />
                </form>
              </FormProvider>
            )}

            {step === 2 && (
              <FormProvider {...methodsStepThree}>
                <form onSubmit={methodsStepThree.handleSubmit(onConfirm)}>
                  <StepThree
                    step1Data={methodsStepOne.getValues()}
                    step2Data={methodsStepTwo.getValues()}
                    onPay={onConfirm}
                    cart={checkoutCart}
                    setStep={setStep}
                    initialOrderId={orderId}
                  />
                </form>
              </FormProvider>
            )}
          </div>

          {step !== 2 && (
            <div className="lg:col-span-1">
              <OrderSummary 
                products={checkoutCart}
                subtotal={subtotal}
                shipping={shipping}
                total={total}
                shippingLabel={shippingLabel}
                isLoading={isCheckoutBusy}
                showPaymentMethod={step === 0}
                paymentMethodLoading={false}
                paymentMethodCompleted={true}
                paymentMethod={paymentMethod}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
