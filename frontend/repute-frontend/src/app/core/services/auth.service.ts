import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { BehaviorSubject } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: UserProfile;
  expiresIn?: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseApiService {
  // Public auth state observable for UI to react to login/logout
  public authState: BehaviorSubject<boolean>;
  private readonly AUTH_ENDPOINTS = {
    LOGIN: '/v1/auth/login',
    SIGNUP: '/v1/auth/signup',
    LOGOUT: '/v1/auth/logout',
    REFRESH: '/v1/auth/refresh',
    FORGOT_PASSWORD: '/v1/auth/forgot-password',
    RESET_PASSWORD: '/v1/auth/reset-password',
    VERIFY_EMAIL: '/v1/auth/verify-email',
    VERIFY_EMAIL_CONFIRM: '/v1/auth/verify-email',
    PROFILE: '/v1/users/info',
    CHANGE_PASSWORD: '/v1/users/change-password'
  };
  /**
   * Change password for current user
   */
  changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Observable<any> {
    const body = { currentPassword, newPassword, confirmPassword };
    return this.put<any>(this.AUTH_ENDPOINTS.CHANGE_PASSWORD, body, true, false);
  }

  private _currentUserCache: UserProfile | null = null;

  constructor(http: HttpClient) {
    super(http);
    this.authState = new BehaviorSubject<boolean>(this.isAuthenticated());
  }

  // inject router & notification lazily
  private router = inject(Router);
  private notifService = inject(NotificationService);

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<any> {
    return this.post<AuthResponse>(this.AUTH_ENDPOINTS.LOGIN, credentials).pipe(
      tap(response => {
        if (response?.success && response?.data) {
          if (response.data.token) {
            this.storeAuthData(response.data.token, response.data.user, response.data.refreshToken);
          }
        }
      })
    );
  }

  /**
   * Signup new user
   * @param userData - User signup data
   * @returns Observable with auth response
   */
  signup(userData: SignupRequest): Observable<any> {
    return this.post<AuthResponse>(this.AUTH_ENDPOINTS.SIGNUP, userData, false, true).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Store token and user data
          if (response.data.token) {
            this.storeAuthData(response.data.token, response.data.user);
          }
        }
      })
    );
  }

  /**
   * Store authentication data
   */
  private storeAuthData(token: string, user: UserProfile, refreshToken?: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      // notify subscribers
      try { this.authState.next(true); } catch {}
      this._currentUserCache = user;
    }
  }





  /**
   * Logout user
   */
  logout(refreshToken?: string): Observable<any> {
    const body = refreshToken ? { refreshToken } : {};
    return this.post(this.AUTH_ENDPOINTS.LOGOUT, body, true);
  }

  /**
   * Refresh authentication token
   */
  refreshToken(refreshToken: string): Observable<any> {
    return this.post<AuthResponse>(this.AUTH_ENDPOINTS.REFRESH, { refreshToken });
  }

  /**
   * Forgot password
   */
  forgotPassword(data: ForgotPasswordRequest): Observable<any> {
    return this.post(this.AUTH_ENDPOINTS.FORGOT_PASSWORD, data, false, false);
  }

  /**
   * Reset password
   */
  resetPassword(data: ResetPasswordRequest): Observable<any> {
    return this.post(this.AUTH_ENDPOINTS.RESET_PASSWORD, data);
  }

  /**
   * Verify email
   */
  verifyEmail(token: string): Observable<any> {
    return this.post(this.AUTH_ENDPOINTS.VERIFY_EMAIL, { token });
  }

  verifyEmailConfirmation(email: string, otp: string): Observable<any> {
    const body = { email, otp };
    return this.post(this.AUTH_ENDPOINTS.VERIFY_EMAIL_CONFIRM, body, false, false);
  }

  /**
   * Get user profile
   */
  getUserProfile(): Observable<any> {
    return this.get<any>(this.AUTH_ENDPOINTS.PROFILE, undefined, true);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Check token expiration
    try {
      const payload = this.decodeToken(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  /**
   * Get auth token (public for interceptor)
   */
  public override getToken(): string | null {
    return super.getToken();
  }

  /**
   * Get current user from storage
   */
  getCurrentUser(): UserProfile | null {
    return this.loadCachedUser();
  }

  private loadCachedUser(): UserProfile | null {
    if (this._currentUserCache) {
      return this._currentUserCache;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      this._currentUserCache = userStr ? JSON.parse(userStr) : null;
    }
    return this._currentUserCache;
  }

  /**
   * Save authentication data
   */
  saveAuthData(token: string, user: UserProfile): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      try { this.authState.next(true); } catch {}
      this._currentUserCache = user;
    }
  }

  /** Save auth data with optional refresh token */
  saveAuthDataWithRefresh(token: string, user: UserProfile, refreshToken?: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      try { this.authState.next(true); } catch {}
      this._currentUserCache = user;
    }
  }

  /** Get stored refresh token */
  getRefreshToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  /**
   * Clear authentication data
   */
  clearAuthData(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      try { this.authState.next(false); } catch {}
    }
    this._currentUserCache = null;
  }

  /**
   * Try to refresh session using a refresh token.
   * On success: save new auth data and show success notification.
   * On failure: clear auth and redirect to login.
   */
  performRefresh(refreshToken: string): Observable<any> {
    const req$ = this.post(this.AUTH_ENDPOINTS.REFRESH, { refreshToken }, false, false);
    req$.subscribe({
      next: (res: any) => {
        const original = res?.data ?? res;
        if (res?.success && original) {
          const token = original?.token ?? original?.accessToken ?? original?.data?.token ?? null;
          const user = original?.user ?? original?.data?.user ?? null;
          if (token) {
            this.saveAuthData(token, user);
            this.notifService.success(original?.message || res?.message || 'Session refreshed');
            return;
          }
        }
        this.notifService.error(res?.message || 'Session refresh failed. Please login again.');
        try { this.clearAuthData(); } catch {}
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.notifService.error(err?.error?.message || err?.message || 'Session refresh failed. Please login again.');
        try { this.clearAuthData(); } catch {}
        this.router.navigate(['/auth/login']);
      }
    });
    return req$;
  }

  /**
   * Decode JWT token
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }
}
