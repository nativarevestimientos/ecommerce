"use client";

import { useCallback, useState } from "react";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";

export interface DatosClientePayload {
	email?: string;
	/** Nombre y apellido del cliente */
	nombre: string;
	/** Teléfono del cliente */
	telefono: string;
	/** DNI del cliente */
	dni: string;
	/** CUIT del cliente */
	cuit?: string;
	/** Dirección del cliente */
	direccion?: string;
	/** Localidad del cliente */
	localidad?: string;
	/** Partido/Departamento del cliente */
	partido?: string;
	/** Código postal del cliente */
	codigoPostal?: string;
	/** Barrio del cliente */
	barrio?: string;
	/** Área del cliente */
	area?: string;
	/** Lote del cliente */
	lote?: string;
	/** Latitud de la ubicación */
	lat?: number | null;
	/** Longitud de la ubicación */
	lng?: number | null;
	/** Origen del alta/actualización (se autocompleta como "ecommerce") */
	origen?: string;
	/** Fecha de creación ISO (opcional; el backend puede ignorarla si ya existe) */
	creadoEn?: string;
	/** Fecha de actualización ISO (autogenerada en el cliente; el backend puede sobreescribir) */
	actualizadoEn?: string;
}

export interface ResultadoCliente<Data = unknown> {
	ok: boolean;
	status: number;
	data: Data;
}

/**
 * Guarda/actualiza datos del cliente en `/api/clientes`.
 * - Obtiene el usuario actual de Firebase y su JWT.
 * - Envía `{ uid, nombre, telefono, dni }` en el body.
 * - Incluye `Authorization: Bearer <token>`.
 */
export async function guardarPerfilCliente<Data = unknown>(
	payload: DatosClientePayload
): Promise<ResultadoCliente<Data>> {
	if (!auth?.currentUser) {
		throw new Error("No hay usuario autenticado. Inicia sesión para continuar.");
	}

	const currentEmail = payload.email || auth.currentUser.email || "";
	const currentUid = auth.currentUser.uid || "";
	const nowIso = new Date().toISOString();

	const body = {
		uid: currentUid,
		email: currentEmail,
		nombre: payload.nombre,
		telefono: payload.telefono,
		dni: payload.dni,
		cuit: payload.cuit && payload.cuit.trim() ? payload.cuit.trim() : undefined,
		direccion: payload.direccion,
		localidad: payload.localidad,
		partido: payload.partido,
		codigoPostal: payload.codigoPostal,
		barrio: payload.barrio,
		area: payload.area,
		lote: payload.lote,
		lat: payload.lat ?? null,
		lng: payload.lng ?? null,
		origen: payload.origen ?? "ecommerce",
		creadoEn: payload.creadoEn ?? nowIso,
		actualizadoEn: payload.actualizadoEn ?? nowIso,
	};

	const token = await auth.currentUser.getIdToken(true);
	const data = await api.post<Data>("/clientes", body, { withAuthToken: token });

	return { ok: true, status: 200, data };
}

/**
 * Hook para guardar datos del cliente desde un formulario.
 * Expone `save`, `isSaving`, `error` y `result`.
 */
export function useGuardarPerfilCliente<Data = unknown>() {
	const [guardando, setGuardando] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [resultado, setResultado] = useState<Data | null>(null);

	const guardar = useCallback(async (payload: DatosClientePayload) => {
		setGuardando(true);
		setError(null);
		try {
			const res = await guardarPerfilCliente<Data>(payload);
			setResultado(res.data);
			return res.data;
		} catch (err) {
			setError(err as Error);
			throw err;
		} finally {
			setGuardando(false);
		}
	}, []);

	return { guardar, guardando, error, resultado } as const;
}


