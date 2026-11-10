"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useObtenerPerfilCliente } from "@/lib/hooks/useGetClientProfile";
import { useGuardarPerfilCliente } from "@/lib/hooks/useSaveClientProfile";
import DeliveryAddressInput from "@/components/checkout/DeliveryAddressInput";
import { cn } from "@/lib/utils";

interface UserProfile {
  id?: string;
  fullName?: string;
  nombre?: string;
  email: string;
  phone?: string;
  telefono?: string;
  dni?: string;
  cuit?: string;
  createdAt?: any;
  creadoEn?: any;
  updatedAt?: any;
  actualizadoEn?: any;
  isFavorite?: boolean;
  direccion?: string;
  localidad?: string;
  partido?: string;
  codigoPostal?: string;
  barrio?: string;
  area?: string;
  lote?: string;
  lat?: number | null;
  lng?: number | null;
  esClienteViejo?: boolean;
  origen?: string;
}

interface ApiResponse {
  success: boolean;
  data: UserProfile | UserProfile[];
}

interface ClientProfile {
  uid: string;
  email: string;
  nombre: string;
  telefono: string;
  dni: string;
  cuit?: string;
  direccion?: string;
  localidad?: string;
  partido?: string;
  codigoPostal?: string;
  barrio?: string;
  area?: string;
  lote?: string;
  lat?: number | null;
  lng?: number | null;
  esClienteViejo?: boolean;
  origen?: string;
  creadoEn?: string;
  actualizadoEn?: string;
}

type NormalizedUserProfile = {
  id?: string;
  email: string;
  nombre: string;
  telefono: string;
  dni: string;
  cuit: string;
  isFavorite?: boolean;
  creadoEn?: any;
  actualizadoEn?: any;
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

const AccountPageSkeleton = ({ variant }: { variant: "loading" | "unauth" }) => {
  return (
    <main className="min-h-screen bg-[rgb(var(--page-bg))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="text-center mb-8 lg:mb-12">
          <div className="flex items-center justify-center">
            <SkeletonBlock className="h-10 w-56 rounded-2xl border-0 bg-[rgb(var(--brand-200))]" />
          </div>
          <div className="flex items-center justify-center mt-4">
            <SkeletonBlock className="h-4 w-[520px] max-w-full rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
          </div>
        </div>

        {variant === "unauth" && (
          <div className="mb-6">
            <Card className="bg-[rgb(var(--surface)/0.92)] border border-[rgb(var(--brand-600)/0.14)] rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--brand-900))]">Iniciá sesión para acceder a tu cuenta</p>
                  <p className="text-xs text-[rgb(var(--brand-700))]">Estamos abriendo el acceso automáticamente.</p>
                </div>
                <Button className="btn-brand rounded-xl" type="button">
                  Iniciar sesión
                </Button>
              </div>
            </Card>
          </div>
        )}

        <div className="space-y-6">
          <Card className="backdrop-blur-sm bg-[rgb(var(--surface)/0.88)] border border-[rgb(var(--brand-600)/0.16)] shadow-2xl rounded-2xl p-6 lg:p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <SkeletonBlock className="h-6 w-44 rounded-xl border-0 bg-[rgb(var(--brand-200))]" />
                  <SkeletonBlock className="h-3 w-64 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                </div>
                <SkeletonBlock className="h-10 w-36 rounded-xl border-0 bg-[rgb(var(--brand-200))]" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <SkeletonBlock className="h-3 w-28 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                    <SkeletonBlock className="h-10 w-full rounded-xl border-0 bg-[rgb(var(--brand-200))]" />
                  </div>
                ))}
              </div>
              <div className="space-y-4 pt-4">
                <SkeletonBlock className="h-4 w-44 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                <SkeletonBlock className="h-10 w-full rounded-xl border-0 bg-[rgb(var(--brand-200))]" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonBlock key={i} className="h-10 w-full rounded-xl border-0 bg-[rgb(var(--brand-200))]" />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default function AccountPage() {
  const { user: session, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [editingClientProfile, setEditingClientProfile] = useState<ClientProfile | null>(null);
  const [editingFields, setEditingFields] = useState<{[key: string]: boolean}>({});
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [profileFormMode, setProfileFormMode] = useState<"view" | "edit" | "create">("view");
  const [profileDraft, setProfileDraft] = useState<NormalizedUserProfile | null>(null);
  const loginRequestedRef = useRef(false);
  const router = useRouter();

  const { perfil: clientProfile, cargando: clientProfileLoading, refetch: refetchClientProfile } = useObtenerPerfilCliente();
  const { guardar: guardarPerfilCliente } = useGuardarPerfilCliente();

  const normalizeProfile = (profile: UserProfile, emailFallback: string): NormalizedUserProfile => {
    return {
      id: profile.id,
      email: String(profile.email || emailFallback || ""),
      nombre: String(profile.nombre ?? profile.fullName ?? ""),
      telefono: String(profile.telefono ?? profile.phone ?? ""),
      dni: String(profile.dni ?? ""),
      cuit: String(profile.cuit ?? ""),
      isFavorite: Boolean(profile.isFavorite),
      creadoEn: profile.creadoEn ?? profile.createdAt,
      actualizadoEn: profile.actualizadoEn ?? profile.updatedAt,
    };
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.email) return setLoading(false);
      try {
        const response = await api.get<ApiResponse>(`/users/${encodeURIComponent(session.email)}/profiles`);
        
        let profilesArray: UserProfile[] = [];
        
        if (response && typeof response === 'object' && 'data' in response) {
          if (response.data) {
            if (response.data && typeof response.data === 'object' && 'id' in response.data) {
              profilesArray = [response.data as UserProfile];
            } else if (Array.isArray(response.data)) {
              profilesArray = response.data;
            }
          }
        } else if (Array.isArray(response)) {
          profilesArray = response;
        }
        
        setProfiles(profilesArray);
        if (profilesArray.length > 0) {
          const favorite = profilesArray.find((p) => p.isFavorite) || null;
          const resolved = favorite || profilesArray[profilesArray.length - 1];
          setSelectedProfile(resolved);
        } else {
          setSelectedProfile(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Error al cargar los datos del usuario");
        setAuthError("Error al cargar los datos del usuario");
        setProfiles([]);
        setSelectedProfile(null);
      } finally {
        setLoading(false);
      }
    };
    if (session) {
      fetchUserData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [session, authLoading]);

  useEffect(() => {
    if (!session?.email) return;
    if (!selectedProfile) {
      setProfileFormMode("view");
      setProfileDraft(null);
      return;
    }
    setProfileFormMode("view");
    setProfileDraft(normalizeProfile(selectedProfile, session.email));
  }, [selectedProfile, session?.email]);

  useEffect(() => {
    if (authLoading) return;
    if (session) return;
    if (loginRequestedRef.current) return;
    loginRequestedRef.current = true;

    try {
      const redirect = window.location.pathname + window.location.search;
      window.dispatchEvent(new CustomEvent("open-login", { detail: { redirect } }));
      const url = new URL(window.location.href);
      url.searchParams.set("login", "open");
      url.searchParams.set("redirect", redirect);
      window.history.replaceState({}, "", url.toString());
    } catch {}
  }, [authLoading, session]);

  useEffect(() => {
    if (clientProfile) {
      setEditingClientProfile({
        uid: clientProfile.uid,
        email: clientProfile.email,
        nombre: clientProfile.nombre,
        telefono: clientProfile.telefono,
        dni: clientProfile.dni,
        creadoEn: clientProfile.creadoEn,
        actualizadoEn: clientProfile.actualizadoEn
      });
    }
  }, [clientProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.email || !profileDraft) return;

    const payload: UserProfile = {
      id: profileDraft.id,
      email: session.email,
      nombre: profileDraft.nombre,
      telefono: profileDraft.telefono,
      dni: profileDraft.dni,
      cuit: profileDraft.cuit,
      isFavorite: profileDraft.isFavorite || false,
      actualizadoEn: new Date().toISOString(),
    };

    setSaving(true);
    try {
      if (profileFormMode === "create") {
        const newProfileId = crypto.randomUUID();
        const newProfile: UserProfile = {
          ...payload,
          id: newProfileId,
          creadoEn: new Date().toISOString(),
          actualizadoEn: new Date().toISOString(),
        };
        await api.post(`/users/${encodeURIComponent(session.email)}/profiles`, newProfile);
        setProfiles((prev) => [...(Array.isArray(prev) ? prev : []), newProfile]);
        setSelectedProfile(newProfile);
        setProfileFormMode("view");
        toast.success("Perfil creado correctamente");
        return;
      }

      if (!payload.id) return;
      await api.put(`/users/${encodeURIComponent(session.email)}/profiles/${encodeURIComponent(payload.id)}`, payload);
      setProfiles((prev) => (Array.isArray(prev) ? prev.map((p) => (p.id === payload.id ? { ...p, ...payload } : p)) : prev));
      setSelectedProfile((prev) => (prev?.id === payload.id ? { ...prev, ...payload } : prev));
      setProfileFormMode("view");
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(profileFormMode === "create" ? "Error al crear el perfil" : "Error al actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!session?.email) return;

    try {
      await api.delete(`/users/${encodeURIComponent(session.email)}/profiles/${encodeURIComponent(profileId)}`);
      
      setProfiles((prev) => {
        if (!Array.isArray(prev)) return prev;
        const nextProfiles = prev.filter((p) => p.id !== profileId);
        if (selectedProfile?.id === profileId) {
          const nextSelected = nextProfiles.find((p) => p.isFavorite) || nextProfiles[nextProfiles.length - 1] || null;
          setSelectedProfile(nextSelected);
          setProfileFormMode("view");
          if (nextSelected && session?.email) {
            setProfileDraft(normalizeProfile(nextSelected, session.email));
          } else {
            setProfileDraft(null);
          }
        }
        return nextProfiles;
      });
      
      toast.success("Perfil eliminado correctamente");
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast.error("Error al eliminar el perfil");
    }
  };

  const handleToggleFavoriteProfile = async (profileId: string) => {
    if (!session?.email) return;

    try {
      if (!Array.isArray(profiles)) return;
      
      const profile = profiles.find(p => p.id === profileId);
      if (!profile) return;

      const newIsFavorite = !profile.isFavorite;
      
      await api.put(`/users/${encodeURIComponent(session.email)}/profiles/${encodeURIComponent(profileId)}`, {
        isFavorite: newIsFavorite,
        actualizadoEn: new Date().toISOString()
      });

      const updatedProfiles = profiles.map(p => 
        p.id === profileId ? { ...p, isFavorite: newIsFavorite } : p
      );
      setProfiles(updatedProfiles);
      if (selectedProfile?.id === profileId) {
        setSelectedProfile({ ...selectedProfile, isFavorite: newIsFavorite });
      }

      if (newIsFavorite) {
        const otherProfiles = updatedProfiles.filter(p => p.id !== profileId);
        for (const otherProfile of otherProfiles) {
          if (otherProfile.isFavorite && otherProfile.id) {
            await api.put(`/users/${encodeURIComponent(session.email)}/profiles/${encodeURIComponent(otherProfile.id)}`, {
              isFavorite: false,
              actualizadoEn: new Date().toISOString()
            });
          }
        }
        setProfiles(updatedProfiles.map(p => 
          p.id !== profileId ? { ...p, isFavorite: false } : p
        ));
        if (selectedProfile) {
          setSelectedProfile((prev) => (prev ? { ...prev, isFavorite: prev.id === profileId } : prev));
        }
      }

      toast.success(newIsFavorite ? "Perfil marcado como favorito" : "Perfil desmarcado como favorito");
    } catch (error) {
      console.error("Error toggling favorite profile:", error);
      toast.error("Error al actualizar el perfil favorito");
    }
  };

  const handleClientProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClientProfile) return;

    setSaving(true);
    try {
      await guardarPerfilCliente({
        nombre: editingClientProfile.nombre,
        telefono: editingClientProfile.telefono,
        dni: editingClientProfile.dni,
        cuit: editingClientProfile.cuit,
        direccion: editingClientProfile.direccion,
        localidad: editingClientProfile.localidad,
        codigoPostal: editingClientProfile.codigoPostal
      });
      
      toast.success("Perfil del cliente actualizado correctamente");
      await refetchClientProfile();
      setEditingClientProfile(null);
    } catch (error) {
      console.error("Error updating client profile:", error);
      toast.error("Error al actualizar el perfil del cliente");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateClientProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClientProfile) return;

    setSaving(true);
    try {
      await guardarPerfilCliente({
        nombre: editingClientProfile.nombre,
        telefono: editingClientProfile.telefono,
        dni: editingClientProfile.dni,
        cuit: editingClientProfile.cuit,
        direccion: editingClientProfile.direccion,
        localidad: editingClientProfile.localidad,
        codigoPostal: editingClientProfile.codigoPostal
      });
      
      toast.success("Perfil del cliente creado correctamente");
      await refetchClientProfile();
      setEditingClientProfile(null);
    } catch (error) {
      console.error("Error creating client profile:", error);
      toast.error("Error al crear el perfil del cliente");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldEdit = (fieldName: string) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleFieldSave = async (fieldName: string, value: string) => {
    if (!clientProfile) return;
    
    setSaving(true);
    try {
      const updatedProfile = {
        ...clientProfile,
        [fieldName]: value,
        actualizadoEn: new Date().toISOString()
      };
      
      await guardarPerfilCliente({
        nombre: updatedProfile.nombre,
        telefono: updatedProfile.telefono,
        dni: updatedProfile.dni,
        cuit: updatedProfile.cuit,
        direccion: updatedProfile.direccion,
        localidad: updatedProfile.localidad,
        codigoPostal: updatedProfile.codigoPostal
      });
      
      toast.success("Campo actualizado correctamente");
      await refetchClientProfile();
      setEditingFields(prev => ({ ...prev, [fieldName]: false }));
    } catch (error) {
      console.error("Error updating field:", error);
      toast.error("Error al actualizar el campo");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldCancel = (fieldName: string) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: false }));
  };

  const handleAddressSelected = async (data: {
    direccion: string;
    ciudad: string;
    lat: number;
    lng: number;
    sucursal: any;
    postalCode: string;
  }) => {
    if (!clientProfile) return;
    setSaving(true);
    try {
      await guardarPerfilCliente({
        nombre: clientProfile.nombre,
        telefono: clientProfile.telefono,
        dni: clientProfile.dni,
        cuit: clientProfile.cuit,
        direccion: data.direccion,
        localidad: data.ciudad,
        partido: clientProfile.partido,
        codigoPostal: data.postalCode,
        barrio: clientProfile.barrio,
        area: clientProfile.area,
        lote: clientProfile.lote,
        lat: data.lat,
        lng: data.lng,
      });

      toast.success("Dirección actualizada correctamente");
      await refetchClientProfile();
      setIsEditingAddress(false);
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error("Error al actualizar la dirección");
    } finally {
      setSaving(false);
    }
  };

  const EditableField = ({ 
    fieldName, 
    label, 
    value, 
    loading = false,
    placeholder = "", 
    type = "text",
    required = false 
  }: {
    fieldName: string;
    label: string;
    value: string;
    loading?: boolean;
    placeholder?: string;
    type?: string;
    required?: boolean;
  }) => {
    const [editValue, setEditValue] = useState(value);
    const isEditing = editingFields[fieldName];

    useEffect(() => {
      if (!isEditing) setEditValue(value);
    }, [value, isEditing]);

    const handleSave = () => {
      if (editValue.trim() !== value) {
        handleFieldSave(fieldName, editValue.trim());
      } else {
        setEditingFields(prev => ({ ...prev, [fieldName]: false }));
      }
    };

    const handleCancel = () => {
      setEditValue(value);
      handleFieldCancel(fieldName);
    };

    if (isEditing) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[rgb(var(--brand-800))] uppercase tracking-wide">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              required={required}
              className="flex-1 border-2 border-[rgb(var(--brand-600)/0.18)] focus:border-[rgb(var(--brand-700))] focus:ring-2 focus:ring-[rgb(var(--brand-600)/0.18)] rounded-lg px-3 py-2 text-sm transition-all duration-200 bg-[rgb(var(--surface))]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 bg-[rgb(var(--brand-700))] hover:bg-[rgb(var(--brand-900))] text-white rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 text-sm"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "✓"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="px-3 py-1.5 border-2 border-[rgb(var(--brand-600)/0.28)] hover:border-[rgb(var(--brand-600)/0.40)] text-[rgb(var(--brand-800))] rounded-lg transition-all duration-200 hover:scale-105 text-sm bg-[rgb(var(--surface))]"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[rgb(var(--brand-800))] uppercase tracking-wide">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </p>
          {!loading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFieldEdit(fieldName)}
              className="h-6 w-6 p-0 hover:bg-[rgb(var(--brand-600)/0.06)] rounded-lg transition-all duration-200 hover:scale-110 group"
            >
              <svg className="w-3.5 h-3.5 text-[rgb(var(--brand-600))] group-hover:text-[rgb(var(--brand-900))] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
          )}
        </div>
        <div className="bg-[rgb(var(--brand-50))] border-2 border-[rgb(var(--brand-600)/0.12)] p-3 rounded-lg hover:border-[rgb(var(--brand-600)/0.22)] transition-all duration-200">
          {loading ? (
            <SkeletonBlock className="h-5 w-2/3 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
          ) : (
            <p className="text-[rgb(var(--foreground-rgb))] font-medium text-sm">
              {value || "No especificado"}
            </p>
          )}
        </div>
      </div>
    );
  };

  const hasCompleteClientData = clientProfile && 
    clientProfile.nombre && 
    clientProfile.telefono && 
    clientProfile.dni;

  const hasAddressData = clientProfile && (
    clientProfile.direccion || 
    clientProfile.localidad || 
    clientProfile.codigoPostal
  );

  if (authLoading || loading) {
    return <AccountPageSkeleton variant="loading" />;
  }

  if (!session && !authLoading) {
    return (
      <div
        onClick={() => {
          try {
            const redirect = window.location.pathname + window.location.search;
            window.dispatchEvent(new CustomEvent("open-login", { detail: { redirect } }));
            const url = new URL(window.location.href);
            url.searchParams.set("login", "open");
            url.searchParams.set("redirect", redirect);
            window.history.replaceState({}, "", url.toString());
          } catch {}
        }}
      >
        <AccountPageSkeleton variant="unauth" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold mb-4">Error de autenticación</h2>
        <p className="mb-6 text-red-500">{authError}</p>
        <div className="flex space-x-4">
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
          <Button variant="outline" onClick={() => router.push('/')}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[rgb(var(--page-bg))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="text-center mb-8 lg:mb-12">
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-[linear-gradient(90deg,rgb(var(--brand-900)),rgb(var(--brand-600)),rgb(var(--brand-900)))] bg-clip-text text-transparent mb-3 lg:mb-4">
              Mi Cuenta
            </h1>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-[linear-gradient(90deg,rgb(var(--brand-200)),rgb(var(--brand-700)))] rounded-full"></div>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-[rgb(var(--brand-700))] max-w-2xl mx-auto leading-relaxed">
            Gestiona tu información personal de manera segura
          </p>
        </div>
        
        <Card className="backdrop-blur-sm bg-[rgb(var(--surface)/0.88)] border border-[rgb(var(--brand-600)/0.16)] shadow-2xl rounded-2xl p-6 lg:p-8">
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-[linear-gradient(90deg,rgb(var(--brand-700)),rgb(var(--brand-900)))] text-white px-4 py-2 rounded-xl mb-3">
                  <div className="w-2 h-2 bg-[rgb(var(--surface))] rounded-full animate-pulse"></div>
                  <h2 className="text-lg lg:text-xl font-bold">Información Personal</h2>
                </div>
                <p className="text-[rgb(var(--brand-700))] text-sm">Datos básicos de tu cuenta</p>

                <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-4">
                  {hasCompleteClientData ? (
                    <div className="flex items-center gap-2 bg-[rgb(var(--brand-50))] border border-[rgb(var(--brand-600)/0.16)] text-[rgb(var(--brand-700))] px-3 py-1.5 rounded-lg text-sm">
                      <div className="w-1.5 h-1.5 bg-[rgb(var(--brand-600))] rounded-full animate-pulse"></div>
                      <span className="font-medium">Perfil Completo</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-[rgb(var(--brand-100))] border border-[rgb(var(--brand-600)/0.16)] text-[rgb(var(--brand-800))] px-3 py-1.5 rounded-lg text-sm">
                      <div className="w-1.5 h-1.5 bg-[rgb(var(--brand-700))] rounded-full animate-pulse"></div>
                      <span className="font-medium">Perfil Incompleto</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center lg:justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    if (!session?.email) return;
                    setProfileFormMode("create");
                    setSelectedProfile(null);
                    setProfileDraft({
                      id: undefined,
                      email: session.email,
                      nombre: "",
                      telefono: "",
                      dni: "",
                      cuit: "",
                      isFavorite: false,
                      creadoEn: undefined,
                      actualizadoEn: undefined,
                    });
                  }}
                  className="btn-brand px-6 py-2.5 rounded-xl font-semibold text-base transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar Perfil
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[linear-gradient(135deg,rgb(var(--brand-50)),rgb(var(--surface)))] rounded-xl p-4 lg:p-6 border border-[rgb(var(--brand-600)/0.12)]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-[rgb(var(--brand-600))] rounded-full"></div>
                  <h3 className="text-base lg:text-lg font-bold text-[rgb(var(--foreground-rgb))]">Información Básica</h3>
                </div>
                <p className="text-[rgb(var(--brand-700))] mb-4 text-center lg:text-left text-sm">
                  Haz clic en el ícono de editar para modificar cada campo
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[rgb(var(--brand-800))] uppercase tracking-wide">Email</p>
                    <div className="bg-[rgb(var(--brand-50))] border border-[rgb(var(--brand-600)/0.12)] p-3 rounded-lg">
                      <p className="text-[rgb(var(--foreground-rgb))] font-medium text-sm">{clientProfile?.email || session?.email}</p>
                    </div>
                  </div>
                  <EditableField
                    fieldName="nombre"
                    label="Nombre Completo *"
                    value={clientProfile?.nombre || ""}
                    loading={clientProfileLoading}
                    placeholder="Nombre y apellido"
                    required
                  />
                  <EditableField
                    fieldName="telefono"
                    label="Teléfono *"
                    value={clientProfile?.telefono || ""}
                    loading={clientProfileLoading}
                    placeholder="Número de teléfono"
                    type="tel"
                    required
                  />
                  <EditableField
                    fieldName="dni"
                    label="DNI *"
                    value={clientProfile?.dni || ""}
                    loading={clientProfileLoading}
                    placeholder="DNI"
                    required
                  />
                  <EditableField
                    fieldName="cuit"
                    label="CUIT (opcional)"
                    value={clientProfile?.cuit || ""}
                    loading={clientProfileLoading}
                    placeholder="CUIT"
                  />
                </div>
              </div>

              <div className="bg-[linear-gradient(135deg,rgb(var(--brand-50)),rgb(var(--surface)))] rounded-xl p-4 lg:p-6 border border-[rgb(var(--brand-600)/0.12)]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-[rgb(var(--brand-600))] rounded-full"></div>
                  <h3 className="text-base lg:text-lg font-bold text-[rgb(var(--foreground-rgb))]">Información de Dirección</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-2 lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[rgb(var(--brand-800))] uppercase tracking-wide">
                        Dirección
                      </p>
                      {!isEditingAddress && !clientProfileLoading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingAddress(true)}
                          className="h-6 w-6 p-0 hover:bg-[rgb(var(--brand-600)/0.06)] rounded-lg transition-all duration-200 hover:scale-110 group"
                          disabled={saving || clientProfileLoading}
                        >
                          <svg className="w-3.5 h-3.5 text-[rgb(var(--brand-600))] group-hover:text-[rgb(var(--brand-900))] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                      )}
                    </div>
                    {!isEditingAddress ? (
                      <div className="bg-[rgb(var(--brand-50))] border-2 border-[rgb(var(--brand-600)/0.12)] p-3 rounded-lg hover:border-[rgb(var(--brand-600)/0.22)] transition-all duration-200">
                        {clientProfileLoading ? (
                          <SkeletonBlock className="h-5 w-3/4 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                        ) : (
                          <p className="text-[rgb(var(--foreground-rgb))] font-medium text-sm">
                            {clientProfile?.direccion || "No especificada"}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-[rgb(var(--brand-50))] border-2 border-[rgb(var(--brand-600)/0.12)] p-3 rounded-lg">
                        <DeliveryAddressInput onValidAddress={handleAddressSelected} />
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingAddress(false)}
                            className="text-[rgb(var(--brand-700))] hover:bg-[rgb(var(--brand-600)/0.06)]"
                            disabled={saving}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[rgb(var(--brand-800))] uppercase tracking-wide">Localidad</p>
                    <div className="bg-[rgb(var(--brand-50))] border border-[rgb(var(--brand-600)/0.12)] p-3 rounded-lg">
                      {clientProfileLoading ? (
                        <SkeletonBlock className="h-5 w-2/3 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                      ) : (
                        <p className="text-[rgb(var(--foreground-rgb))] font-medium text-sm">
                          {clientProfile?.localidad || "No especificada"}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[rgb(var(--brand-800))] uppercase tracking-wide">Código Postal</p>
                    <div className="bg-[rgb(var(--brand-50))] border border-[rgb(var(--brand-600)/0.12)] p-3 rounded-lg">
                      {clientProfileLoading ? (
                        <SkeletonBlock className="h-5 w-32 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                      ) : (
                        <p className="text-[rgb(var(--foreground-rgb))] font-medium text-sm">
                          {clientProfile?.codigoPostal || "No especificado"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {(clientProfileLoading || clientProfile) && (
                <div className="bg-[linear-gradient(135deg,rgb(var(--brand-50)),rgb(var(--surface)))] rounded-xl p-4 lg:p-6 border border-[rgb(var(--brand-600)/0.12)]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-[rgb(var(--brand-600))] rounded-full"></div>
                    <h3 className="text-base lg:text-lg font-bold text-[rgb(var(--foreground-rgb))]">Información Adicional</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {/* <div className="space-y-2">
                      <p className="text-xs font-semibold text-[rgb(var(--brand-800))] uppercase tracking-wide">Tipo de Cliente</p>
                      <div className="bg-[rgb(var(--brand-50))] border border-[rgb(var(--brand-600)/0.12)] p-3 rounded-lg">
                        <p className="text-[rgb(var(--foreground-rgb))] font-medium text-sm">
                          {clientProfile.esClienteViejo ? "Cliente Antiguo" : "Cliente Nuevo"}
                        </p>
                      </div>
                    </div> */}
                    {/* <div className="space-y-2">
                      <p className="text-xs font-semibold text-[rgb(var(--brand-800))] uppercase tracking-wide">Origen</p>
                      <div className="bg-[rgb(var(--brand-50))] border border-[rgb(var(--brand-600)/0.12)] p-3 rounded-lg">
                        <p className="text-[rgb(var(--foreground-rgb))] font-medium capitalize text-sm">
                          {clientProfile.origen || "No especificado"}
                        </p>
                      </div>
                    </div> */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[rgb(var(--brand-800))] uppercase tracking-wide">Fecha de Registro</p>
                      <div className="bg-[rgb(var(--brand-50))] border border-[rgb(var(--brand-600)/0.12)] p-3 rounded-lg">
                        {clientProfileLoading ? (
                          <SkeletonBlock className="h-5 w-32 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                        ) : (
                          <p className="text-[rgb(var(--foreground-rgb))] font-medium text-sm">
                            {clientProfile?.creadoEn ? new Date(clientProfile.creadoEn).toLocaleDateString('es-AR') : "No especificada"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[rgb(var(--brand-800))] uppercase tracking-wide">Última Actualización</p>
                      <div className="bg-[rgb(var(--brand-50))] border border-[rgb(var(--brand-600)/0.12)] p-3 rounded-lg">
                        {clientProfileLoading ? (
                          <SkeletonBlock className="h-5 w-40 rounded-lg border-0 bg-[rgb(var(--brand-200))]" />
                        ) : (
                          <p className="text-[rgb(var(--foreground-rgb))] font-medium text-sm">
                            {clientProfile?.actualizadoEn ? new Date(clientProfile.actualizadoEn).toLocaleDateString('es-AR') : "No especificada"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
} 
