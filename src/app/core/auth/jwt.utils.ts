export interface JwtPayload {
  sub?: string;
  email?: string;
  roles?: string[];
  exp?: number;
  passwordMustChange?: boolean;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function rolesFromToken(token: string): string[] {
  const payload = decodeJwtPayload(token);
  return Array.isArray(payload?.roles) ? payload!.roles! : [];
}

export function isTokenExpired(token: string, leewaySeconds = 30): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  const expiryMs = payload.exp * 1000;
  return Date.now() + leewaySeconds * 1000 >= expiryMs;
}

export function emailFromToken(token: string): string | null {
  return decodeJwtPayload(token)?.email ?? null;
}
