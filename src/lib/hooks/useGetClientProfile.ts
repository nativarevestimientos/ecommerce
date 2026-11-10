"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";
import { onAuthStateChanged } from "firebase/auth";

export interface PerfilCliente {
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

function onlyDigits(value: unknown): string {
	if (typeof value !== "string" && typeof value !== "number") return "";
	return String(value).replace(/[^\d]/g, "");
}

function normalizeDniFromApi(data: any): string {
	const direct =
		data?.dni ??
		data?.documento ??
		data?.nroDocumento ??
		data?.numeroDocumento ??
		data?.doc ??
		"";
	const dniDigits = onlyDigits(direct);
	if (dniDigits.length === 8) return dniDigits;

	const cuitLike = onlyDigits(data?.cuil ?? data?.cuit ?? data?.cuitCuil ?? "");
	if (cuitLike.length === 11) return cuitLike.slice(2, 10);
	return "";
}

export async function obtenerPerfilCliente(): Promise<PerfilCliente | null> {
	try {
		if (!auth?.currentUser) return null;
		const token = await auth.currentUser.getIdToken(true);
		const uid = auth.currentUser.uid;
		const data = await api.get<any>(`/clientes/${encodeURIComponent(uid)}`, {
			withAuthToken: token,
		});
		if (!data) return null;
		return {
			uid: data.uid || uid,
			email: data.email || auth.currentUser.email || "",
			nombre: data.nombre || "",
			telefono: data.telefono || "",
			dni: normalizeDniFromApi(data),
			cuit: data.cuit || "",
			direccion: data.direccion,
			localidad: data.localidad,
			partido: data.partido,
			codigoPostal: data.codigoPostal,
			barrio: data.barrio,
			area: data.area,
			lote: data.lote,
			lat: data.lat ?? null,
			lng: data.lng ?? null,
			esClienteViejo: data.esClienteViejo,
			origen: data.origen,
			creadoEn: data.creadoEn,
			actualizadoEn: data.actualizadoEn,
		};
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		if (msg.includes("API 404")) return null;
		return null;
	}
}

export function useObtenerPerfilCliente() {
	const [perfil, setPerfil] = useState<PerfilCliente | null>(null);
	const [cargando, setCargando] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);
	const [authUid, setAuthUid] = useState<string | null>(auth?.currentUser?.uid ?? null);

	const refetch = useCallback(async () => {
		try {
			setCargando(true);
			setError(null);
			const p = await obtenerPerfilCliente();
			setPerfil(p);
		} catch (err) {
			console.error('Error en useObtenerPerfilCliente:', err);
			setError(err as Error);
			setPerfil(null);
		} finally {
			setCargando(false);
		}
	}, []);

	useEffect(() => {
		if (!auth) return;
		const unsub = onAuthStateChanged(auth, (u) => {
			setAuthUid(u?.uid ?? null);
			if (!u) setPerfil(null);
		});
		return () => unsub();
	}, []);

	useEffect(() => {
		if (!authUid) return;
		void refetch();
	}, [authUid, refetch]);

	return { perfil, cargando, error, refetch } as const;
}


