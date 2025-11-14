import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type LoaderVariant = 'primary' | 'surface' | 'contrast';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="loading">
      <div class="loader-shell" [class.fullscreen]="fullscreen">
        <div
          class="loader-card"
          role="status"
          aria-live="polite"
          [class.surface]="variant === 'surface'"
          [class.contrast]="variant === 'contrast'"
        >
          <div class="loader-signal">
            <div class="pulse-ring ring-1"></div>
            <div class="pulse-ring ring-2"></div>
            <div class="pulse-ring ring-3"></div>
            <span class="material-icons loader-icon">{{ icon }}</span>
          </div>
          <div class="loader-text">
            <p class="loader-title">{{ message }}</p>
            <p *ngIf="subtext" class="loader-subtext">{{ subtext }}</p>
          </div>
          <div class="loader-progress" *ngIf="progress !== null && progress !== undefined">
            <div class="progress-track">
              <div class="progress-fill" [style.width.%]="clampedProgress"></div>
            </div>
            <span class="progress-label">{{ clampedProgress }}%</span>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent {
  /** Controls visibility */
  @Input() loading = true;
  /** Locks body with a blurred overlay */
  @Input() fullscreen = false;
  /** Primary headline */
  @Input() message = 'Preparing your experience';
  /** Supporting copy */
  @Input() subtext = 'Syncing with ReputeAI services. This only takes a second.';
  /** Material icon name shown in the center */
  @Input() icon = 'blur_circular';
  /** Applies alternate surface treatments */
  @Input() variant: LoaderVariant = 'primary';
  /** Optional 0-100 progress indicator */
  @Input() progress: number | null = null;

  get clampedProgress(): number {
    if (this.progress === null || this.progress === undefined || Number.isNaN(this.progress)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(this.progress)));
  }
}
