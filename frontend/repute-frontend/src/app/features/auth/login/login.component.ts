import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const payload = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      // rememberMe: this.loginForm.value.rememberMe
    };

    this.authService.login(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        // Normalize token & user from wrapped ApiResponse or direct response
        // BaseApiService wraps responses as { success: true, data: <originalResponse>, message }
        const original = res?.data ?? res;
        const token = original?.token ?? original?.data?.token ?? original?.data?.accessToken ?? original?.accessToken;
        const user = original?.user ?? original?.data?.user ?? original?.data?.profile ?? null;

        if (token) {
          // Save auth data and navigate
          this.authService.saveAuthData(token, user);
          // Prefer backend message if available
          const successMsg = original?.message || res?.message || 'Logged in successfully';
          this.notificationService.success(successMsg);
          // Redirect to home
          this.router.navigate(['/']);
          return;
        }

        const msg = res?.message || 'Login failed';
        this.notificationService.error(msg);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.message || 'Login failed';
        this.notificationService.error(msg);
      }
    });
  }

  loginWithGoogle() {
    console.log('Login with Google');
    // Backend integration here
  }

  loginWithGithub() {
    console.log('Login with Github');
    // Backend integration here
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
