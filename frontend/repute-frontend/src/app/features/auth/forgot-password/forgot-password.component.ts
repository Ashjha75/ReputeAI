import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  resetSuccess = false;
  apiMessage?: string;
  confirmError?: string;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      token: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
    const queryEmail = this.route.snapshot.queryParamMap.get('email') ?? '';
    const queryToken = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.forgotPasswordForm.patchValue({ email: queryEmail, token: queryToken });
    if (!queryEmail || !queryToken) {
      this.apiMessage = 'The reset link is missing required parameters. Please use the link sent to your email.';
    }
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }
    const payload = this.forgotPasswordForm.getRawValue();
    const newPass = payload.newPassword;
    const confirm = payload.confirmPassword;
    if (newPass !== confirm) {
      this.confirmError = 'New password and confirmation must match';
      return;
    }
    this.confirmError = undefined;
    this.notificationService.dismiss();
    this.setLoadingState(true);
    this.authService.resetPassword({
      email: payload.email,
      token: payload.token,
      newPassword: newPass,
      confirmPassword: confirm
    }).subscribe({
      next: (res: any) => {
        this.setLoadingState(false);
        this.resetSuccess = true;
        const message = res?.data?.message ?? res?.message ?? 'Password has been reset successfully.';
        this.apiMessage = message;
        this.notificationService.success(message);
      },
      error: (err) => {
        this.setLoadingState(false);
        const message = err?.error?.message || err?.message || 'Password reset failed';
        this.apiMessage = message;
        this.notificationService.error(message);
      }
    });
  }

  get email() { return this.forgotPasswordForm.get('email'); }
  get token() { return this.forgotPasswordForm.get('token'); }
  get newPassword() { return this.forgotPasswordForm.get('newPassword'); }
  get confirmPassword() { return this.forgotPasswordForm.get('confirmPassword'); }

  get passwordsMismatch(): boolean {
    const newPass = this.newPassword?.value;
    const confirm = this.confirmPassword?.value;
    return !!newPass && !!confirm && newPass !== confirm;
  }

  togglePasswordVisibility(field: 'new' | 'confirm') {
    if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  private setLoadingState(value: boolean) {
    this.isLoading = value;
    ['newPassword', 'confirmPassword'].forEach(key => {
      const control = this.forgotPasswordForm.get(key);
      if (!control) return;
      if (value && control.enabled) {
        control.disable({ emitEvent: false });
      } else if (!value && control.disabled) {
        control.enable({ emitEvent: false });
      }
    });
  }
}
