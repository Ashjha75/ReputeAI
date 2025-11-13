// Example: How to use the API services in your components

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../core/services/auth.service';
import { NotificationService } from '../core/services/notification.service';
import { LoadingService } from '../core/services/loading.service';

@Component({
  selector: 'app-login-example',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <input formControlName="email" type="email" placeholder="Email" />
        <input formControlName="password" type="password" placeholder="Password" />
        <button type="submit" [disabled]="isLoading">
          {{ isLoading ? 'Loading...' : 'Login' }}
        </button>
      </form>
    </div>
  `
})
export class LoginExampleComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private loadingService: LoadingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // Subscribe to loading state
    this.loadingService.loading$.subscribe(loading => {
      this.isLoading = loading;
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.notificationService.error('Please fill all required fields');
      return;
    }

    const credentials: LoginRequest = this.loginForm.value;

    // Call API
    this.authService.login(credentials).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Save auth data
          this.authService.saveAuthData(
            response.data.token,
            response.data.user
          );

          // Show success message
          this.notificationService.success('Login successful!');

          // Check for redirect URL
          const redirectUrl = this.getRedirectUrl();
          
          // Navigate to dashboard or redirect URL
          this.router.navigate([redirectUrl || '/dashboard']);
        }
      },
      error: (error) => {
        // Error handling is automatic via interceptor
        // But you can add custom error handling here
        this.notificationService.error(
          error.error || 'Login failed. Please try again.'
        );
      }
    });
  }

  private getRedirectUrl(): string | null {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const url = sessionStorage.getItem('redirectUrl');
      sessionStorage.removeItem('redirectUrl');
      return url;
    }
    return null;
  }
}

// ============================================
// Example: Create a custom service extending BaseApiService
// ============================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from '../core/services/base-api.service';
import { Observable } from 'rxjs';

export interface UserData {
  id: string;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseApiService {
  private readonly USER_ENDPOINTS = {
    LIST: '/users',
    DETAIL: '/users/:id',
    CREATE: '/users',
    UPDATE: '/users/:id',
    DELETE: '/users/:id'
  };

  constructor(http: HttpClient) {
    super(http);
  }

  /**
   * Get all users
   */
  getUsers(): Observable<any> {
    return this.get<UserData[]>(this.USER_ENDPOINTS.LIST, undefined, true);
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): Observable<any> {
    const endpoint = this.USER_ENDPOINTS.DETAIL.replace(':id', id);
    return this.get<UserData>(endpoint, undefined, true);
  }

  /**
   * Create new user
   */
  createUser(data: Partial<UserData>): Observable<any> {
    return this.post<UserData>(this.USER_ENDPOINTS.CREATE, data, true);
  }

  /**
   * Update user
   */
  updateUser(id: string, data: Partial<UserData>): Observable<any> {
    const endpoint = this.USER_ENDPOINTS.UPDATE.replace(':id', id);
    return this.put<UserData>(endpoint, data, true);
  }

  /**
   * Delete user
   */
  deleteUser(id: string): Observable<any> {
    const endpoint = this.USER_ENDPOINTS.DELETE.replace(':id', id);
    return this.delete(endpoint, true);
  }
}
