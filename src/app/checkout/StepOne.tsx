import React, { useEffect, useRef, useState } from "react";
import { useAuth } from '@/context/AuthContext';
import { api } from "@/lib/api";
import { useGuardarPerfilCliente } from "@/lib/hooks/useSaveClientProfile";
import { useObtenerPerfilCliente } from "@/lib/hooks/useGetClientProfile";
import { auth } from "@/lib/firebase";
import { v4 as uuidv4 } from "uuid";
import { useFormContext } from "react-hook-form";
import { Step1Data } from "./schema";
import { motion, AnimatePresence } from "framer-motion";
import { RadioGroup } from "@headlessui/react";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  UserIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import clsx from "clsx";
import { satoshi } from "@/styles/fonts";
import { cn } from "@/lib/utils";

interface SavedProfile extends Step1Data {
  id: string;
  isFavorite?: boolean;
}

interface StepOneProps {
  userEmail?: string;
  useSaved: boolean;
  setUseSaved: React.Dispatch<React.SetStateAction<boolean>>;
  onNext: () => void | Promise<void>;
  onProcessingChange?: (busy: boolean) => void;
  isPaymentMethodReady?: boolean;
}

// Definir el tipo para InputField
interface InputFieldProps {
  id: keyof Step1Data;
  label: string;
  register: any;
  errors: any;
  disabled?: boolean;
  validation?: {
    required?: boolean;
    pattern?: {
      value: RegExp;
      message: string;
    };
    minLength?: {
      value: number;
      message: string;
    };
  };
}

const InputField = ({
  id,
  label,
  register,
  errors,
  disabled = false,
  validation,
}: InputFieldProps) => {
  const error = errors[id];

  return (
    <div className="relative mb-4">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[rgb(var(--brand-700))] mb-2"
      >
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          id={id}
          disabled={disabled}
          {...register(id, {
            required: validation?.required && "Este campo es requerido",
            pattern: validation?.pattern,
            minLength: validation?.minLength,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              // Aquí puedes agregar lógica de validación en tiempo real si es necesario
            },
          })}
          className={clsx(
            "block w-full px-4 py-3 rounded-xl border shadow-sm transition-all duration-200",
            "text-base bg-[rgb(var(--surface))] focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[rgb(var(--brand-600))]/25",
            {
              "border-[rgb(var(--brand-200))] focus:border-[rgb(var(--brand-600))]":
                !error && !disabled,
              "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500/30":
                error,
              "bg-[rgb(var(--brand-50))] border-[rgb(var(--brand-200))] text-[rgb(var(--brand-500))]": disabled,
            }
          )}
        />
        {error && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ExclamationCircleIcon
              className="h-5 w-5 text-red-500"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" id={`${id}-error`}>
          {error.message}
        </p>
      )}
    </div>
  );
};

const SkeletonBlock = ({ className }: { className: string }) => {
  return (
    <div
      className={cn([
        "relative overflow-hidden rounded-xl bg-[rgb(var(--brand-100))] border border-[rgb(var(--brand-200))]",
        className,
      ])}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-[rgb(var(--surface))]/70 to-transparent" />
    </div>
  );
};

const StepOneSkeleton = () => {
  return (
    <div className="space-y-8">
      <SkeletonBlock className="h-9 w-64 mx-auto rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SkeletonBlock className="h-24 rounded-2xl border-[rgb(var(--brand-200))]" />
        <SkeletonBlock className="h-24 rounded-2xl border-[rgb(var(--brand-200))]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-28 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
          <SkeletonBlock className="h-12 rounded-xl border-[rgb(var(--brand-200))]" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-36 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
          <SkeletonBlock className="h-12 rounded-xl border-[rgb(var(--brand-200))]" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-24 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
          <SkeletonBlock className="h-12 rounded-xl border-[rgb(var(--brand-200))]" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-16 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
          <SkeletonBlock className="h-12 rounded-xl border-[rgb(var(--brand-200))]" />
        </div>
      </div>
      <div className="fixed z-10 bottom-0 left-0 right-0 bg-[rgb(var(--surface))] border-t border-[rgb(var(--brand-200))] p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-end items-center">
          <SkeletonBlock className="rounded-full w-full max-w-[200px] h-[48px] border-0 bg-[rgb(var(--brand-300))]" />
        </div>
      </div>
    </div>
  );
};

const StepOne = ({
  userEmail,
  useSaved,
  setUseSaved,
  onNext,
  onProcessingChange,
  isPaymentMethodReady = true,
}: StepOneProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [showSavedInfo, setShowSavedInfo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInitialSkeleton, setShowInitialSkeleton] = useState(true);

  const {
    register,
    formState: { errors, isValid },
    setValue,
    watch,
    handleSubmit,
    trigger,
    getValues,
  } = useFormContext<Step1Data>();

  const nombre = watch("nombre");
  const telefono = watch("telefono");
  const dni = watch("dni");
  const email = watch("email");
  const paymentMethod = watch("paymentMethod");
  const { guardar } = useGuardarPerfilCliente();
  const savedDraftRef = useRef<Pick<Step1Data, "nombre" | "email" | "telefono" | "dni"> | null>(null);
  const newDraftRef = useRef<Pick<Step1Data, "nombre" | "email" | "telefono" | "dni"> | null>(null);
  const initialHydratedRef = useRef(false);

  // Obtener perfil desde API externa y prellenar
  const { perfil, cargando: cargandoPerfil } = useObtenerPerfilCliente();
  useEffect(() => {
    if (!perfil) {
      if (user?.email) {
        setValue("email", user.email);
      }
      return;
    }

    const draft = {
      email: perfil.email || "",
      nombre: perfil.nombre || "",
      telefono: perfil.telefono || "",
      dni: perfil.dni || "",
    };

    savedDraftRef.current = draft;

    if (!initialHydratedRef.current) {
      initialHydratedRef.current = true;
      setUseSaved(true);
      setShowSavedInfo(true);
      setIsEditing(false);
      setValue("email", draft.email);
      setValue("nombre", draft.nombre);
      setValue("telefono", draft.telefono);
      setValue("dni", draft.dni);
      return;
    }

    if (useSaved) {
      setShowSavedInfo(true);
      setIsEditing(false);
      setValue("email", draft.email);
      setValue("nombre", draft.nombre);
      setValue("telefono", draft.telefono);
      setValue("dni", draft.dni);
    }
  }, [perfil, user?.email, setValue, setUseSaved, useSaved]);

  // Cargar datos guardados en el formulario
  useEffect(() => {
    const target = useSaved ? savedDraftRef.current : newDraftRef.current;
    if (target) {
      setValue("email", target.email || user?.email || "");
      setValue("nombre", target.nombre || "");
      setValue("telefono", target.telefono || "");
      setValue("dni", target.dni || "");
      if (useSaved) {
        setShowSavedInfo(true);
      } else {
        setShowSavedInfo(false);
      }
      setIsEditing(false);
    } else if (!useSaved) {
      setValue("nombre", "");
      setValue("telefono", "");
      setValue("dni", "");
      setShowSavedInfo(false);
      setIsEditing(false);
      setSelectedValue("");
    } else if (useSaved && savedDraftRef.current) {
      setShowSavedInfo(true);
      setIsEditing(false);
    }
  }, [useSaved, setValue, user?.email]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialSkeleton(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Seleccionar info guardada
  const handleSavedInfoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedValue(value);

    if (value) {
      const selectedProfile = savedProfiles.find(
        (profile) => profile.id === value
      );
      if (selectedProfile) {
        const draft = {
          email: email || user?.email || "",
          nombre: selectedProfile.nombre,
          telefono: selectedProfile.telefono,
          dni: selectedProfile.dni,
        };
        savedDraftRef.current = draft;
        setShowSavedInfo(true);
        setIsEditing(false);
        setValue("nombre", draft.nombre);
        setValue("telefono", draft.telefono);
        setValue("dni", draft.dni);
      }
    } else {
      setShowSavedInfo(false);
      setIsEditing(false);
      setValue("nombre", "");
      setValue("telefono", "");
      setValue("dni", "");
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleNext = async () => {
    const isFormValid = await trigger();
    if (!isFormValid) {
      setErrorMessage("Por favor, completa todos los campos correctamente.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload = { email: email || user?.email || "", nombre, telefono, dni, origen: "ecommerce" };
      await fetch("/api/upsert-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
      if (auth?.currentUser) {
        await guardar(payload);
      }
      await onNext();
    } catch (error) {
      console.error("Error al guardar el perfil:", error);
      setErrorMessage("Ocurrió un error al guardar tus datos. Por favor, intenta nuevamente.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    onProcessingChange?.(isSaving);
    return () => {
      onProcessingChange?.(false);
    };
  }, [isSaving, onProcessingChange]);

  // Validación en tiempo real
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name && type === "change") {
        trigger(name as keyof Step1Data);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, trigger]);

  const options = [
    {
      id: "saved",
      title: "Usar información guardada",
      description: "Selecciona uno de tus perfiles guardados",
      icon: UserIcon,
    },
    {
      id: "new",
      title: "Ingresar nueva información",
      description: "Completa el formulario con tus datos",
      icon: DocumentTextIcon,
    },
  ];

  // Flags para determinar disponibilidad de información guardada
  const hayPerfilesGuardados = savedProfiles.length > 0;
  const tienePerfilGuardado = Boolean(perfil);
  const mostrarOpciones = hayPerfilesGuardados || tienePerfilGuardado;
  const shouldShowSkeleton = showInitialSkeleton || cargandoPerfil;

  if (shouldShowSkeleton) {
    return <StepOneSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <h2
        className={cn([
          satoshi.className,
          "text-3xl font-bold text-center mb-6",
        ])}
      >
        Información personal
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
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mostrarOpciones && (
        <RadioGroup
          value={useSaved}
          onChange={(value) => {
            const current = getValues();
            const snapshot = {
              email: String(current.email || user?.email || ""),
              nombre: String(current.nombre || ""),
              telefono: String(current.telefono || ""),
              dni: String(current.dni || ""),
            };
            if (useSaved) {
              savedDraftRef.current = snapshot;
            } else {
              newDraftRef.current = snapshot;
            }
            setUseSaved(value);
            if (!value) {
              setShowSavedInfo(false);
              setIsEditing(false);
              setSelectedValue("");
            }
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {options.map((option) => {
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
                      "border-2",
                      isSelected
                        ? "border-[rgb(var(--brand-600))] bg-[rgb(var(--brand-50))]"
                        : "border-[rgb(var(--brand-200))] bg-[rgb(var(--surface))]",
                      active && !isSelected && "border-[rgb(var(--brand-300))] bg-[rgb(var(--brand-50))]"
                    )
                  }
                >
                  {({ checked }) => (
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
                  )}
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
          {useSaved && (hayPerfilesGuardados || tienePerfilGuardado) ? (
            <>
              {hayPerfilesGuardados ? (
                <>
                  <div className="flex flex-col">
                    <label
                      htmlFor="savedInfo"
                      className="text-sm font-medium text-[rgb(var(--brand-700))] mb-2"
                    >
                      Seleccionar información guardada
                    </label>
                    <select
                      id="savedInfo"
                      value={selectedValue}
                      onChange={handleSavedInfoSelect}
                      className="w-full px-4 py-3 text-base border rounded-xl shadow-sm bg-[rgb(var(--surface))]
                        transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-600))]/25
                        border-[rgb(var(--brand-200))] focus:border-[rgb(var(--brand-600))]
                        hover:bg-[rgb(var(--brand-50))]"
                    >
                      <option value="">Seleccionar...</option>
                      {savedProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.nombre}
                        </option>
                      ))}
                    </select>
                    {showSavedInfo && (
                      <p className="text-sm text-[rgb(var(--brand-700))] mt-2">
                        Perfil seleccionado. Puedes continuar o editar los datos si
                        lo deseas.
                      </p>
                    )}
                  </div>

                  <AnimatePresence>
                    {showSavedInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                      >
                        {isEditing ? (
                          <>
                            <InputField
                              id="nombre"
                              label="Nombre completo"
                              register={register}
                              errors={errors}
                              disabled={!isEditing && showSavedInfo}
                              validation={{
                                required: true,
                                minLength: {
                                  value: 3,
                                  message:
                                    "El nombre debe tener al menos 3 caracteres",
                                },
                              }}
                            />
                            <InputField
                              id="email"
                              label="Correo electrónico"
                              register={register}
                              errors={errors}
                              disabled={!isEditing && showSavedInfo}
                              validation={{
                                required: true,
                                pattern: {
                                  value:
                                    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                                  message: "Ingresa un correo electrónico válido",
                                },
                              }}
                            />
                            <InputField
                              id="telefono"
                              label="Teléfono"
                              register={register}
                              errors={errors}
                              disabled={!isEditing && showSavedInfo}
                              validation={{
                                required: true,
                                pattern: {
                                  value: /^[0-9]{10}$/,
                                  message:
                                    "Ingresa un número de teléfono válido (10 dígitos)",
                                },
                              }}
                            />
                            <InputField
                              id="dni"
                              label="DNI"
                              register={register}
                              errors={errors}
                              disabled={!isEditing && showSavedInfo}
                              validation={{
                                required: true,
                                pattern: {
                                  value: /^[0-9]{8}$/,
                                  message: "Ingresa un DNI válido (8 dígitos)",
                                },
                              }}
                            />
                          </>
                        ) : (
                          <>
                            <DisplayField
                              label="Nombre completo"
                              value={watch("nombre")}
                              onEdit={handleEdit}
                            />
                            <DisplayField
                              label="Correo electrónico"
                              value={watch("email")}
                            />
                            <DisplayField
                              label="Teléfono"
                              value={watch("telefono")}
                              onEdit={handleEdit}
                            />
                            <DisplayField
                              label="DNI"
                              value={watch("dni")}
                              onEdit={handleEdit}
                            />
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                // Caso: hay un único perfil (perfil) pero no lista de perfiles guardados
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {isEditing ? (
                    <>
                      <InputField
                        id="nombre"
                        label="Nombre completo"
                        register={register}
                        errors={errors}
                        disabled={!isEditing && showSavedInfo}
                        validation={{
                          required: true,
                          minLength: {
                            value: 3,
                            message: "El nombre debe tener al menos 3 caracteres",
                          },
                        }}
                      />
                      <InputField
                        id="email"
                        label="Correo electrónico"
                        register={register}
                        errors={errors}
                        disabled={!isEditing && showSavedInfo}
                        validation={{
                          required: true,
                          pattern: {
                            value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                            message: "Ingresa un correo electrónico válido",
                          },
                        }}
                      />
                      <InputField
                        id="telefono"
                        label="Teléfono"
                        register={register}
                        errors={errors}
                        disabled={!isEditing && showSavedInfo}
                        validation={{
                          required: true,
                          pattern: {
                            value: /^[0-9]{10}$/,
                            message:
                              "Ingresa un número de teléfono válido (10 dígitos)",
                          },
                        }}
                      />
                      <InputField
                        id="dni"
                        label="DNI"
                        register={register}
                        errors={errors}
                        disabled={!isEditing && showSavedInfo}
                        validation={{
                          required: true,
                          pattern: {
                            value: /^[0-9]{8}$/,
                            message: "Ingresa un DNI válido (8 dígitos)",
                          },
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <DisplayField
                        label="Nombre completo"
                        value={watch("nombre")}
                        onEdit={handleEdit}
                      />
                      <DisplayField
                        label="Correo electrónico"
                        value={watch("email")}
                      />
                      <DisplayField
                        label="Teléfono"
                        value={watch("telefono")}
                        onEdit={handleEdit}
                      />
                      <DisplayField
                        label="DNI"
                        value={watch("dni")}
                        onEdit={handleEdit}
                      />
                    </>
                  )}
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <InputField
                id="nombre"
                label="Nombre completo"
                register={register}
                errors={errors}
                disabled={!isEditing && showSavedInfo}
                validation={{
                  required: true,
                  minLength: {
                    value: 3,
                    message: "El nombre debe tener al menos 3 caracteres",
                  },
                }}
              />
              <InputField
                id="email"
                label="Correo electrónico"
                register={register}
                errors={errors}
                disabled={!isEditing && showSavedInfo}
                validation={{
                  required: true,
                  pattern: {
                    value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                    message: "Ingresa un correo electrónico válido",
                  },
                }}
              />
              <InputField
                id="telefono"
                label="Teléfono"
                register={register}
                errors={errors}
                disabled={!isEditing && showSavedInfo}
                validation={{
                  required: true,
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message:
                      "Ingresa un número de teléfono válido (10 dígitos)",
                  },
                }}
              />
              <InputField
                id="dni"
                label="DNI"
                register={register}
                errors={errors}
                disabled={!isEditing && showSavedInfo}
                validation={{
                  required: true,
                  pattern: {
                    value: /^[0-9]{8}$/,
                    message: "Ingresa un DNI válido (8 dígitos)",
                  },
                }}
              />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="fixed z-10 bottom-0 left-0 right-0 bg-[rgb(var(--surface))] border-t border-[rgb(var(--brand-200))] p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => router.push("/cart")}
            disabled={isSaving}
            className={clsx(
              "btn-surface inline-flex items-center px-6 py-3 shadow-sm text-xs font-medium rounded-full",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Volver
          </motion.button>
          <motion.button
            type="button"
            onClick={handleNext}
            disabled={isSaving || !isPaymentMethodReady}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={clsx(
              "text-white rounded-full w-full max-w-[200px] h-[48px]",
              "transition-all duration-200 ease-in-out",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isSaving ? "bg-[rgb(var(--brand-300))]" : "btn-brand",
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
                <span>Guardando...</span>
              </>
            ) : (
              <span>Continuar</span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default StepOne;

const DisplayField = ({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string | undefined;
  onEdit?: () => void;
}) => (
  <div className="flex flex-col mb-4">
    <label className="text-sm font-medium text-[rgb(var(--brand-700))] mb-2">{label}</label>
    <div className="relative group">
      <div
        className="w-full px-4 py-3 text-base border rounded-xl shadow-sm bg-[rgb(var(--brand-50))] border-[rgb(var(--brand-200))]
        transition-all duration-200 ease-in-out group-hover:bg-[rgb(var(--brand-100))]"
      >
        {value || ""}
      </div>
      {onEdit && (
        <motion.button
          type="button"
          onClick={onEdit}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute right-3 top-1/2 -translate-y-1/2 
            text-[rgb(var(--brand-400))] hover:text-[rgb(var(--brand-900))] transition-colors"
        >
          <PencilIcon className="h-5 w-5" />
        </motion.button>
      )}
    </div>
  </div>
);
