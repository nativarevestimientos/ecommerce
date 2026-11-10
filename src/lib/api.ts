export interface ApiOptions extends RequestInit {
  withAuthToken?: string;
}

const getBaseUrl = () => {
  // Soportar ambas variables: NEXT_PUBLIC_API_BASE y NEXT_PUBLIC_API_BASE_URL
  const rawEnv = (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '').trim();
  // Eliminar barras finales para evitar URLs con "//" al concatenar
  let base = rawEnv.replace(/\/+$/, '');
  // Asegurar sufijo "/api" si no está presente
  if (base && !/\/api$/.test(base)) base = `${base}/api`;
  return base;
};

const getSiteBaseUrl = () => {
  const rawSite = (process.env.NEXT_PUBLIC_BASE_URL || '').trim();
  let site = rawSite.replace(/\/+$/, '');
  site = site.replace(/\/api$/, '');
  if (!site) {
    const apiBaseRaw = (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '').trim();
    site = apiBaseRaw.replace(/\/+$/, '').replace(/\/api$/, '');
  }
  if (!site) {
    const vercelHost = (process.env.VERCEL_URL || '').trim();
    if (vercelHost) {
      site = `https://${vercelHost.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
    }
  }
  const port = (process.env.PORT || '3000').trim();
  return site || `http://127.0.0.1:${port}`;
};

function siteApiUrl(path: string): string {
  const p = path.startsWith('/api') ? path : `/api${path}`;
  const normalizedPath = p.replace(/([^:]\/)\/+/g, '$1');
  if (typeof window === 'undefined') {
    return `${getSiteBaseUrl()}${normalizedPath}`;
  }
  return normalizedPath;
}

const shouldUseProxy = () => {
  const val = (process.env.NEXT_PUBLIC_API_USE_PROXY || '').toLowerCase();
  // Por defecto: usar proxy, a menos que se ponga "false"
  return val !== 'false' && val !== '0' && val !== 'no';
};

function resolveUrl(path: string): string {
  // URLs absolutas
  if (path.startsWith('http')) return path;

  // Forzar rutas internas a nuestro Next API
  if (path === '/products' || path.startsWith('/products/')) {
    return siteApiUrl(path);
  }
  if (path === '/orders' || path.startsWith('/orders/')) {
    return siteApiUrl(path);
  }
  if (path.startsWith('/api/')) {
    return siteApiUrl(path);
  }

  // Proxy local para endpoints externos sensibles a CORS (carts)
  if (shouldUseProxy() && (path === '/carts' || path.startsWith('/carts/'))) {
    return siteApiUrl(`/api/proxy${path}`);
  }

  // Resto: usar backend externo si está configurado
  const base = getBaseUrl();
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function canonicalizeUrl(u: string): string {
  try {
    const url = new URL(u);
    url.pathname = url.pathname
      .replace(/\/api\/api(\/|$)/g, '/api$1')
      .replace(/\/{2,}/g, '/');
    return url.toString();
  } catch {
    return u
      .replace(/\/api\/api(\/|$)/g, '/api$1')
      .replace(/([^:]\/)\/+/g, '$1');
  }
}

export async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const url = canonicalizeUrl(resolveUrl(path));

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(typeof options.headers === 'object' && options.headers !== null && !Array.isArray(options.headers)
      ? (options.headers as Record<string, string>)
      : {}),
  };

  if (options.withAuthToken) {
    headers['Authorization'] = `Bearer ${options.withAuthToken}`;
  }

  const res = await fetch(url, { ...options, headers });

  const contentType = res.headers.get('content-type') || '';

  // Intentar leer JSON (para mensajes de error estandarizados)
  if (!res.ok) {
    if (contentType.includes('application/json')) {
      try {
        const errJson: any = await res.json();
        const message = errJson?.mensaje || errJson?.error || JSON.stringify(errJson);
        throw new Error(`API ${res.status}: ${message}`);
      } catch {
        // Fallback a texto si JSON falla
        const text = await res.text().catch(() => '');
        throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
      }
    }
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }

  // Permitir respuestas vacías
  if (!contentType || !contentType.includes('application/json')) {
    return (undefined as unknown) as T;
  }

  const json = (await res.json()) as any;
  // Desempaquetar contrato estándar { ok, dato }
  if (json && typeof json === 'object' && 'ok' in json) {
    if (json.ok) return (json.dato as T);
    const message = json?.mensaje || json?.error || 'Error desconocido';
    throw new Error(`API ${res.status}: ${message}`);
  }
  return json as T;
}

export const api = {
  get: <T = unknown>(path: string, options?: ApiOptions) => apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T = unknown>(path: string, options?: ApiOptions) => apiFetch<T>(path, { ...options, method: 'DELETE' }),
};


