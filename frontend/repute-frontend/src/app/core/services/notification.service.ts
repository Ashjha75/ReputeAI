import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { NotificationSnackComponent, NotificationType } from '../../core/components/notification-snack/notification-snack.component';

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

  private open(type: NotificationType, message: string, duration?: number): void {
    this.snackBar.openFromComponent(NotificationSnackComponent, {
      ...this.defaultConfig,
      duration: duration || this.defaultConfig.duration,
      data: { type, message },
      panelClass: ['snack', `snack-${type}`]
    });
  }

  success(message: string, duration?: number): void { this.open('success', message, duration); }
  error(message: string, duration?: number): void { this.open('error', message, duration); }
  warning(message: string, duration?: number): void { this.open('warning', message, duration); }
  info(message: string, duration?: number): void { this.open('info', message, duration); }

  /**
   * Dismiss all notifications
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }
}
