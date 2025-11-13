import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private defaultConfig: MatSnackBarConfig = {
    duration: 3000,
    horizontalPosition: 'end',
    verticalPosition: 'top'
  };

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Show success message
   */
  success(message: string, duration?: number): void {
    this.snackBar.open(message, '✓', {
      ...this.defaultConfig,
      duration: duration || this.defaultConfig.duration,
      panelClass: ['snack-success']
    });
  }

  /**
   * Show error message
   */
  error(message: string, duration?: number): void {
    this.snackBar.open(message, '✕', {
      ...this.defaultConfig,
      duration: duration || this.defaultConfig.duration,
      panelClass: ['snack-error']
    });
  }

  /**
   * Show warning message
   */
  warning(message: string, duration?: number): void {
    this.snackBar.open(message, '⚠', {
      ...this.defaultConfig,
      duration: duration || this.defaultConfig.duration,
      panelClass: ['snack-warning']
    });
  }

  /**
   * Show info message
   */
  info(message: string, duration?: number): void {
    this.snackBar.open(message, 'i', {
      ...this.defaultConfig,
      duration: duration || this.defaultConfig.duration,
      panelClass: ['snack-info']
    });
  }

  /**
   * Dismiss all notifications
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }
}
