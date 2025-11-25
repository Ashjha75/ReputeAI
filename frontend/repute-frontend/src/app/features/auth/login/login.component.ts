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
import { UserProfileService } from '../../../core/services/user-profile.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { environment } from '../../../../environments/environment';

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
  private userProfileService = inject(UserProfileService);
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
        const original = res?.data ;
        const token = original?.token ?? original?.data?.token ?? original?.data?.accessToken ?? original?.accessToken;
        const refreshToken = original?.refreshToken
          ?? null;
        const user = original?.userId ;

        if (token) {
          if (refreshToken) {
            this.authService.saveAuthDataWithRefresh(token, user, refreshToken);
          } else {
            this.authService.saveAuthData(token, user);
          }
          this.authService.getUserProfile().subscribe({
            next: (profileRes: any) => {
              const profile = profileRes?.data ?? profileRes;
              this.userProfileService.setUserProfile(profile);
              const successMsg = original?.message || res?.message || 'Logged in successfully';
              this.notificationService.success(successMsg, 5000);
              this.router.navigate(['/']);
            },
            error: (err) => {
              const msg = err?.error?.message || err?.message || 'Logged in, but failed to fetch user info';
              this.notificationService.error(msg, 5000);
              this.router.navigate(['/']);
            }
          });
          return;
        }
        let failMsg = 'Login failed1';
         if (original?.message) {
          failMsg = original.message;
        }
        this.notificationService.error(failMsg, 5000);
      },
      error: (err) => {
        this.isLoading = false;
        let msg = 'Login failed';
        let errorCode = err?.errorCode;
        let backendMsg = err?.message ;
        if (backendMsg) msg = backendMsg;
        // Special case: Email not verified, errorCode FORBIDDEN
        if (
          errorCode === 'FORBIDDEN' &&
          typeof backendMsg === 'string' &&
          backendMsg.toLowerCase().includes('email not verified')
        ) {
          this.notificationService.error(msg, 5000);
          this.router.navigate(['/auth/otp'], { queryParams: { email: this.loginForm.value.email } });
          return;
        }
        this.notificationService.error(msg, 5000);
      }
    });
  }

  loginWithGoogle() {
    // Build OAuth URL from API base but remove the '/api' path segment if present
    const apiHost = environment.apiUrl.replace(/\/$/, '').replace(/\/api\/?$/i, '');
    const url = `${apiHost}/oauth2/authorization/google`;
    this.openOAuthPopup(url, 'Google');
  }

  loginWithGithub() {
    const apiHost = environment.apiUrl.replace(/\/$/, '').replace(/\/api\/?$/i, '');
    const url = `${apiHost}/oauth2/authorization/github`;
    this.openOAuthPopup(url, 'Github');
  }

  private openOAuthPopup(url: string, providerName = 'OAuth') {
    try {
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;
      const opts = `toolbar=no,menubar=no,width=${width},height=${height},top=${top},left=${left}`;
      const popup = window.open(url, `oauth_${providerName}`, opts);
      if (!popup) {
        // Popup blocked — fallback to full redirect
        window.location.href = url;
        return;
      }

      // Listen for postMessage from redirect page as primary signal
      const messageHandler = (event: MessageEvent) => {
        try {
          const data = event?.data;
          if (data && data.type === 'oauth2:complete') {
            // Clean up
            window.removeEventListener('message', messageHandler);
            try { if (popup && !popup.closed) popup.close(); } catch (e) { /* ignore */ }
            // Give the browser a short moment to persist cookies set by the popup
            // (some browsers may need a small delay before cookies are visible to the opener)
            setTimeout(() => {
              this.authService.getUserProfile().subscribe({
                next: (profileRes: any) => {
                  const profile = profileRes?.data ?? profileRes;
                  if (profile) {
                    this.userProfileService.setUserProfile(profile);
                    this.notificationService.success('Logged in successfully', 4000);
                    this.router.navigate(['/']);
                  }
                },
                error: () => { /* ignore */ }
              });
            }, 600);
          }
        } catch (e) {
          // ignore
        }
      };

      window.addEventListener('message', messageHandler, false);

      // Fallback polling: detect popup close if postMessage not supported
      const poll = setInterval(() => {
        try {
          if (!popup || popup.closed) {
            clearInterval(poll);
            window.removeEventListener('message', messageHandler);
            // Attempt to refresh profile after a short delay — gives browser time
            // to set cookies created by the popup's redirect response.
            setTimeout(() => {
              this.authService.getUserProfile().subscribe({
                next: (profileRes: any) => {
                  const profile = profileRes?.data ?? profileRes;
                  if (profile) {
                    this.userProfileService.setUserProfile(profile);
                    this.notificationService.success('Logged in successfully', 4000);
                    this.router.navigate(['/']);
                  }
                },
                error: () => {
                  // No-op; user may have cancelled login
                }
              });
            }, 600);
          }
        } catch (e) {
          // Accessing popup properties may throw cross-origin errors while provider is redirecting.
          // Ignore and continue polling.
        }
      }, 500);
    } catch (err) {
      console.error('OAuth popup failed', err);
      // fallback to full redirect
      window.location.href = url;
    }
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
