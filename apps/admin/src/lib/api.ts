const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

export const API_BASE = `${API_URL}/api/v1`;

export interface Staff { id: string; name: string; email: string; roles: string[]; permissions: string[] }
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}/admin` + path, {
    method, credentials: 'include',
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => ({})) as {
    data?: T; error?: { message?: string; details?: unknown };
  };
  if (!response.ok) throw new Error(payload.error?.message || 'Request failed. Please try again.');
  return payload.data as T;
}
export const can = (user: Staff | null, permission: string) =>
  !!user && (user.roles.includes('super_admin') || user.permissions.includes(permission));
