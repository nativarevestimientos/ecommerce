type CachedToken = {
  value: string;
  expiresAt: number;
};

const SANDBOX_AUTH_URL =
  "https://homoservices.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate";
const PRODUCTION_AUTH_URL =
  "https://services.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate";
const SANDBOX_API_BASE_URL = "https://api-sandbox.ranty.io";
const PRODUCTION_API_BASE_URL = "https://api.ranty.io";
const SANDBOX_CREATE_CHECKOUT_URL =
  `${SANDBOX_API_BASE_URL}/integrations/payment_requests/ecommerce`;
const PRODUCTION_CREATE_CHECKOUT_URL =
  `${PRODUCTION_API_BASE_URL}/integrations/payment_requests/ecommerce`;
const SANDBOX_PAYMENT_URL_TEMPLATE =
  `${SANDBOX_API_BASE_URL}/integrations/payments/{{paymentId}}`;
const PRODUCTION_PAYMENT_URL_TEMPLATE =
  `${PRODUCTION_API_BASE_URL}/integrations/payments/{{paymentId}}`;
const SANDBOX_PAYMENT_REQUEST_URL_TEMPLATE =
  `${SANDBOX_API_BASE_URL}/integrations/payment_requests/{{paymentRequestId}}`;
const PRODUCTION_PAYMENT_REQUEST_URL_TEMPLATE =
  `${PRODUCTION_API_BASE_URL}/integrations/payment_requests/{{paymentRequestId}}`;

let cachedToken: CachedToken | null = null;

export type NaveMappedStatus =
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "reversed"
  | "chargeback_review"
  | "charged_back"
  | "pending";

export function getNaveEnvironment(): "sandbox" | "production" {
  return String(process.env.NAVE_GALICIA_ENV || "sandbox").trim().toLowerCase() ===
    "production"
    ? "production"
    : "sandbox";
}

export function getNaveUrls() {
  const env = getNaveEnvironment();
  return {
    env,
    apiBaseUrl:
      env === "production" ? PRODUCTION_API_BASE_URL : SANDBOX_API_BASE_URL,
    authUrl: env === "production" ? PRODUCTION_AUTH_URL : SANDBOX_AUTH_URL,
    // These endpoints are fixed by Nave's API contract. Older deployments may
    // still have env overrides pointing at the retired /api or ranty-payments paths.
    createCheckoutUrl:
      env === "production"
        ? PRODUCTION_CREATE_CHECKOUT_URL
        : SANDBOX_CREATE_CHECKOUT_URL,
    paymentUrlTemplate:
      env === "production"
        ? PRODUCTION_PAYMENT_URL_TEMPLATE
        : SANDBOX_PAYMENT_URL_TEMPLATE,
    paymentRequestUrlTemplate:
      env === "production"
        ? PRODUCTION_PAYMENT_REQUEST_URL_TEMPLATE
        : SANDBOX_PAYMENT_REQUEST_URL_TEMPLATE,
  };
}

function resolvePaymentCheckUrl(paymentCheckUrl: string): string {
  const { apiBaseUrl } = getNaveUrls();
  const raw = String(paymentCheckUrl || "").trim();
  if (!raw) throw new Error("payment_check_url requerido para consultar el pago");

  let url: URL;
  try {
    if (raw.startsWith("/")) {
      url = new URL(raw, apiBaseUrl);
    } else if (/^https?:\/\//i.test(raw)) {
      url = new URL(raw);
    } else {
      url = new URL(`https://${raw}`);
    }
  } catch {
    throw new Error("payment_check_url de Nave invalido");
  }

  const expectedOrigin = new URL(apiBaseUrl).origin;
  if (
    url.protocol !== "https:" ||
    url.origin !== expectedOrigin ||
    !url.pathname.startsWith("/integrations/payments/") ||
    url.pathname.includes("..")
  ) {
    throw new Error("payment_check_url no pertenece al endpoint oficial de Nave");
  }

  return url.toString();
}

export function resolveBaseUrlFromRequest(request: Request): string {
  const rawEnv = String(process.env.NEXT_PUBLIC_BASE_URL || "").trim();
  if (rawEnv) return rawEnv.replace(/\/+$/, "");

  const url = new URL(request.url);
  const forwardedHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    url.host;
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ||
    url.protocol.replace(":", "");

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
  }

  return url.origin.replace(/\/+$/, "");
}

export function truncate(input: string, max = 5000): string {
  const s = String(input || "");
  if (s.length <= max) return s;
  return `${s.slice(0, max)}...`;
}

function sanitizeValue(input: any): any {
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeValue(item));
  }

  if (input && typeof input === "object") {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("secret") ||
        lowerKey.includes("token") ||
        lowerKey === "authorization"
      ) {
        out[key] = "[redacted]";
        continue;
      }
      out[key] = sanitizeValue(value);
    }
    return out;
  }

  if (typeof input === "string") {
    return truncate(input, 1500);
  }

  return input;
}

export function sanitizeForStorage(input: any, max = 6000): string {
  try {
    return truncate(JSON.stringify(sanitizeValue(input)), max);
  } catch {
    return truncate(String(input || ""), max);
  }
}

export function getByPath(input: any, path: string): any {
  const raw = String(path || "").trim();
  if (!raw) return undefined;
  return raw
    .split(".")
    .reduce((acc: any, key) => (acc == null ? undefined : acc[key]), input);
}

export function mapNavePaymentStatus(rawStatus: string): NaveMappedStatus {
  const status = String(rawStatus || "").trim().toUpperCase();
  switch (status) {
    case "APPROVED":
      return "paid";
    case "REJECTED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
    case "REFUNDED":
      return "refunded";
    case "PURCHASE_REVERSED":
      return "reversed";
    case "CHARGEBACK_REVIEW":
      return "chargeback_review";
    case "CHARGED_BACK":
      return "charged_back";
    case "PENDING":
    default:
      return "pending";
  }
}

export async function getNaveGaliciaAccessToken(): Promise<string> {
  const authMode = String(process.env.NAVE_GALICIA_AUTH_MODE || "").trim().toLowerCase();
  if (authMode === "static_token") {
    const token = String(process.env.NAVE_GALICIA_ACCESS_TOKEN || "").trim();
    if (!token) throw new Error("NAVE_GALICIA_ACCESS_TOKEN requerido");
    return token;
  }

  if (authMode !== "oauth_client_credentials") {
    throw new Error(
      "NAVE_GALICIA_AUTH_MODE invalido. Usar static_token u oauth_client_credentials",
    );
  }

  const clientId = String(process.env.NAVE_GALICIA_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.NAVE_GALICIA_CLIENT_SECRET || "").trim();
  const audience = String(process.env.NAVE_GALICIA_AUDIENCE || "").trim();
  const { authUrl } = getNaveUrls();

  if (!clientId || !clientSecret || !audience || !authUrl) {
    throw new Error(
      "Faltan NAVE_GALICIA_CLIENT_ID, NAVE_GALICIA_CLIENT_SECRET, NAVE_GALICIA_AUDIENCE o URL de auth",
    );
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.value;
  }

  const response = await fetch(authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      audience,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`OAuth Nave Galicia ${response.status}: ${truncate(text, 300)}`);
  }

  const json = (await response.json().catch(() => null)) as any;
  const accessToken = String(json?.access_token || json?.token || "").trim();
  const expiresIn = Number(json?.expires_in ?? 3600);
  if (!accessToken) {
    throw new Error("OAuth Nave Galicia: access_token ausente");
  }

  cachedToken = {
    value: accessToken,
    expiresAt: Date.now() + (Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000,
  };

  return accessToken;
}

export async function fetchNavePayment(
  paymentId: string,
  paymentCheckUrl?: string,
): Promise<any> {
  const token = await getNaveGaliciaAccessToken();
  const { paymentUrlTemplate } = getNaveUrls();
  const checkUrl = String(paymentCheckUrl || "").replace(
    /:id(?=($|[?#]))/g,
    encodeURIComponent(paymentId),
  );
  const url = checkUrl
    ? resolvePaymentCheckUrl(checkUrl)
    : paymentUrlTemplate.replace("{{paymentId}}", encodeURIComponent(paymentId));

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`GET payment ${response.status}: ${truncate(text, 300)}`);
  }

  return response.json().catch(() => null);
}

export async function fetchNavePaymentRequest(paymentRequestId: string): Promise<any> {
  const token = await getNaveGaliciaAccessToken();
  const { paymentRequestUrlTemplate } = getNaveUrls();
  const url = paymentRequestUrlTemplate.replace(
    "{{paymentRequestId}}",
    encodeURIComponent(paymentRequestId),
  );

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`GET payment_request ${response.status}: ${truncate(text, 300)}`);
  }

  return response.json().catch(() => null);
}
