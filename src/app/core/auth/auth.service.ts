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
} from '../models/auth.models';
import { TokenStore } from './token.store';
import { emailFromToken, isTokenExpired, rolesFromToken } from './jwt.utils';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokens = inject(TokenStore);

  readonly passwordMustChange = signal(false);
  private refreshInFlight: Promise<boolean> | null = null;

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

  async login(request: LoginRequest): Promise<LoginResponse> {
    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${environment.apiBaseUrl}/api/v1/auth/login`, request),
    );
    this.tokens.save(res.accessToken, res.refreshToken, res.expiresInSeconds);
    this.passwordMustChange.set(!!res.passwordMustChange);
    return res;
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
    this.tokens.clear();
    this.passwordMustChange.set(false);
    void this.router.navigate(['/login']);
  }
}
