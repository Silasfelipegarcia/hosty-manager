import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RegisterRequest,
} from '../models/auth.models';
import { TokenStore } from './token.store';
import { decodeJwtPayload, emailFromToken, isTokenExpired, rolesFromToken } from './jwt.utils';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokens = inject(TokenStore);

  readonly passwordMustChange = signal(false);
  private refreshInFlight: Promise<boolean> | null = null;
  private sessionWatchId: ReturnType<typeof setInterval> | null = null;
  private expiryTimerId: ReturnType<typeof setTimeout> | null = null;
  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      void this.checkSessionOrLogout();
    }
  };

  get isLoggedIn(): boolean {
    const token = this.tokens.accessToken;
    return !!token && !isTokenExpired(token);
  }

  get roles(): string[] {
    const token = this.tokens.accessToken;
    return token ? rolesFromToken(token) : [];
  }

  get email(): string | null {
    const token = this.tokens.accessToken;
    return token ? emailFromToken(token) : null;
  }

  isOwner(): boolean {
    return this.roles.includes('OWNER') || this.roles.includes('ADMIN');
  }

  isPlatformAdmin(): boolean {
    return this.roles.includes('PLATFORM_ADMIN');
  }

  async register(request: RegisterRequest): Promise<LoginResponse> {
    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiBaseUrl}/api/v1/auth/register-owner`, request, {
        headers: { 'X-Hosty-Client': 'owner-portal' },
      }),
    );
    this.tokens.save(res.accessToken, res.refreshToken, res.expiresInSeconds);
    this.passwordMustChange.set(!!res.passwordMustChange);
    this.scheduleExpiryCheck();
    return res;
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiBaseUrl}/api/v1/auth/login`, request),
    );
    this.tokens.save(res.accessToken, res.refreshToken, res.expiresInSeconds);
    this.passwordMustChange.set(!!res.passwordMustChange);
    this.scheduleExpiryCheck();
    return res;
  }

  /** Renova access token se expirado; desloga e redireciona ao login se a sessão acabou. */
  async ensureValidSession(): Promise<boolean> {
    const token = this.tokens.accessToken;
    if (token && !isTokenExpired(token)) {
      this.scheduleExpiryCheck();
      return true;
    }
    if (!this.tokens.refreshToken) {
      this.logout();
      return false;
    }
    const refreshed = await this.refresh();
    if (!refreshed) {
      return false;
    }
    this.scheduleExpiryCheck();
    return true;
  }

  startSessionWatch(): void {
    this.stopSessionWatch();
    void this.ensureValidSession();
    this.sessionWatchId = setInterval(() => void this.checkSessionOrLogout(), 30_000);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  stopSessionWatch(): void {
    if (this.sessionWatchId) {
      clearInterval(this.sessionWatchId);
      this.sessionWatchId = null;
    }
    this.clearExpiryTimer();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  async refresh(): Promise<boolean> {
    if (this.refreshInFlight) return this.refreshInFlight;
    const refreshToken = this.tokens.refreshToken;
    if (!refreshToken) return false;

    this.refreshInFlight = (async () => {
      try {
        const body: RefreshRequest = { refreshToken };
        const res = await firstValueFrom(
          this.http.post<LoginResponse>(`${environment.apiBaseUrl}/api/v1/auth/refresh`, body),
        );
        this.tokens.save(res.accessToken, res.refreshToken, res.expiresInSeconds);
        this.passwordMustChange.set(!!res.passwordMustChange);
        this.scheduleExpiryCheck();
        return true;
      } catch {
        this.logout();
        return false;
      } finally {
        this.refreshInFlight = null;
      }
    })();
    return this.refreshInFlight;
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiBaseUrl}/api/v1/auth/forgot-password`, request, {
        responseType: 'text',
      }),
    );
  }

  async changePassword(request: ChangePasswordRequest): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiBaseUrl}/api/v1/account/password`, request, {
        responseType: 'text',
      }),
    );
    this.passwordMustChange.set(false);
  }

  logout(): void {
    this.stopSessionWatch();
    this.tokens.clear();
    this.passwordMustChange.set(false);
    void this.router.navigate(['/login']);
  }

  private async checkSessionOrLogout(): Promise<void> {
    const token = this.tokens.accessToken;
    if (!token || isTokenExpired(token)) {
      await this.ensureValidSession();
    }
  }

  private scheduleExpiryCheck(): void {
    this.clearExpiryTimer();
    const token = this.tokens.accessToken;
    if (!token) return;
    const exp = decodeJwtPayload(token)?.exp;
    if (!exp) return;
    const msUntilExpiry = exp * 1000 - Date.now();
    if (msUntilExpiry <= 0) {
      void this.ensureValidSession();
      return;
    }
    this.expiryTimerId = setTimeout(() => void this.ensureValidSession(), msUntilExpiry + 1_000);
  }

  private clearExpiryTimer(): void {
    if (this.expiryTimerId) {
      clearTimeout(this.expiryTimerId);
      this.expiryTimerId = null;
    }
  }
}
