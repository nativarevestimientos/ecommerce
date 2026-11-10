import crypto from "crypto";
import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import path from "path";
import { sanitizeForStorage } from "@/lib/naveGalicia";

export type ProviderPaymentSession = {
  orderId: string;
  externalPaymentId: string;
  paymentProvider: "nave_galicia";
  paymentStatus: string;
  paymentRequestId: string | null;
  paymentId: string | null;
  amount: number | null;
  currency: string | null;
  paymentCheckUrl: string | null;
  checkoutUrl: string | null;
  qrData: string | null;
  statusName: string | null;
  reasonCode: string | null;
  reasonName: string | null;
  createResponse: string | null;
  rawPaymentResponse: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProviderPaymentSessionInput = {
  orderId: string;
  externalPaymentId?: string | null;
  paymentProvider?: "nave_galicia";
  paymentStatus?: string | null;
  paymentRequestId?: string | null;
  paymentId?: string | null;
  amount?: number | null;
  currency?: string | null;
  paymentCheckUrl?: string | null;
  checkoutUrl?: string | null;
  qrData?: string | null;
  statusName?: string | null;
  reasonCode?: string | null;
  reasonName?: string | null;
  createResponse?: unknown;
  rawPaymentResponse?: unknown;
};

type StoredEnvelope = {
  version: 1;
  iv: string;
  tag: string;
  payload: string;
};

const SESSION_PREFIX = "provider-payment-sessions/nave-galicia";

function getBlobApiBaseUrl() {
  return String(
    process.env.VERCEL_BLOB_API_URL ||
      process.env.NEXT_PUBLIC_VERCEL_BLOB_API_URL ||
      "https://blob.vercel-storage.com",
  )
    .trim()
    .replace(/\/+$/, "");
}

function getBlobToken() {
  const token = String(process.env.BLOB_READ_WRITE_TOKEN || "").trim();
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN no configurado");
  }
  return token;
}

async function requestBlobApi(pathname: string, init: RequestInit) {
  const response = await fetch(`${getBlobApiBaseUrl()}${pathname}`, {
    ...init,
    headers: {
      authorization: `Bearer ${getBlobToken()}`,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Blob API ${response.status}: ${text || response.statusText}`);
  }

  return response.json();
}

function slugifyId(value: string): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 180);
}

function resolveFilePath(orderId: string) {
  return path.join(
    process.cwd(),
    ".data",
    "provider-payment-sessions",
    "nave-galicia",
    `${slugifyId(orderId)}.json`,
  );
}

function resolveBlobPath(orderId: string) {
  return `${SESSION_PREFIX}/${slugifyId(orderId)}.json`;
}

function hasBlobStore() {
  return Boolean(String(process.env.BLOB_READ_WRITE_TOKEN || "").trim());
}

function hasEncryptionKey() {
  return Boolean(String(process.env.PAYMENT_SESSION_ENCRYPTION_KEY || "").trim());
}

function resolveStorageMode(): "blob" | "file" {
  const isProduction = String(process.env.NODE_ENV || "").trim() === "production";
  if (isProduction && (!hasBlobStore() || !hasEncryptionKey())) {
    throw new Error(
      "ProviderPaymentSessions requiere BLOB_READ_WRITE_TOKEN y PAYMENT_SESSION_ENCRYPTION_KEY en produccion",
    );
  }
  return hasBlobStore() && hasEncryptionKey() ? "blob" : "file";
}

function deriveEncryptionKey() {
  const secret = String(process.env.PAYMENT_SESSION_ENCRYPTION_KEY || "").trim();
  if (!secret) {
    throw new Error("PAYMENT_SESSION_ENCRYPTION_KEY no configurado");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptPayload(input: ProviderPaymentSession): string {
  const key = deriveEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const serialized = JSON.stringify(input);
  const encrypted = Buffer.concat([
    cipher.update(serialized, "utf8"),
    cipher.final(),
  ]);
  const envelope: StoredEnvelope = {
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    payload: encrypted.toString("base64"),
  };
  return JSON.stringify(envelope);
}

function decryptPayload(raw: string): ProviderPaymentSession {
  const envelope = JSON.parse(raw) as StoredEnvelope;
  const key = deriveEncryptionKey();
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(envelope.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(envelope.payload, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8")) as ProviderPaymentSession;
}

function normalizeString(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function normalizeSession(
  previous: ProviderPaymentSession | null,
  input: ProviderPaymentSessionInput,
): ProviderPaymentSession {
  const now = new Date().toISOString();
  return {
    orderId: String(input.orderId || previous?.orderId || "").trim(),
    externalPaymentId:
      normalizeString(input.externalPaymentId) ||
      previous?.externalPaymentId ||
      String(input.orderId || "").trim(),
    paymentProvider: "nave_galicia",
    paymentStatus:
      normalizeString(input.paymentStatus) ||
      previous?.paymentStatus ||
      "pending",
    paymentRequestId:
      normalizeString(input.paymentRequestId) ||
      previous?.paymentRequestId ||
      null,
    paymentId:
      normalizeString(input.paymentId) ||
      previous?.paymentId ||
      null,
    amount:
      Number.isFinite(Number(input.amount)) && input.amount !== null && input.amount !== undefined
        ? Number(input.amount)
        : previous?.amount ?? null,
    currency:
      normalizeString(input.currency) ||
      previous?.currency ||
      null,
    paymentCheckUrl:
      normalizeString(input.paymentCheckUrl) ||
      previous?.paymentCheckUrl ||
      null,
    checkoutUrl:
      normalizeString(input.checkoutUrl) ||
      previous?.checkoutUrl ||
      null,
    qrData:
      normalizeString(input.qrData) ||
      previous?.qrData ||
      null,
    statusName:
      normalizeString(input.statusName) ||
      previous?.statusName ||
      null,
    reasonCode:
      normalizeString(input.reasonCode) ||
      previous?.reasonCode ||
      null,
    reasonName:
      normalizeString(input.reasonName) ||
      previous?.reasonName ||
      null,
    createResponse:
      input.createResponse !== undefined
        ? sanitizeForStorage(input.createResponse)
        : previous?.createResponse || null,
    rawPaymentResponse:
      input.rawPaymentResponse !== undefined
        ? sanitizeForStorage(input.rawPaymentResponse)
        : previous?.rawPaymentResponse || null,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };
}

async function readFromFile(orderId: string) {
  const filePath = resolveFilePath(orderId);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as ProviderPaymentSession;
}

async function writeToFile(session: ProviderPaymentSession) {
  const filePath = resolveFilePath(session.orderId);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(session, null, 2)}\n`, "utf8");
}

async function resolveBlobUrlByPath(blobPath: string) {
  const searchParams = new URLSearchParams({ prefix: blobPath, limit: "10" });
  const response = await requestBlobApi(`/?${searchParams.toString()}`, {
    method: "GET",
  });
  const blobs = Array.isArray(response?.blobs) ? response.blobs : [];
  const match = blobs.find((blob: any) => blob?.pathname === blobPath);
  return match?.url || null;
}

async function readFromBlob(orderId: string) {
  const blobPath = resolveBlobPath(orderId);
  const url = await resolveBlobUrlByPath(blobPath);
  if (!url) return null;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo leer la sesion de pago desde Blob: ${response.status}`);
  }
  const encrypted = await response.text();
  return decryptPayload(encrypted);
}

async function writeToBlob(session: ProviderPaymentSession) {
  const encrypted = encryptPayload(session);
  const searchParams = new URLSearchParams({
    pathname: resolveBlobPath(session.orderId),
  });
  await requestBlobApi(`/?${searchParams.toString()}`, {
    method: "PUT",
    body: encrypted,
    headers: {
      "x-access": "public",
      "x-add-random-suffix": "0",
      "x-allow-overwrite": "1",
      "x-content-type": "application/json",
      "x-cache-control-max-age": "60",
    },
  });
}

async function scanFileSessions() {
  const dir = path.join(
    process.cwd(),
    ".data",
    "provider-payment-sessions",
    "nave-galicia",
  );
  try {
    const files = await readdir(dir);
    const sessions = await Promise.all(
      files
        .filter((file) => file.endsWith(".json"))
        .map(async (file) => {
          const raw = await readFile(path.join(dir, file), "utf8");
          return JSON.parse(raw) as ProviderPaymentSession;
        }),
    );
    return sessions;
  } catch {
    return [];
  }
}

async function scanBlobSessions() {
  const searchParams = new URLSearchParams({
    prefix: `${SESSION_PREFIX}/`,
    limit: "1000",
  });
  const response = await requestBlobApi(`/?${searchParams.toString()}`, {
    method: "GET",
  });
  const blobs = Array.isArray(response?.blobs) ? response.blobs : [];
  const sessions = await Promise.all(
    blobs.map(async (blob: any) => {
      const raw = await fetch(blob.url, { cache: "no-store" }).then((res) => res.text());
      return decryptPayload(raw);
    }),
  );
  return sessions;
}

export async function getProviderPaymentSession(input: {
  orderId?: string | null;
  externalPaymentId?: string | null;
}) {
  const orderId = normalizeString(input.orderId);
  const externalPaymentId = normalizeString(input.externalPaymentId);
  const storageMode = resolveStorageMode();

  if (orderId) {
    try {
      if (storageMode === "blob") {
        return await readFromBlob(orderId);
      }
      return await readFromFile(orderId);
    } catch {
      return null;
    }
  }

  if (!externalPaymentId) return null;

  const sessions =
    storageMode === "blob" ? await scanBlobSessions() : await scanFileSessions();
  return (
    sessions.find(
      (session) =>
        session.externalPaymentId === externalPaymentId ||
        session.orderId === externalPaymentId,
    ) || null
  );
}

export async function upsertProviderPaymentSession(input: ProviderPaymentSessionInput) {
  const orderId = String(input.orderId || "").trim();
  if (!orderId) {
    throw new Error("orderId requerido para persistir providerPaymentSession");
  }

  const previous = await getProviderPaymentSession({ orderId });
  const session = normalizeSession(previous, input);

  if (resolveStorageMode() === "blob") {
    await writeToBlob(session);
  } else {
    await writeToFile(session);
  }

  return session;
}
