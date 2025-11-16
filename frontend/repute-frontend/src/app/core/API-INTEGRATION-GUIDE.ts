/**
 * ═══════════════════════════════════════════════════════════════
 * COMPLETE API INTEGRATION - USAGE GUIDE
 * ═══════════════════════════════════════════════════════════════
 * 
 * This demonstrates the complete professional API architecture.
 * 
 * ARCHITECTURE:
 * ├── BaseApiService (Generic HTTP methods + Auto notifications)
 * ├── AuthService (Business logic: signup, login, etc.)
 * └── Component (Just calls the service method)
 * 
 * KEY FEATURES:
 * ✅ Automatic environment switching (dev/staging/prod)
 * ✅ Automatic error handling
 * ✅ Automatic success/error notifications
 * ✅ Automatic token storage
 * ✅ No code duplication
 * ✅ No hardcoded URLs
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, SignupRequest } from '../core/services/auth.service';

/**
 * ═══════════════════════════════════════════════════════════════
 * EXAMPLE 1: SIGNUP COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="signup-container">
      <h2>Create Account</h2>
      
      <form [formGroup]="signupForm" (ngSubmit)="onSignup()">
        <div class="form-group">
          <label>Username</label>
          <input type="text" formControlName="username" placeholder="Enter username">
          <span class="error" *ngIf="signupForm.get('username')?.touched && signupForm.get('username')?.invalid">
            Username is required (min 3 characters)
          </span>
        </div>

        <div class="form-group">
          <label>Email</label>
          <input type="email" formControlName="email" placeholder="Enter email">
          <span class="error" *ngIf="signupForm.get('email')?.touched && signupForm.get('email')?.invalid">
            Valid email is required
          </span>
        </div>

        <div class="form-group">
          <label>Password</label>
          <input type="password" formControlName="password" placeholder="Enter password">
          <span class="error" *ngIf="signupForm.get('password')?.touched && signupForm.get('password')?.invalid">
            Password must be at least 8 characters
          </span>
        </div>

        <div class="form-group">
          <label>Confirm Password</label>
          <input type="password" formControlName="confirmPassword" placeholder="Confirm password">
          <span class="error" *ngIf="signupForm.get('confirmPassword')?.touched && passwordMismatch()">
            Passwords do not match
          </span>
        </div>

        <div class="form-group checkbox">
          <input type="checkbox" formControlName="agreeToTerms" id="terms">
          <label for="terms">I agree to Terms & Conditions</label>
        </div>

        <button 
          type="submit" 
          [disabled]="signupForm.invalid || isLoading"
          class="btn-primary">
          {{ isLoading ? 'Creating Account...' : 'Sign Up' }}
        </button>
      </form>

      <p class="signin-link">
        Already have an account? <a routerLink="/login">Sign In</a>
      </p>
    </div>
  `,
  styles: [`
    .signup-container {
      max-width: 450px;
      margin: 50px auto;
      padding: 30px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.1);
    }
    h2 { text-align: center; margin-bottom: 30px; color: #181c23; }
    .form-group { margin-bottom: 20px; }
    .form-group.checkbox { display: flex; align-items: center; gap: 10px; }
    label { display: block; margin-bottom: 8px; font-weight: 500; color: #222b36; }
    input[type="text"], input[type="email"], input[type="password"] {
      width: 100%;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.3s;
    }
    input:focus { outline: none; border-color: #3b82f6; }
    .error { display: block; color: #ef4444; font-size: 12px; margin-top: 5px; }
    .btn-primary {
      width: 100%;
      padding: 14px;
      background: #000;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    .btn-primary:hover:not(:disabled) { background: #1a1a1a; transform: translateY(-2px); }
    .btn-primary:disabled { background: #9ca3af; cursor: not-allowed; }
    .signin-link { text-align: center; margin-top: 20px; color: #6b7280; }
    .signin-link a { color: #3b82f6; text-decoration: none; font-weight: 500; }
  `]
})
export class SignupComponent {
  // ═════════════════════════════════════════
  // STEP 1: INJECT SERVICES
  // ═════════════════════════════════════════
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  signupForm: FormGroup;
  isLoading = false;

  constructor() {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      agreeToTerms: [false, Validators.requiredTrue]
    });
  }

  // ═════════════════════════════════════════
  // STEP 2: CALL THE SERVICE - THAT'S ALL!
  // ═════════════════════════════════════════
  onSignup(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const signupData: SignupRequest = this.signupForm.value;

    // 🎯 SIMPLE API CALL - Everything handled automatically!
    // ✅ API URL from environment (auto-switches between dev/staging/prod)
    // ✅ Headers configured automatically
    // ✅ Error handling automatic
    // ✅ Success toast automatic ("Account created successfully")
    // ✅ Error toast automatic ("Email already exists")
    // ✅ Token storage automatic
    this.authService.signup(signupData).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Signup successful:', response.data);
        
        // Navigate to dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Signup error:', error);
        // Error notification already shown automatically
      }
    });
  }

  passwordMismatch(): boolean {
    const password = this.signupForm.get('password')?.value;
    const confirmPassword = this.signupForm.get('confirmPassword')?.value;
    return password !== confirmPassword && confirmPassword !== '';
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * EXAMPLE 2: LOGIN COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */
@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <form (submit)="onLogin()">
      <input [(ngModel)]="email" type="email" placeholder="Email">
      <input [(ngModel)]="password" type="password" placeholder="Password">
      <button type="submit">Login</button>
    </form>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  email = '';
  password = '';

  onLogin(): void {
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        console.log('Login successful!');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Login failed:', error);
      }
    });
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * EXAMPLE 3: FORGOT PASSWORD
 * ═══════════════════════════════════════════════════════════════
 */
@Component({
  selector: 'app-forgot-password',
  template: `
    <form (submit)="onForgotPassword()">
      <input [(ngModel)]="email" type="email" placeholder="Enter your email">
      <button type="submit">Reset Password</button>
    </form>
  `
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  email = '';

  onForgotPassword(): void {
    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: () => {
        console.log('Password reset email sent!');
        // Success notification shown automatically
      }
    });
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * HOW TO ADD NEW API ENDPOINTS
 * ═══════════════════════════════════════════════════════════════
 * 
 * Example: Add "Update Profile" endpoint
 * 
 * STEP 1: Add to AuthService (or create new service)
 * ────────────────────────────────────────────────────
 * 
 * In auth.service.ts:
 * 
 * ```typescript
 * private readonly AUTH_ENDPOINTS = {
 *   ...existing,
 *   UPDATE_PROFILE: '/v1/profile/update'
 * };
 * 
 * updateProfile(profileData: any): Observable<any> {
 *   return this.put(this.AUTH_ENDPOINTS.UPDATE_PROFILE, profileData, true, true);
 *   // Parameters:
 *   // - endpoint: string
 *   // - body: any
 *   // - requireAuth: boolean (true = add Authorization header)
 *   // - showNotification: boolean (true = show success/error toast)
 * }
 * ```
 * 
 * STEP 2: Use in Component
 * ────────────────────────────────────────────────────
 * 
 * ```typescript
 * export class ProfileComponent {
 *   private authService = inject(AuthService);
 * 
 *   updateProfile() {
 *     const data = { firstName: 'John', lastName: 'Doe' };
 *     
 *     this.authService.updateProfile(data).subscribe({
 *       next: (response) => {
 *         console.log('Profile updated!');
 *         // Success toast shown automatically
 *       },
 *       error: (error) => {
 *         console.error('Update failed:', error);
 *         // Error toast shown automatically
 *       }
 *     });
 *   }
 * }
 * ```
 * 
 * THAT'S IT! ✅
 */

/**
 * ═══════════════════════════════════════════════════════════════
 * ENVIRONMENT CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 * 
 * All API URLs are configured in environment files.
 * Angular automatically uses the correct file based on build configuration.
 * 
 * DEVELOPMENT (ng serve):
 * ─────────────────────────────────────────────
 * File: src/environments/environment.ts
 * API URL: http://localhost:8080/api
 * Full signup URL: http://localhost:8080/api/v1/auth/signup
 * 
 * STAGING (ng serve --configuration staging):
 * ─────────────────────────────────────────────
 * File: src/environments/environment.staging.ts
 * API URL: https://staging-api.reputeai.com/api
 * Full signup URL: https://staging-api.reputeai.com/api/v1/auth/signup
 * 
 * PRODUCTION (ng build --configuration production):
 * ─────────────────────────────────────────────
 * File: src/environments/environment.prod.ts
 * API URL: https://api.reputeai.com/api
 * Full signup URL: https://api.reputeai.com/api/v1/auth/signup
 * 
 * NO CODE CHANGES NEEDED! Environment switches automatically. ✨
 */

/**
 * ═══════════════════════════════════════════════════════════════
 * NOTIFICATION CUSTOMIZATION
 * ═══════════════════════════════════════════════════════════════
 * 
 * To disable automatic notifications for a specific call:
 * 
 * ```typescript
 * // In service
 * getSomething(): Observable<any> {
 *   return this.get('/endpoint', {}, false, false);
 *   //                                      ^^^^^ showNotification = false
 * }
 * 
 * // In component - handle notification manually
 * private notificationService = inject(NotificationService);
 * 
 * this.someService.getSomething().subscribe({
 *   next: (response) => {
 *     this.notificationService.success('Custom message!');
 *   },
 *   error: (error) => {
 *     this.notificationService.error('Custom error!');
 *   }
 * });
 * ```
 */

/**
 * ═══════════════════════════════════════════════════════════════
 * SUMMARY - WHAT YOU GET
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ Automatic environment switching (dev/staging/prod)
 * ✅ Automatic API URL configuration
 * ✅ Automatic authentication headers
 * ✅ Automatic error handling
 * ✅ Automatic success/error notifications (toast)
 * ✅ Automatic token storage
 * ✅ Type-safe API responses
 * ✅ Centralized endpoint management
 * ✅ No code duplication
 * ✅ No hardcoded URLs
 * 
 * ═══════════════════════════════════════════════════════════════
 * TO USE IN YOUR COMPONENTS:
 * ═══════════════════════════════════════════════════════════════
 * 
 * 1. Inject the service:
 *    private authService = inject(AuthService);
 * 
 * 2. Call the method:
 *    this.authService.signup(data).subscribe({ ... });
 * 
 * 3. That's it! Everything else is automatic.
 * 
 * ═══════════════════════════════════════════════════════════════
 */
