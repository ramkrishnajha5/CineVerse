export function getApiBase() {
  // Prefer explicit env var, else use current origin if it has a port, else fallback to localhost:5176
  const envBase = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  if (envBase && envBase.trim()) return envBase.trim().replace(/\/$/, "");
  const origin = window.location.origin;
  try {
    const url = new URL(origin);
    if (url.port) return origin;
  } catch {}
  return "http://localhost:5176";
}

export async function apiFetch(path: string, init?: RequestInit) {
  const base = getApiBase();
  const url = `${base}${path.startsWith('/') ? path : '/' + path}`;
  const res = await fetch(url, init);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Unexpected response: ${res.status} ${text.slice(0, 120)}`);
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Request failed: ${res.status}`);
  }
  return data;
}
