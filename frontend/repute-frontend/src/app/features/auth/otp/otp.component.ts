import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
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
    this.startResendTimer();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startResendTimer() {
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
      const otp = Object.values(this.otpForm.value).join('');
      
      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        // Navigate to login or home
        this.router.navigate(['/auth/login']);
      }, 1500);
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
