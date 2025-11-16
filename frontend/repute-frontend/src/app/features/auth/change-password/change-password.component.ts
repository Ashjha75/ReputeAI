import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
    MatIconModule
  ],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
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

      const currentCtrl = this.changePasswordForm.get('currentPassword');
      if (currentCtrl) {
        if (current && newP && current !== newP) {
          currentCtrl.setErrors({ ...currentCtrl.errors, oldMismatch: true });
        } else {
          // remove oldMismatch but keep other errors
          const errors = { ...currentCtrl.errors };
          if (errors) {
            delete errors['oldMismatch'];
            if (Object.keys(errors).length === 0) {
              currentCtrl.setErrors(null);
            } else {
              currentCtrl.setErrors(errors);
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
    if (newPassword !== confirmPassword) {
      errors['mismatch'] = true;
    }
    if (currentPassword && newPassword && currentPassword !== newPassword) {
      errors['oldMismatch'] = true;
    }
    return Object.keys(errors).length ? errors : null;
  }

  onSubmit() {
    if (this.changePasswordForm.valid) {
      this.isLoading = true;
      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        // Navigate to home or show success
        this.router.navigate(['/']);
      }, 1500);
    }
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
