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
        console.log(err,"⛈️");
        this.isLoading = false;
        let msg = 'Login failed2';
        if (err?.error?.message) {
          msg = err.error.message;
        } else if (err?.message) {
          msg = err.message;
        }
        this.notificationService.error(msg, 5000);
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
