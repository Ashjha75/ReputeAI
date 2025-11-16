import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService, SignupRequest } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    LoaderComponent
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  signupForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;

  constructor() {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    
    // Only show error if both fields have values and they don't match
    if (password && confirmPassword && password !== confirmPassword) {
      return { mismatch: true };
    }
    return null;
  }

  get passwordsMatch(): boolean {
    const password = this.signupForm.get('password')?.value;
    const confirmPassword = this.signupForm.get('confirmPassword')?.value;
    return password === confirmPassword;
  }

  get showPasswordMismatch(): boolean {
    const password = this.signupForm.get('password')?.value;
    const confirmPassword = this.signupForm.get('confirmPassword')?.value;
    const confirmPasswordTouched = this.signupForm.get('confirmPassword')?.touched;
    return !!(password && confirmPassword && password !== confirmPassword && confirmPasswordTouched);
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    // Check password match locally before API call
    const password = this.signupForm.get('password')?.value;
    const confirmPassword = this.signupForm.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      this.notificationService.error('Passwords do not match');
      return;
    }

    this.isLoading = true;
    
    // Prepare payload matching backend API
    const signupData: SignupRequest = {
      firstName: this.signupForm.value.firstName,
      lastName: this.signupForm.value.lastName,
      email: this.signupForm.value.email,
      password: this.signupForm.value.password
    };

    this.authService.signup(signupData).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        // Show success message from backend or default
        const successMessage = response.data?.message || response.message || 'Registration successful. Please check your email to verify your account.';
        this.notificationService.success(successMessage);
        
        // Navigate to OTP verification page
        this.router.navigate(['/auth/otp'], { 
          queryParams: { email: signupData.email } 
        });
      },
      error: (error) => {
        this.isLoading = false;
        // Error notification already shown by BaseApiService
        console.error('Signup failed:', error);
      }
    });
  }

  signUpWithGoogle() {
    console.log('Sign up with Google');
    // Backend integration here
  }

  signUpWithGithub() {
    console.log('Sign up with Github');
    // Backend integration here
  }

  get firstName() { return this.signupForm.get('firstName'); }
  get lastName() { return this.signupForm.get('lastName'); }
  get email() { return this.signupForm.get('email'); }
  get password() { return this.signupForm.get('password'); }
  get confirmPassword() { return this.signupForm.get('confirmPassword'); }
  get terms() { return this.signupForm.get('terms'); }
}
