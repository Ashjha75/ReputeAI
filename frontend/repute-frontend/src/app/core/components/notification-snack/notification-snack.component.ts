import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationSnackData {
  type: NotificationType;
  message: string;
}

@Component({
  selector: 'app-notification-snack',
  standalone: true,
  imports: [NgClass, MatButtonModule],
  template: `
    <div class="notification-snack" [ngClass]="data.type">
      <span class="icon material-icons" [ngClass]="data.type">{{ icon }}</span>
      <span class="message">{{ data.message }}</span>
      <button mat-icon-button class="close-btn" aria-label="Close" (click)="close()">
        <span class="material-icons">close</span>
      </button>
    </div>
  `,
  styles: [
`
    .notification-snack { display: flex; align-items: center; gap: 12px; padding: 12px 16px; }
    .notification-snack.success { border-left: 4px solid #10b981; }
    .notification-snack.error { border-left: 4px solid #ef4444; }
    .notification-snack.warning { border-left: 4px solid #f59e0b; }
    .notification-snack.info { border-left: 4px solid #3b82f6; }
    .icon { font-size: 22px; }
    .notification-snack.success .icon { color: #10b981; }
    .notification-snack.error .icon { color: #ef4444; }
    .notification-snack.warning .icon { color: #f59e0b; }
    .notification-snack.info .icon { color: #3b82f6; }
    .message { flex: 1; font-size: 14px; font-weight: 500; color: #374151; }
    .close-btn { margin-left: 4px; }
    .close-btn .material-icons { font-size: 20px; }
  `]
})
export class NotificationSnackComponent {
  icon: string;
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: NotificationSnackData,
    private snackRef: MatSnackBarRef<NotificationSnackComponent>
  ) {
    this.icon = this.getIcon(data.type);
  }

  getIcon(type: NotificationType): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  }

  close(): void {
    this.snackRef.dismiss();
  }
}
