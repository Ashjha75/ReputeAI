import { Component, ViewChild } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ConfirmModalComponent
  ],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  @ViewChild(ConfirmModalComponent) confirmModal!: ConfirmModalComponent;
  changePasswordForm: FormGroup;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
    
    // Update validity as user types so UI messages are realtime
    this.changePasswordForm.valueChanges.subscribe(() => {
      // Trigger validations and update control errors for current/new equality
      const current = this.changePasswordForm.get('currentPassword')?.value;
      const newP = this.changePasswordForm.get('newPassword')?.value;

      const newCtrl = this.changePasswordForm.get('newPassword');
      if (newCtrl) {
        if (current && newP && current === newP) {
          newCtrl.setErrors({ ...newCtrl.errors, sameAsCurrent: true });
        } else {
          // remove sameAsCurrent but keep other errors
          const errors = { ...newCtrl.errors };
          if (errors) {
            delete errors['sameAsCurrent'];
            if (Object.keys(errors).length === 0) {
              newCtrl.setErrors(null);
            } else {
              newCtrl.setErrors(errors);
            }
          }
        }
      }
    });
    }

  passwordMatchValidator(g: FormGroup) {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    const currentPassword = g.get('currentPassword')?.value;

    const errors: any = {};
    // Check for mismatch
    if (newPassword !== confirmPassword) {
      errors['mismatch'] = true;
      // Set error on confirmPassword control for direct access in template
      const confirmCtrl = g.get('confirmPassword');
      if (confirmCtrl && !confirmCtrl.hasError('required')) {
        confirmCtrl.setErrors({ ...(confirmCtrl.errors || {}), mismatch: true });
      }
    } else {
      // Remove mismatch error if present
      const confirmCtrl = g.get('confirmPassword');
      if (confirmCtrl && confirmCtrl.errors && confirmCtrl.errors['mismatch']) {
        const newErrors = { ...confirmCtrl.errors };
        delete newErrors['mismatch'];
        if (Object.keys(newErrors).length === 0) {
          confirmCtrl.setErrors(null);
        } else {
          confirmCtrl.setErrors(newErrors);
        }
      }
    }
    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors['sameAsCurrent'] = true;
    }
    return Object.keys(errors).length ? errors : null;
  }

  onSubmit() {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    // Show confirmation modal before changing password
    this.confirmModal.applyConfig({
      title: 'Change Password',
      message: 'Are you sure you want to change your password?',
      variant: 'warning',
      confirmLabel: 'Confirm',
      cancelLabel: 'Cancel'
    });
    this.confirmModal.open();

    // Handle user confirmation
    this.confirmModal.confirm.subscribe(() => {
      this.changePassword();
    });
  }

  private changePassword() {
    this.isLoading = true;
    const { currentPassword, newPassword, confirmPassword } = this.changePasswordForm.value;
    this.authService.changePassword(currentPassword, newPassword, confirmPassword).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.success) {
          // Show success snackbar and redirect
          this.notificationService.success(res?.message || 'Password changed successfully');
          this.router.navigate(['/']);
        } else {
          this.notificationService.error(res?.message || 'Password change failed');
        }
      },
      error: (err) => {
        this.isLoading = false;
        // Show error snackbar
        this.notificationService.error(err?.error?.message || err?.message || 'Password change failed');
      }
    });
  }

  get currentPassword() { return this.changePasswordForm.get('currentPassword'); }
  get newPassword() { return this.changePasswordForm.get('newPassword'); }
  get confirmPassword() { return this.changePasswordForm.get('confirmPassword'); }

  // Password requirement checks (used by template for realtime UI)
  pwHasMinLength(): boolean {
    const v = this.newPassword?.value ?? '';
    return v?.length >= 8;
  }

  pwHasLettersAndNumbers(): boolean {
    const v = this.newPassword?.value ?? '';
    return /[A-Za-z]/.test(v) && /\d/.test(v);
  }

  pwHasSpecialChar(): boolean {
    const v = this.newPassword?.value ?? '';
    return /[!@#$%^&*(),.?":{}|<>\[\]\\/;`~_+=-]/.test(v);
  }
}
