import { FieldErrors, UseFormRegister } from "react-hook-form";
import { Step2Data } from "./schema";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from '@/context/AuthContext';
import { api } from "@/lib/api";
import { useObtenerDireccionesCliente, useGuardarDireccionCliente } from "@/lib/hooks/useClientAddresses";
import { useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { RadioGroup } from "@headlessui/react";
import {
  PencilIcon,
  MapPinIcon,
  TruckIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { satoshi } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import DeliveryAddressInput from "@/components/checkout/DeliveryAddressInput";
import { useDeliveryValidation } from "@/hooks/useDeliveryValidation";
import { useCart } from "@/lib/hooks/useCart";
import { useToast } from "@/components/ui/use-toast";
import { TbRoute, TbTruckDelivery } from "react-icons/tb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type DireccionGuardada = {
  id: string;
  direccion: string;
  ciudad: string;
  codigoPostal?: string;
  metodoEntrega: "envio";
  lat?: number;
  lng?: number;
  esFavorita?: boolean;
  sucursal?: {
    ciudad: string;
  };
};

interface SavedAddress extends Step2Data {
  id: string;
  isFavorite?: boolean;
  lat?: number;
  lng?: number;
  sucursal?: {
    city: string;
  };
}

interface AddressData {
  address: string;
  city: string;
  postalCode: string;
  deliveryMethod: "envio";
  lat: number;
  lng: number;
  isFavorite: boolean;
}

type StepTwoProps = {
  register: UseFormRegister<Step2Data>;
  errors: FieldErrors<Step2Data>;
  setValue: any;
  onNext: () => void | Promise<void>;
  setStep: (step: number) => void;
  onProcessingChange?: (busy: boolean) => void;
};

const LOGISTICS_WARNING_MESSAGE =
  "Advertencia: se lo contactará por WhatsApp para poder coordinar el envío";

const PICKUP_STORE_LOCATION = {
  id: "retiro-villa-lynch",
  nombre: "Villa Lynch",
  direccion: "Murature 4574, B1672 Villa Lynch, Provincia de Buenos Aires",
  lat: null,
  lng: null,
};

// Componente de Skeleton para placeholders
const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-xl bg-[rgb(var(--brand-100))] border border-[rgb(var(--brand-200))]",
      className
    )}
  >
    <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-[rgb(var(--surface))]/70 to-transparent" />
  </div>
);

// Componente de AddressCard para mostrar direcciones guardadas
const AddressCard = ({ direccion, isSelected, onClick, distanceKm }: { 
  direccion: DireccionGuardada; 
  isSelected: boolean;
  onClick: () => void;
  distanceKm?: number | null;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={clsx(
      "p-4 border rounded-xl cursor-pointer transition-all duration-200",
      "hover:shadow-md",
      isSelected
        ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-50))]"
        : "border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))]"
    )}
    onClick={onClick}
  >
    <div className="flex items-start gap-3">
      <div className={clsx(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
        isSelected ? "bg-[rgb(var(--brand-600))] text-white" : "bg-[rgb(var(--brand-50))] text-[rgb(var(--brand-600))]"
      )}>
        <MapPinIcon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-[rgb(var(--brand-900))]">{direccion.direccion}</h4>
        <p className="text-sm text-[rgb(var(--brand-600))]">{direccion.ciudad}</p>
        {direccion.codigoPostal && (
          <p className="text-sm text-[rgb(var(--brand-600))]">CP: {direccion.codigoPostal}</p>
        )}
        {isSelected && typeof distanceKm === "number" && Number.isFinite(distanceKm) && distanceKm > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs text-[rgb(var(--brand-700))]">
            <TbRoute className="h-4 w-4 text-[rgb(var(--brand-600))]" />
            <span>{distanceKm.toFixed(1)} km al depósito</span>
          </div>
        )}
      </div>
      <div className={clsx(
        "shrink-0 rounded-full border-2 h-5 w-5 flex items-center justify-center",
        isSelected ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-600))]" : "border-[rgb(var(--brand-300))]"
      )}>
        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
    </div>
  </motion.div>
);

// Componente de AddressCardSkeleton para el estado de carga
const AddressCardSkeleton = () => (
  <div className="p-4 border rounded-xl">
    <div className="flex items-start gap-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-5 w-5 rounded-full" />
    </div>
  </div>
);

const StepTwo = ({
  register,
  errors,
  setValue,
  onNext,
  setStep,
  onProcessingChange,
}: StepTwoProps) => {
  const { user } = useAuth();
  const { cart } = useCart();
  const { toast } = useToast();
  const prefillAppliedRef = useRef(false);
  const prefillMetaRef = useRef<{
    source: "saved" | "new" | null;
    addressId: string | null;
    lat: number;
    lng: number;
    direccion: string;
    ciudad: string;
  } | null>(null);
  const prefillResolvedRef = useRef(false);
  const didAutoSelectSavedRef = useRef(false);
  const [isStoresLoading, setIsStoresLoading] = useState(true);
  const [isEstimatingShipping, setIsEstimatingShipping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shippingEstimate, setShippingEstimate] = useState<{ price: number | null; tierKm: number | null } | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [savedAddressesReady, setSavedAddressesReady] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isMountedRef = useRef(true);
  const [useSaved, setUseSaved] = useState(true);
  const [storeLocations, setStoreLocations] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [deliveryType, setDeliveryType] = useState<"envio" | "retiro" | null>(null);
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [requiresCotizacion, setRequiresCotizacion] = useState(false);
  const [cotizacionReason, setCotizacionReason] = useState<"peso" | "zona" | null>(null);
  const savedDraftRef = useRef<{
    selectedValue: string | null;
    selectedAddress: any | null;
    isValidAddress: boolean;
    direccion: string;
    ciudad: string;
    codigoPostal: string;
    lat: number | null;
    lng: number | null;
  } | null>(null);
  const newDraftRef = useRef<{
    selectedValue: string | null;
    selectedAddress: any | null;
    isValidAddress: boolean;
    direccion: string;
    ciudad: string;
    codigoPostal: string;
    lat: number | null;
    lng: number | null;
  } | null>(null);
  const {
    watch,
    trigger,
    getValues,
  } = useFormContext<Step2Data>();

  useEffect(() => {
    onProcessingChange?.(isSaving);
    return () => {
      onProcessingChange?.(false);
    };
  }, [isSaving, onProcessingChange]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Hooks a nivel superior (evita invalid hook call)
  const { guardar, guardando } = useGuardarDireccionCliente();

  const address = watch("direccion");
  const city = watch("ciudad");
  const postalCode = watch("codigoPostal");
  const deliveryMethod = watch("metodoEntrega");
  const distanciaKm = watch("distanciaKm");
  
  const { validateAddressAsync } = useDeliveryValidation();

  const totalWeightKg = useMemo(() => {
    return (cart?.items || []).reduce((sum: number, item: any) => {
      const w = Number(item?.weightKg);
      if (Number.isFinite(w) && w > 0) {
        return sum + w * (Number(item.quantity) || 0);
      }
      return sum;
    }, 0);
  }, [cart?.items]);

  const lastEstimateKeyRef = useRef<string | null>(null);

  const estimateShippingForCoords = useCallback(async (meta: {
    lat: number;
    lng: number;
    source: "saved" | "new";
    addressId: string | null;
    direccion: string;
    ciudad: string;
    codigoPostal: string;
  }) => {
    const lat = Number(meta.lat);
    const lng = Number(meta.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const key = `${lat}:${lng}:${totalWeightKg > 0 ? totalWeightKg : 0}`;
    if (lastEstimateKeyRef.current === key) return;
    lastEstimateKeyRef.current = key;

    setIsEstimatingShipping(true);
    setShippingEstimate(null);

    try {
      const res = await validateAddressAsync(lat, lng, totalWeightKg > 0 ? totalWeightKg : null);

      if (!res || !("disponible" in res) || !res.disponible) {
        setErrorMessage(null);
        setRequiresCotizacion(true);
        const reason =
          totalWeightKg > 100 || (res as any)?.canShip === false ? "peso" : "zona";
        setCotizacionReason(reason);
        setValue("requiresQuote", true);
        (setValue as any)("cotizacionReason", reason);
        setValue("storeId", null);
        setValue("sucursal", null);
        setValue("distanciaKm", typeof (res as any)?.distanciaKm === "number" ? (res as any).distanciaKm : null);
        setValue("maxRadiusKm", typeof (res as any)?.maxRadiusKm === "number" ? (res as any).maxRadiusKm : null);
        setValue("shippingPrice", null);
        setValue("shippingEstimatedPrice", null);
        setValue("shippingTierKm", null);
        setShippingEstimate(null);

        return;
      }

      setRequiresCotizacion(false);
      setCotizacionReason(null);
      setValue("requiresQuote", false);
      (setValue as any)("cotizacionReason", null);
      setErrorMessage(null);

      const storeId = (res as any).sucursal?.id || (res as any).sucursal?.storeId || null;
      const sucursal = (res as any).sucursal || null;
      const km = typeof (res as any).distanciaKm === "number" ? (res as any).distanciaKm : null;
      const maxRadiusKm = typeof (res as any).sucursal?.radio === "number" ? (res as any).sucursal.radio / 1000 : null;

      setValue("storeId", storeId);
      setValue("sucursal", sucursal);
      setValue("distanciaKm", km);
      setValue("maxRadiusKm", maxRadiusKm);

      const resolvedPrice = Number((res as any).price ?? 0);
      const normalizedPrice = Number.isFinite(resolvedPrice) && resolvedPrice > 0 ? resolvedPrice : null;
      const tierKm = typeof (res as any).tierKm === "number" ? (res as any).tierKm : null;

      setShippingEstimate({ price: normalizedPrice, tierKm });
      setValue("shippingPrice", normalizedPrice);
      setValue("shippingEstimatedPrice", normalizedPrice);
      setValue("shippingTierKm", tierKm);
    } finally {
      setIsEstimatingShipping(false);
    }
  }, [setValue, totalWeightKg, validateAddressAsync]);

  const deliveryOptions = [
    {
      id: "envio",
      title: "Envío a domicilio",
      description: "Recibe tu pedido en la dirección que prefieras",
      icon: TruckIcon,
    },
    {
      id: "retiro",
      title: "Retiro en tienda",
      description: "Retira tu pedido en nuestra tienda física",
      icon: ShoppingBagIcon,
    },
  ];

  const addressOptions = [
    {
      id: "saved",
      title: "Usar dirección guardada",
      description: "Selecciona una de tus direcciones guardadas",
      icon: MapPinIcon,
    },
    {
      id: "new",
      title: "Ingresar nueva dirección",
      description: "Completa el formulario con los datos de entrega",
      icon: TruckIcon,
    },
  ];

  // Cargar direcciones guardadas desde API externa
  const { direcciones, cargando, refetch } = useObtenerDireccionesCliente();
  useEffect(() => {
    if (cargando) {
      setSavedAddressesReady(false);
      return;
    }
    setSavedAddressesReady(true);
  }, [cargando]);



  useEffect(() => {
    if (Array.isArray(direcciones)) {
      // Adaptar shape externo al interno usado por el formulario
      const adaptadas: any[] = direcciones.map((d) => ({
        id: d.id,
        direccion: d.direccion,
        ciudad: d.ciudad,
        codigoPostal: d.codigoPostal,
        metodoEntrega: (d.metodoEntrega as any) || "envio",
        lat: d.lat,
        lng: d.lng,
        esFavorita: d.esFavorita,
      }));
      setSavedAddresses(adaptadas);
      if (
        !didAutoSelectSavedRef.current &&
        !prefillAppliedRef.current &&
        !(!prefillResolvedRef.current && prefillMetaRef.current?.source === null) &&
        useSaved &&
        adaptadas.length > 0 &&
        !selectedValue
      ) {
        const first = adaptadas[0];
        didAutoSelectSavedRef.current = true;
        setUseSaved(true);
        setSelectedValue(first.id);
        setSelectedAddress(first);
        setValue("direccion", first.direccion);
        setValue("ciudad", first.ciudad);
        setValue("codigoPostal", first.codigoPostal || "");
        setValue("lat", first.lat);
        setValue("lng", first.lng);
        setIsValidAddress(true);
      }
    }
  }, [direcciones, selectedValue, setValue, useSaved]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (prefillResolvedRef.current) return;
    const meta = prefillMetaRef.current;
    if (!meta) return;
    if (meta.source !== null) {
      prefillResolvedRef.current = true;
      return;
    }
    if (!Array.isArray(savedAddresses) || savedAddresses.length === 0) return;

    const match =
      savedAddresses.find((a) => Number(a?.lat) === meta.lat && Number(a?.lng) === meta.lng) ||
      savedAddresses.find((a) => String((a as any)?.direccion || "").trim() === meta.direccion.trim() && String((a as any)?.ciudad || "").trim() === meta.ciudad.trim()) ||
      null;

    if (match) {
      prefillAppliedRef.current = true;
      setUseSaved(true);
      setSelectedValue(match.id);
      setSelectedAddress(match);
      setIsValidAddress(true);
      setValue("direccion", (match as any).direccion);
      setValue("ciudad", (match as any).ciudad);
      setValue("codigoPostal", (match as any).codigoPostal || "");
      setValue("lat", (match as any).lat);
      setValue("lng", (match as any).lng);
    } else {
      const first = savedAddresses[0];
      if (first) {
        didAutoSelectSavedRef.current = true;
        setUseSaved(true);
        setSelectedValue(first.id);
        setSelectedAddress(first);
        setIsValidAddress(true);
        setValue("direccion", first.direccion);
        setValue("ciudad", first.ciudad);
        setValue("codigoPostal", first.codigoPostal || "");
        setValue("lat", first.lat);
        setValue("lng", first.lng);
      } else {
        setUseSaved(false);
        setSelectedValue(null);
        setSelectedAddress(null);
        setIsValidAddress(false);
      }
    }
    prefillResolvedRef.current = true;
  }, [savedAddresses, setValue]);

  useEffect(() => {
    if (deliveryType !== "envio") return;
    if (!useSaved) return;
    if (!selectedValue) return;
    if (shippingEstimate?.price && typeof distanciaKm === "number") return;

    const selected = savedAddresses.find((a) => String((a as any)?.id) === String(selectedValue));
    if (!selected) return;

    estimateShippingForCoords({
      lat: Number((selected as any).lat),
      lng: Number((selected as any).lng),
      source: "saved",
      addressId: String((selected as any).id),
      direccion: String((selected as any).direccion ?? (selected as any).address ?? ""),
      ciudad: String((selected as any).ciudad ?? (selected as any).city ?? ""),
      codigoPostal: String((selected as any).codigoPostal ?? (selected as any).postalCode ?? ""),
    });
  }, [deliveryType, distanciaKm, estimateShippingForCoords, savedAddresses, selectedValue, shippingEstimate?.price, useSaved]);

  // Cargar sucursales
  useEffect(() => {
    const loadStoreLocations = async () => {
      try {
        const settings = await api.get<{ locations?: any[] }>(`/settings/general`);
        const locations = Array.isArray(settings?.locations) ? settings.locations : [];
        if (locations.length > 0) {
          setStoreLocations([PICKUP_STORE_LOCATION]);
          return;
        }
        setStoreLocations([PICKUP_STORE_LOCATION]);
      } catch (error) {
        setStoreLocations([PICKUP_STORE_LOCATION]);
      } finally {
        setIsStoresLoading(false);
      }
    };

    loadStoreLocations();
  }, []);

  const handleAddressSelect = async (data: {
    direccion: string;
    ciudad: string;
    lat: number;
    lng: number;
    sucursal: any;
    postalCode: string;
  }) => {
    setErrorMessage(null);
    prefillAppliedRef.current = true;
    const address: any = {
      id: uuidv4(),
      direccion: data.direccion,
      ciudad: data.ciudad || "Buenos Aires",
      codigoPostal: data.postalCode,
      metodoEntrega: "envio",
      lat: data.lat,
      lng: data.lng,
      sucursal: data.sucursal
    };

    setSelectedAddress(address);
    setUseSaved(false);
    setSelectedValue(null);
    setIsEditing(false);
    setIsValidAddress(true);

    setValue("direccion", address.direccion);
    setValue("ciudad", address.ciudad);
    setValue("codigoPostal", address.codigoPostal || "");
    setValue("lat", address.lat);
    setValue("lng", address.lng);

    // Calcular peso total y cotizar precio estimado
    const totalWeightKg = (cart?.items || []).reduce((sum: number, item: any) => {
      const w = Number(item?.weightKg);
      if (Number.isFinite(w) && w > 0) {
        return sum + w * (Number(item.quantity) || 0);
      }
      return sum;
    }, 0);
    setIsEstimatingShipping(true);
    setShippingEstimate(null);
    try {
      const res = await validateAddressAsync(address.lat, address.lng, totalWeightKg > 0 ? totalWeightKg : null);
      if (!res || !("disponible" in res) || !res.disponible) {
        setIsValidAddress(true);
        setErrorMessage(null);
        setRequiresCotizacion(true);
        const reason =
          totalWeightKg > 100 || (res as any)?.canShip === false ? "peso" : "zona";
        setCotizacionReason(reason);
        setValue("requiresQuote", true);
        (setValue as any)("cotizacionReason", reason);
        setValue("storeId", null);
        setValue("sucursal", null);
        setValue("distanciaKm", null);
        setValue("maxRadiusKm", null);
        setValue("shippingPrice", null);
        setValue("shippingEstimatedPrice", null);
        setValue("shippingTierKm", null);
        setShippingEstimate(null);

        if (user?.email) {
          try {
            await guardar({
              direccion: address.direccion,
              ciudad: address.ciudad,
              codigoPostal: address.codigoPostal || "",
              metodoEntrega: "envio" as const,
              lat: address.lat,
              lng: address.lng,
              esFavorita: false,
            });
            await refetch();
          } catch {}
        }
        return;
      }

      setRequiresCotizacion(false);
      setCotizacionReason(null);
      setValue("requiresQuote", false);
      (setValue as any)("cotizacionReason", null);
      setErrorMessage(null);
      setValue("storeId", (res as any).sucursal?.id || (res as any).sucursal?.storeId || null);
      setValue("sucursal", (res as any).sucursal || null);
      setValue("distanciaKm", typeof (res as any).distanciaKm === "number" ? (res as any).distanciaKm : null);
      setValue("maxRadiusKm", typeof (res as any).sucursal?.radio === "number" ? (res as any).sucursal.radio / 1000 : null);

      if ("price" in res) {
        const resolvedPrice = Number((res as any).price ?? 0);
        const normalizedPrice = Number.isFinite(resolvedPrice) && resolvedPrice > 0 ? resolvedPrice : null;
        const tierKm = (res as any).tierKm ?? null;
        setShippingEstimate({ price: normalizedPrice, tierKm: typeof tierKm === "number" ? tierKm : null });
        setValue("shippingPrice", normalizedPrice);
        setValue("shippingEstimatedPrice", normalizedPrice);
        setValue("shippingTierKm", typeof tierKm === "number" ? tierKm : null);
      }
    } finally {
      setIsEstimatingShipping(false);
    }
  };

  const handleStoreSelect = (store: any) => {
    prefillAppliedRef.current = false;
    setSelectedStore(store);
    setValue("metodoEntrega", "retiro");
    setRequiresCotizacion(false);
    setCotizacionReason(null);
    setValue("requiresQuote", false);
    (setValue as any)("cotizacionReason", null);
    setValue("direccion", store.direccion);
    setValue("ciudad", store.nombre);
    setValue("codigoPostal", "");
    setValue("lat", store.lat);
    setValue("lng", store.lng);
    setValue("storeId", store.id || store.storeId || null);
    setValue("sucursal", store);
  };

  const handleNext = async () => {
    if (!deliveryType) {
      setErrorMessage("Por favor, selecciona un método de entrega");
      return;
    }

    if (deliveryType === "retiro") {
      if (!selectedStore) {
        setErrorMessage("Por favor, selecciona una tienda para retiro");
        return;
      }
      setIsSaving(true);
      setErrorMessage(null);
      try {
        await onNext();
        return;
      } finally {
        if (isMountedRef.current) setIsSaving(false);
      }
    }

    if (deliveryType === "envio") {
      let addressToCheck: { lat: number; lng: number } | null = null;

      if (useSaved && savedAddresses.length > 0) {
        if (!selectedValue) {
          setErrorMessage("Por favor, selecciona una dirección de la lista");
          return;
        }
        const selectedSavedAddress = savedAddresses.find(addr => addr.id === selectedValue);
        if (!selectedSavedAddress) {
          setErrorMessage("La dirección seleccionada no es válida");
          return;
        }
        if (!selectedSavedAddress.lat || !selectedSavedAddress.lng) {
          setErrorMessage("La dirección seleccionada no tiene coordenadas válidas");
          return;
        }
        
        addressToCheck = {
          lat: selectedSavedAddress.lat,
          lng: selectedSavedAddress.lng
        };
      } else if (!useSaved) {
        if (!selectedAddress) {
          setErrorMessage("Por favor, selecciona una dirección válida usando el buscador");
          return;
        }
        if (!selectedAddress.lat || !selectedAddress.lng) {
          setErrorMessage("La dirección seleccionada no tiene coordenadas válidas");
          return;
        }
        addressToCheck = {
          lat: selectedAddress.lat,
          lng: selectedAddress.lng
        };
      }

      if (!addressToCheck) {
        setErrorMessage("Error al procesar la dirección");
        return;
      }

      const totalWeightKg = (cart?.items || []).reduce((sum: number, item: any) => {
        const w = Number(item?.weightKg);
        if (Number.isFinite(w) && w > 0) {
          return sum + w * (Number(item.quantity) || 0);
        }
        return sum;
      }, 0);
      
      let finalAddress: string;
      let finalLat: number;
      let finalLng: number;
      let finalPostalCode: string;
      let finalCity: string;

      if (useSaved) {
        const savedAddr = savedAddresses.find(addr => addr.id === selectedValue);
        if (!(savedAddr as any)?.direccion || !savedAddr?.lat || !savedAddr?.lng || !(savedAddr as any)?.codigoPostal) {
          setErrorMessage("Error al procesar la dirección guardada");
          return;
        }
        finalAddress = (savedAddr as any).direccion;
        finalLat = savedAddr.lat;
        finalLng = savedAddr.lng;
        finalPostalCode = (savedAddr as any).codigoPostal;
        finalCity = (savedAddr as any).ciudad;
      } else {
        if (!(selectedAddress as any)?.direccion || !selectedAddress?.lat || !selectedAddress?.lng) {
          setErrorMessage("Error al procesar la nueva dirección");
          return;
        }
        finalAddress = (selectedAddress as any).direccion;
        finalLat = selectedAddress.lat;
        finalLng = selectedAddress.lng;
        finalPostalCode = (selectedAddress as any).codigoPostal || "";
        finalCity = (selectedAddress as any).ciudad;
      }

      setIsSaving(true);
      setErrorMessage(null);

      try {
        const maxWeightKg = 100;
        if (totalWeightKg > maxWeightKg) {
          setRequiresCotizacion(true);
          setCotizacionReason("peso");
          setValue("requiresQuote", true);
          (setValue as any)("cotizacionReason", "peso");
          setValue("storeId", null);
          setValue("sucursal", null);
          setValue("distanciaKm", null);
          setValue("maxRadiusKm", null);
          setValue("shippingPrice", null);
          setValue("shippingEstimatedPrice", null);
          setValue("shippingTierKm", null);
          if (!useSaved || (selectedValue && isEditing)) {
            if (user?.email) {
              await guardar({
                direccion: finalAddress,
                ciudad: finalCity,
                codigoPostal: finalPostalCode,
                metodoEntrega: "envio" as const,
                lat: finalLat,
                lng: finalLng,
                esFavorita: false,
              }, selectedValue || undefined);
              await refetch();
            }
          }
          await onNext();
          return;
        }

        const deliveryCheck = await validateAddressAsync(
          addressToCheck.lat,
          addressToCheck.lng,
          totalWeightKg > 0 ? totalWeightKg : null
        );

        if (!deliveryCheck.disponible) {
          const reason = (deliveryCheck as any)?.canShip === false ? "peso" : "zona";
          setRequiresCotizacion(true);
          setCotizacionReason(reason);
          setValue("requiresQuote", true);
          (setValue as any)("cotizacionReason", reason);
          setValue("storeId", null);
          setValue("sucursal", null);
          setValue("distanciaKm", typeof (deliveryCheck as any)?.distanciaKm === "number" ? (deliveryCheck as any).distanciaKm : null);
          setValue("maxRadiusKm", typeof (deliveryCheck as any)?.maxRadiusKm === "number" ? (deliveryCheck as any).maxRadiusKm : null);
          setValue("shippingPrice", null);
          setValue("shippingEstimatedPrice", null);
          setValue("shippingTierKm", null);
          if (!useSaved || (selectedValue && isEditing)) {
            if (user?.email) {
              await guardar({
                direccion: finalAddress,
                ciudad: finalCity,
                codigoPostal: finalPostalCode,
                metodoEntrega: "envio" as const,
                lat: finalLat,
                lng: finalLng,
                esFavorita: false,
              }, selectedValue || undefined);
              await refetch();
            }
          }
          await onNext();
          return;
        }

        setRequiresCotizacion(false);
        setCotizacionReason(null);
        setValue("requiresQuote", false);
        (setValue as any)("cotizacionReason", null);

        setValue("storeId", deliveryCheck.sucursal?.id || null);
        setValue("sucursal", deliveryCheck.sucursal);
        setValue("distanciaKm", deliveryCheck.distanciaKm || 0);
        setValue("maxRadiusKm", (deliveryCheck.sucursal?.radio || 0) / 1000);
        const fallbackEstimated = Number((watch as any)("shippingEstimatedPrice") ?? 0);
        const resolvedShippingPrice = Number.isFinite(Number(deliveryCheck.price))
          ? Number(deliveryCheck.price)
          : (Number.isFinite(fallbackEstimated) ? fallbackEstimated : 0);
        setValue("shippingPrice", resolvedShippingPrice > 0 ? resolvedShippingPrice : null);
        setValue("shippingEstimatedPrice", resolvedShippingPrice > 0 ? resolvedShippingPrice : null);
        setValue("shippingTierKm", deliveryCheck.tierKm ?? null);

        prefillAppliedRef.current = true;

        const direccionPayload = {
          direccion: finalAddress,
          ciudad: finalCity,
          codigoPostal: finalPostalCode,
          metodoEntrega: "envio" as const,
          lat: finalLat,
          lng: finalLng,
          esFavorita: false,
        };

        if (!useSaved || (selectedValue && isEditing)) {
          if (user?.email) {
            await guardar(direccionPayload, selectedValue || undefined);
            await refetch();
          }
        }

        await onNext();
        return;
      } catch (error) {
        console.error("Error al procesar el paso de entrega:", error);
        await onNext();
        return;
      } finally {
        if (isMountedRef.current) setIsSaving(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-28"
    >
      <h2
        className={cn([
          satoshi.className,
          "text-3xl font-bold text-center mb-6",
        ])}
      >
        {!deliveryType ? "Método de entrega" : "Dirección de entrega"}
      </h2>

      {/* Mensaje de error */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {requiresCotizacion && deliveryType === "envio" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-center mb-4"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-900 cursor-help">
                    <ExclamationCircleIcon className="h-5 w-5 text-yellow-700" />
                    <span className="font-semibold">Advertencia</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-white p-3 shadow-lg rounded-lg border">
                  <div className="space-y-1 text-sm text-[rgb(var(--brand-900))]">
                    <p className="font-semibold">Podés continuar igual</p>
                    <p className="text-[rgb(var(--brand-700))]">
                      {LOGISTICS_WARNING_MESSAGE}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        )}
      </AnimatePresence>

      {!deliveryType ? (
        <RadioGroup
          value={deliveryType}
          onChange={(type) => {
            setDeliveryType(type);
            setValue("metodoEntrega", type);
            if (type === "retiro") {
              setErrorMessage(null);
              prefillAppliedRef.current = false;
              setRequiresCotizacion(false);
              setCotizacionReason(null);
              setValue("requiresQuote", false);
              (setValue as any)("cotizacionReason", null);
            }
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {deliveryOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = option.id === deliveryType;
              const isDisabled = false;

              return (
                <RadioGroup.Option
                  key={option.id}
                  value={option.id}
                  className={({ active }) =>
                    clsx(
                      "relative rounded-2xl shadow-sm px-6 py-4 cursor-pointer flex items-start space-x-4",
                      "transition-all duration-200 ease-in-out",
                      "hover:shadow-md",
                      "border-2",
                      isDisabled && "opacity-60 cursor-not-allowed hover:shadow-none",
                      isSelected
                        ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-50))]"
                        : "border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))]",
                      active && !isSelected && "border-[rgb(var(--brand-300))] bg-[rgb(var(--brand-50))]"
                    )
                  }
                >
                  <>
                    <div
                      className={clsx(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                        isSelected
                          ? "bg-[rgb(var(--brand-600))] text-white"
                          : "bg-[rgb(var(--brand-50))] text-[rgb(var(--brand-600))]"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <RadioGroup.Label
                        className={clsx(
                          "block text-sm font-medium leading-6",
                          isSelected ? "text-[rgb(var(--brand-900))]" : "text-[rgb(var(--brand-900))]"
                        )}
                      >
                        {option.title}
                      </RadioGroup.Label>
                      <RadioGroup.Description className="mt-1 text-sm text-[rgb(var(--brand-600))]">
                        {isDisabled ? "Disponible solo con Mercado Pago / Transferencia" : option.description}
                      </RadioGroup.Description>
                    </div>
                    <div
                      className={clsx(
                        "shrink-0 rounded-full border-2 h-5 w-5 flex items-center justify-center",
                        isSelected
                          ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-600))]"
                          : "border-[rgb(var(--brand-300))]"
                      )}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </>
                </RadioGroup.Option>
              );
            })}
          </div>
        </RadioGroup>
      ) : (
        <>
          {deliveryType === "retiro" ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-medium text-[rgb(var(--brand-900))]">Retiro en tienda</h3>
                  <p className="text-sm text-[rgb(var(--brand-600))]">
                    Elegí la sucursal donde querés retirar tu pedido.
                  </p>
                </div>
                {selectedStore && (
                  <div className="shrink-0 rounded-full bg-[rgb(var(--brand-50))] border border-[rgb(var(--brand-200))] px-3 py-1 text-sm text-[rgb(var(--brand-700))]">
                    {selectedStore?.nombre}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {isStoresLoading ? (
                  <>
                    <AddressCardSkeleton />
                    <AddressCardSkeleton />
                    <AddressCardSkeleton />
                  </>
                ) : storeLocations.length === 0 ? (
                  <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-[rgb(var(--brand-200))] bg-[rgb(var(--brand-50))] p-6">
                    <p className="text-sm text-[rgb(var(--brand-700))]">
                      No hay sucursales disponibles en este momento. Por favor, elegí envío a domicilio o intentá más tarde.
                    </p>
                  </div>
                ) : (
                  storeLocations.map((store) => {
                    const isSelected = selectedStore?.nombre === store.nombre;

                    return (
                      <motion.button
                        key={store.nombre}
                        type="button"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStoreSelect(store)}
                        className={clsx(
                          "text-left w-full rounded-2xl border p-5 transition-all",
                          "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-600))]/15",
                          isSelected
                            ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-50))]"
                            : "border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] hover:border-[rgb(var(--brand-600))]"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={clsx(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                              isSelected ? "bg-[rgb(var(--brand-600))] text-white" : "bg-[rgb(var(--brand-50))] text-[rgb(var(--brand-600))]"
                            )}
                          >
                            <BuildingStorefrontIcon className="h-6 w-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-medium text-[rgb(var(--brand-900))] truncate">{store.nombre}</h4>
                              <div
                                className={clsx(
                                  "shrink-0 rounded-full border px-2.5 py-1 text-xs",
                                  isSelected
                                    ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-600))] text-white"
                                    : "border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] text-[rgb(var(--brand-700))]"
                                )}
                              >
                                {isSelected ? "Seleccionada" : "Seleccionar"}
                              </div>
                            </div>
                            <p className="mt-1 text-sm text-[rgb(var(--brand-600))]">{store.direccion}</p>
                            
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <>
              {savedAddresses.length > 0 && (
                <RadioGroup
                  value={useSaved}
                  onChange={(value) => {
                    const current = getValues();
                    const snapshot = {
                      selectedValue,
                      selectedAddress,
                      isValidAddress,
                      direccion: String((current as any).direccion || ""),
                      ciudad: String((current as any).ciudad || ""),
                      codigoPostal: String((current as any).codigoPostal || ""),
                      lat: (current as any).lat ?? null,
                      lng: (current as any).lng ?? null,
                    };
                    if (useSaved) {
                      savedDraftRef.current = snapshot;
                    } else {
                      newDraftRef.current = snapshot;
                    }
                    setUseSaved(value);
                    if (!value) {
                      const draft = newDraftRef.current;
                      if (draft) {
                        setSelectedValue(draft.selectedValue);
                        setSelectedAddress(draft.selectedAddress);
                        setIsValidAddress(draft.isValidAddress);
                        setValue("direccion", draft.direccion);
                        setValue("ciudad", draft.ciudad);
                        setValue("codigoPostal", draft.codigoPostal);
                        setValue("lat", draft.lat);
                        setValue("lng", draft.lng);
                      } else {
                        setSelectedValue(null);
                        setSelectedAddress(null);
                        setIsValidAddress(false);
                        setValue("direccion", "");
                        setValue("ciudad", "");
                        setValue("codigoPostal", "");
                        setValue("lat", null);
                        setValue("lng", null);
                      }
                      return;
                    }

                    const draft = savedDraftRef.current;
                    if (draft && draft.selectedValue && savedAddresses.some((a) => a.id === draft.selectedValue)) {
                      setSelectedValue(draft.selectedValue);
                      setSelectedAddress(draft.selectedAddress);
                      setIsValidAddress(draft.isValidAddress);
                      setValue("direccion", draft.direccion);
                      setValue("ciudad", draft.ciudad);
                      setValue("codigoPostal", draft.codigoPostal);
                      setValue("lat", draft.lat);
                      setValue("lng", draft.lng);
                      return;
                    }

                    if (selectedValue && savedAddresses.some((a) => a.id === selectedValue)) {
                      const found = savedAddresses.find((a) => a.id === selectedValue);
                      if (found) {
                        setSelectedValue(found.id);
                        setValue("direccion", (found as any).direccion ?? found.address);
                        setValue("ciudad", (found as any).ciudad ?? found.city);
                        setValue("codigoPostal", (found as any).codigoPostal ?? found.postalCode ?? "");
                        setValue("lat", found.lat);
                        setValue("lng", found.lng);
                        setIsValidAddress(true);
                        setSelectedAddress(found as any);
                        return;
                      }
                    }

                    if (savedAddresses.length > 0) {
                      const firstAddress = savedAddresses[0];
                      setSelectedValue(firstAddress.id);
                      setValue("direccion", (firstAddress as any).direccion ?? firstAddress.address);
                      setValue("ciudad", (firstAddress as any).ciudad ?? firstAddress.city);
                      setValue("codigoPostal", (firstAddress as any).codigoPostal ?? firstAddress.postalCode ?? "");
                      setValue("lat", firstAddress.lat);
                      setValue("lng", firstAddress.lng);
                      setIsValidAddress(true);
                      setSelectedAddress(firstAddress as any);
                    }
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addressOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = option.id === "saved" ? useSaved : !useSaved;

                      return (
                        <RadioGroup.Option
                          key={option.id}
                          value={option.id === "saved"}
                          className={({ active }) =>
                            clsx(
                              "relative rounded-2xl shadow-sm px-6 py-4 cursor-pointer flex items-start space-x-4",
                              "transition-all duration-200 ease-in-out",
                              "hover:shadow-md",
                              "border-2",
                              isSelected
                                ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-50))]"
                                : "border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))]",
                              active && !isSelected && "border-[rgb(var(--brand-300))] bg-[rgb(var(--brand-50))]"
                            )
                          }
                        >
                          <>
                            <div
                              className={clsx(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                                isSelected
                                  ? "bg-[rgb(var(--brand-600))] text-white"
                                  : "bg-[rgb(var(--brand-50))] text-[rgb(var(--brand-600))]"
                              )}
                            >
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <RadioGroup.Label
                                className={clsx(
                                  "block text-sm font-medium leading-6",
                                  isSelected ? "text-[rgb(var(--brand-900))]" : "text-[rgb(var(--brand-900))]"
                                )}
                              >
                                {option.title}
                              </RadioGroup.Label>
                              <RadioGroup.Description className="mt-1 text-sm text-[rgb(var(--brand-600))]">
                                {option.description}
                              </RadioGroup.Description>
                            </div>
                            <div
                              className={clsx(
                                "shrink-0 rounded-full border-2 h-5 w-5 flex items-center justify-center",
                                isSelected
                                  ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-600))]"
                                  : "border-[rgb(var(--brand-300))]"
                              )}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                          </>
                        </RadioGroup.Option>
                      );
                    })}
                  </div>
                </RadioGroup>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={useSaved ? "saved" : "new"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {useSaved && savedAddresses.length > 0 ? (
                    <div className="space-y-4">
                      {cargando ? (
                        <>
                          <AddressCardSkeleton />
                          <AddressCardSkeleton />
                        </>
                      ) : (
                        savedAddresses.map((addr) => (
                          <AddressCard
                            key={addr.id}
                            direccion={addr as DireccionGuardada}
                            isSelected={addr.id === selectedValue}
                            distanceKm={addr.id === selectedValue && typeof distanciaKm === "number" ? distanciaKm : null}
                            onClick={() => {
                              setSelectedValue(addr.id);
                              setValue("direccion", (addr as any).direccion ?? addr.address);
                              setValue("ciudad", (addr as any).ciudad ?? addr.city);
                              setValue("codigoPostal", (addr as any).codigoPostal ?? addr.postalCode ?? "");
                              setValue("lat", (addr as any).lat);
                              setValue("lng", (addr as any).lng);
                              setIsValidAddress(true);
                              setSelectedAddress(addr as any);
                              prefillAppliedRef.current = true;
                              prefillResolvedRef.current = true;
                              prefillMetaRef.current = {
                                source: "saved",
                                addressId: String(addr.id),
                                lat: Number((addr as any).lat),
                                lng: Number((addr as any).lng),
                                direccion: String((addr as any).direccion ?? addr.address ?? ""),
                                ciudad: String((addr as any).ciudad ?? addr.city ?? ""),
                              };
                              estimateShippingForCoords({
                                lat: Number((addr as any).lat),
                                lng: Number((addr as any).lng),
                                source: "saved",
                                addressId: String(addr.id),
                                direccion: String((addr as any).direccion ?? addr.address ?? ""),
                                ciudad: String((addr as any).ciudad ?? addr.city ?? ""),
                                codigoPostal: String((addr as any).codigoPostal ?? addr.postalCode ?? ""),
                              });
                            }}
                          />
                        ))
                      )}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      {!savedAddressesReady ? (
                        <div className="space-y-4">
                          <AddressCardSkeleton />
                          <AddressCardSkeleton />
                        </div>
                      ) : !isValidAddress ? (
                        <DeliveryAddressInput
                          onValidAddress={handleAddressSelect}
                        />
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 border rounded-xl bg-[rgb(var(--brand-50))] border-[rgb(var(--brand-200))]"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm text-[rgb(var(--brand-600))]">Dirección seleccionada</p>
                              <p className="font-medium text-[rgb(var(--brand-900))]">{(selectedAddress as any).direccion}</p>
                              <p className="text-sm text-[rgb(var(--brand-600))]">{(selectedAddress as any).ciudad}</p>
                              {watch("codigoPostal") && (
                                <p className="text-sm text-[rgb(var(--brand-600))]">CP: {watch("codigoPostal")}</p>
                              )}
                              {typeof distanciaKm === "number" && Number.isFinite(distanciaKm) && distanciaKm > 0 && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-[rgb(var(--brand-700))]">
                                  <TbRoute className="h-4 w-4 text-[rgb(var(--brand-600))]" />
                                  <span>{distanciaKm.toFixed(1)} km al depósito</span>
                                </div>
                              )}
                            </div>
                            <CheckCircleIcon className="h-6 w-6 text-green-500" />
                          </div>
                          {isEstimatingShipping ? (
                            <div className="mt-4 rounded-lg border border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] p-3 space-y-2">
                              <Skeleton className="h-4 w-2/3 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                              <Skeleton className="h-3 w-1/2 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                            </div>
                          ) : (
                            shippingEstimate && typeof shippingEstimate.price === 'number' && (
                              <div className="mt-4 rounded-lg border border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] p-3">
                                <div className="flex items-center gap-2 text-sm text-[rgb(var(--brand-700))]">
                                  <TbTruckDelivery className="h-5 w-5 text-[rgb(var(--brand-600))]" />
                                  <p>
                                    Envío: <span className="font-semibold text-[rgb(var(--brand-900))]">${shippingEstimate.price.toLocaleString('es-AR')}</span>
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                          <div className="mt-3">
                            <button
                              type="button"
                              className="text-sm text-blue-600 hover:underline"
                              onClick={() => {
                                prefillAppliedRef.current = false;
                                setIsValidAddress(false);
                                setSelectedAddress(null);
                                setValue("direccion", "");
                                setValue("ciudad", "");
                                setValue("codigoPostal", "");
                                setValue("lat", null);
                                setValue("lng", null);
                              }}
                            >
                              Cambiar dirección
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
              {/* Estimación para direcciones guardadas */}
              {useSaved && isValidAddress && (
                isEstimatingShipping ? (
                  <div className="rounded-xl border border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] p-4 space-y-2">
                    <Skeleton className="h-4 w-2/3 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                    <Skeleton className="h-3 w-1/2 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                  </div>
                ) : (
                  shippingEstimate && typeof shippingEstimate.price === 'number' && (
                    <div className="rounded-xl border border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))] p-4">
                      <div className="flex items-center gap-2 text-sm text-[rgb(var(--brand-700))]">
                        <TbTruckDelivery className="h-5 w-5 text-[rgb(var(--brand-600))]" />
                        <p>
                          Envío: <span className="font-semibold text-[rgb(var(--brand-900))]">${shippingEstimate.price.toLocaleString('es-AR')}</span>
                        </p>
                      </div>
                    </div>
                  )
                )
              )}
            </>
          )}
        </>
      )}

      <div className="fixed z-10 bottom-0 left-0 right-0 bg-[rgb(var(--surface))] border-t border-[rgb(var(--brand-200))] p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => {
              if (deliveryType) {
                setDeliveryType(null);
              } else {
                setStep(0);
              }
            }}
            disabled={isSaving}
            className={clsx(
              "btn-surface inline-flex items-center px-6 py-3 border border-[rgb(var(--brand-200))] shadow-sm text-base font-medium rounded-full",
              "text-[rgb(var(--brand-900))] bg-[rgb(var(--surface))] hover:bg-[rgb(var(--brand-50))]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver
          </motion.button>
          {deliveryType && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleNext}
              disabled={isSaving || (deliveryType === "envio" && !isValidAddress) || (deliveryType === "retiro" && !selectedStore)}
              className={clsx(
                "btn-brand text-white rounded-full w-full max-w-[200px] h-[48px]",
                "transition-all duration-200 ease-in-out",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Generando compra...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Continuar</span>
                  {requiresCotizacion && deliveryType === "envio" && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center justify-center">
                            <ExclamationCircleIcon className="h-5 w-5 text-yellow-200" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-white p-3 shadow-lg rounded-lg border">
                          <div className="space-y-1 text-sm text-[rgb(var(--brand-900))]">
                            <p className="font-semibold">Se registrará como pendiente</p>
                            <p className="text-[rgb(var(--brand-700))]">
                              {cotizacionReason === "peso"
                                ? "Supera 100 kg. Confirmás y lo gestionamos por WhatsApp."
                                : "Fuera de zona. Confirmás y lo gestionamos por WhatsApp."}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StepTwo;
