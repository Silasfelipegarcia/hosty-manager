import { Injectable } from '@angular/core';

const ACCESS_KEY = 'hosty.accessToken';
const REFRESH_KEY = 'hosty.refreshToken';
const EXPIRES_KEY = 'hosty.expiresAt';

@Injectable({ providedIn: 'root' })
export class TokenStore {
  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  get expiresAt(): number | null {
    const raw = localStorage.getItem(EXPIRES_KEY);
    return raw ? Number(raw) : null;
  }

  save(accessToken: string, refreshToken: string, expiresInSeconds: number): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(EXPIRES_KEY, String(Date.now() + expiresInSeconds * 1000));
  }

  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(EXPIRES_KEY);
  }
}
