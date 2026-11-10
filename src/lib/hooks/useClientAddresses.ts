"use client";

import { useCallback, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";

export interface DireccionCliente {
	id: string;
	direccion: string;
	ciudad: string;
	codigoPostal: string;
	metodoEntrega: 'envio' | 'retiro';
	esFavorita?: boolean;
	creadoEn?: string;
	actualizadoEn?: string;
	lat?: number;
	lng?: number;
}

export function useObtenerDireccionesCliente() {
	const [direcciones, setDirecciones] = useState<DireccionCliente[]>([]);
	const [cargando, setCargando] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);

	const obtener = useCallback(async () => {
		if (!auth || !auth.currentUser) {
			setDirecciones([]);
			return;
		}
		setCargando(true);
		setError(null);
		try {
			const token = await auth.currentUser.getIdToken();
			const data = await api.get<DireccionCliente[]>(`/clientes/${auth.currentUser.uid}/direcciones`, {
				withAuthToken: token,
			});
			setDirecciones(Array.isArray(data) ? data : []);
		} catch (err) {
			setError(err as Error);
		} finally {
			setCargando(false);
		}
	}, []);

	useEffect(() => {
		void obtener();
	}, [obtener]);

	return { direcciones, cargando, error, refetch: obtener } as const;
}

export interface DireccionPayload {
	direccion: string;
	ciudad: string;
	codigoPostal: string;
	metodoEntrega: 'envio' | 'retiro';
	esFavorita?: boolean;
	lat?: number;
	lng?: number;
	/** Marca el origen de la creación/actualización */
	origen?: 'ecommerce';
	/** Timestamps ISO opcionales (el backend puede sobreescribir) */
	creadoEn?: string;
	actualizadoEn?: string;
}

export function useGuardarDireccionCliente() {
	const [guardando, setGuardando] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);

	const guardar = useCallback(async (payload: DireccionPayload, direccionId?: string) => {
		if (!auth || !auth.currentUser) {
			throw new Error("No hay usuario autenticado. Inicia sesión para continuar.");
		}
		setGuardando(true);
		setError(null);
		try {
			const token = await auth.currentUser.getIdToken();
			const path = direccionId
				? `/clientes/${auth.currentUser.uid}/direcciones/${encodeURIComponent(direccionId)}`
				: `/clientes/${auth.currentUser.uid}/direcciones`;
			const method = direccionId ? api.put : api.post;
			const nowIso = new Date().toISOString();
			const enriched = {
				...payload,
				origen: 'ecommerce' as const,
				actualizadoEn: nowIso,
				...(direccionId ? {} : { creadoEn: nowIso }),
			};
			const data = await method<DireccionCliente>(path, enriched, { withAuthToken: token });
			return data;
		} catch (err) {
			setError(err as Error);
			throw err;
		} finally {
			setGuardando(false);
		}
	}, []);

	return { guardar, guardando, error } as const;
}

export function useEliminarDireccionCliente() {
	const [eliminando, setEliminando] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);

	const eliminar = useCallback(async (direccionId: string) => {
		if (!auth || !auth.currentUser) {
			throw new Error("No hay usuario autenticado. Inicia sesión para continuar.");
		}
		setEliminando(true);
		setError(null);
		try {
			const token = await auth.currentUser.getIdToken();
			await api.delete(`/clientes/${auth.currentUser.uid}/direcciones/${encodeURIComponent(direccionId)}`, {
				withAuthToken: token,
			});
			return true;
		} catch (err) {
			setError(err as Error);
			throw err;
		} finally {
			setEliminando(false);
		}
	}, []);

	return { eliminar, eliminando, error } as const;
}


