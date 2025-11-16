import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-otp',
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
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.css']
})
export class OtpComponent implements OnInit {
  otpForm: FormGroup;
  email: string = '';
  isLoading = false;
  resendTimer = 60;
  canResend = false;
  timerInterval: any;
  verificationComplete = false;
  verificationMessage?: string;
  errorMessage?: string;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificationService: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.otpForm = this.fb.group({
      digit1: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit2: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit3: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit4: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit5: ['', [Validators.required, Validators.pattern(/^\d$/)]],
      digit6: ['', [Validators.required, Validators.pattern(/^\d$/)]],
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });
    if (isPlatformBrowser(this.platformId)) {
      this.startResendTimer();
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId) && this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startResendTimer() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.canResend = false;
    this.resendTimer = 60;
    this.timerInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        this.canResend = true;
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  onDigitInput(event: any, nextInput: string, prevInput?: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    const input = event.target;
    const value = input.value;

    if (value.length === 1 && /^\d$/.test(value)) {
      // Move to next input
      if (nextInput) {
        const next = document.getElementById(nextInput) as HTMLInputElement;
        if (next) next.focus();
      }
    } else if (event.key === 'Backspace' && !value && prevInput) {
      // Move to previous input on backspace
      const prev = document.getElementById(prevInput) as HTMLInputElement;
      if (prev) prev.focus();
    }
  }

  onPaste(event: ClipboardEvent) {
    if (!isPlatformBrowser(this.platformId)) return;
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text');
    if (pastedData && /^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      this.otpForm.patchValue({
        digit1: digits[0],
        digit2: digits[1],
        digit3: digits[2],
        digit4: digits[3],
        digit5: digits[4],
        digit6: digits[5],
      });
    }
  }

  onSubmit() {
    if (this.otpForm.valid) {
      this.isLoading = true;
      this.errorMessage = undefined;
      const otp = Object.values(this.otpForm.value).join('');
      this.authService.verifyEmailConfirmation(this.email, otp).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.verificationComplete = true;
          const message = res?.data?.message ?? res?.message ?? 'Email verified successfully.';
          this.verificationMessage = message;
          this.notificationService.success(message);
        },
        error: (err) => {
          this.isLoading = false;
          const message = err?.error?.message || err?.message || 'OTP validation failed.';
          this.errorMessage = message;
          this.notificationService.error(message);
        }
      });
    }
  }

  resendOtp() {
    if (this.canResend) {
      console.log('Resending OTP to', this.email);
      this.startResendTimer();
      // Backend integration here
    }
  }
}
