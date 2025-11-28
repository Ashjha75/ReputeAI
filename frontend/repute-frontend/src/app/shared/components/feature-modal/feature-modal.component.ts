import { Component, EventEmitter, Output, Renderer2, Inject, Input, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-feature-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="modal-backdrop">
      <div class="modal-card feature-card">
        <button class="modal-close" (click)="closeModal()">&times;</button>
        <div class="feature-layout">
          <div class="feature-copy">
            <div class="feature-meta">
              <span class="feature-tag">{{ badgeLabel }}</span>
              <span class="feature-context">{{ badgeContext }}</span>
            </div>
            <h2>{{ title }}</h2>
            <p class="feature-subtitle">{{ subtitle }}</p>
            <p class="feature-description">{{ description }}</p>
            <button *ngIf="showCta" class="feature-cta" (click)="handleCta()">
              {{ ctaLabel }}
              <span class="material-icons">{{ ctaIcon }}</span>
            </button>
          </div>
          <div class="feature-media" *ngIf="mediaSrc">
            <img [src]="mediaSrc" [alt]="mediaAlt" />
            <button *ngIf="showMediaControl" class="media-control" (click)="toggleMedia()">
              <span class="material-icons">{{ mediaPlaying ? 'pause' : 'play_arrow' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./feature-modal.component.css']
})
export class FeatureModalComponent implements OnDestroy {
  visible = false;
  mediaPlaying = true;
  @Input() badgeLabel = 'Android 16';
  @Input() badgeContext = 'Hearing device support';
  @Input() title = 'Clearer calling with hearing devices.';
  @Input() subtitle = 'June 2025 | Accessibility';
  @Input() description = 'Control hearing devices from your device for a simpler experience across different hearing device brands. Or switch to your phone as input with LE Audio hearing devices for clearer calls in noisy environments.';
  @Input() showCta = true;
  @Input() ctaLabel = 'Learn more about accessibility';
  @Input() ctaIcon = 'open_in_new';
  @Output() cta = new EventEmitter<void>();
  @Input() mediaSrc: string | null = 'assets/hero-modal-demo.png';
  @Input() mediaAlt = 'Feature preview';
  @Input() showMediaControl = true;
  @Output() close = new EventEmitter<void>();
  
  constructor(
    @Inject(DOCUMENT) private document: Document, 
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  open() {
    this.visible = true;
    this.renderer.addClass(this.document.body, 'modal-open');
    this.document.body.appendChild(this.el.nativeElement);
  }

  closeModal() {
    this.visible = false;
    this.renderer.removeClass(this.document.body, 'modal-open');
    this.close.emit();
  }

  ngOnDestroy() {
    this.renderer.removeClass(this.document.body, 'modal-open');
    if (this.el.nativeElement.parentNode === this.document.body) {
      this.document.body.removeChild(this.el.nativeElement);
    }
  }

  handleCta() {
    this.cta.emit();
  }
  toggleMedia() {
    this.mediaPlaying = !this.mediaPlaying;
  }
}
