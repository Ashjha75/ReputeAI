import { Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
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
  token: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseApiService {
  private readonly AUTH_ENDPOINTS = {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    PROFILE: '/auth/profile'
  };

  constructor(http: HttpClient) {
    super(http);
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<any> {
    return this.post<AuthResponse>(this.AUTH_ENDPOINTS.LOGIN, credentials);
  }

  /**
   * Signup new user
   */
  signup(userData: SignupRequest): Observable<any> {
    return this.post<AuthResponse>(this.AUTH_ENDPOINTS.SIGNUP, userData);
  }

  /**
   * Logout user
   */
  logout(): Observable<any> {
    return this.post(this.AUTH_ENDPOINTS.LOGOUT, {}, true);
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
    return this.post(this.AUTH_ENDPOINTS.FORGOT_PASSWORD, data);
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

  /**
   * Get user profile
   */
  getUserProfile(): Observable<any> {
    return this.get<UserProfile>(this.AUTH_ENDPOINTS.PROFILE, undefined, true);
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
   * Get current user from storage
   */
  getCurrentUser(): UserProfile | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  /**
   * Save authentication data
   */
  saveAuthData(token: string, user: UserProfile): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  /**
   * Clear authentication data
   */
  clearAuthData(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
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
