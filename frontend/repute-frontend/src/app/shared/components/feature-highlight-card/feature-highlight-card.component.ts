import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ElementRef, AfterViewInit, AfterViewChecked, OnDestroy, Renderer2, HostBinding, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FeatureModalComponent } from '../feature-modal/feature-modal.component';

export type FeatureHighlightAccent = 'aqua' | 'emerald' | 'violet' | 'amber' | 'neutral';

export interface FeatureCardAction {
  label: string;
  icon?: string;
  url?: string;
  target?: '_blank' | '_self';
  variant?: 'primary' | 'outline';
}

export interface FeatureCardMedia {
  src?: string;
  alt?: string;
  poster?: string;
  showPlayButton?: boolean;
}

export interface FeatureHighlightCard {
  badge?: string;
  context?: string;
  title: string;
  description: string;
  footnote?: string;
  chips?: string[];
  actions?: FeatureCardAction[];
  media?: FeatureCardMedia;
  accent?: FeatureHighlightAccent;
}

@Component({
  selector: 'app-feature-highlight-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, FeatureModalComponent],
  templateUrl: './feature-highlight-card.component.html',
  styleUrl: './feature-highlight-card.component.css'
})
export class FeatureHighlightCardComponent implements AfterViewInit, AfterViewChecked, OnDestroy {

  @ViewChild(FeatureModalComponent) modal!: FeatureModalComponent;

  @Input() card: FeatureHighlightCard = {
    badge: 'Feature badge',
    context: 'Context label',
    title: 'Feature title',
    description: 'Describe the feature highlight in one or two concise sentences so teams instantly understand the value.',
    actions: [{ label: 'Try now', icon: 'arrow_forward' }],
    media: { showPlayButton: true }
  };

  @Input() accent: FeatureHighlightAccent = 'neutral';

  @Output() action = new EventEmitter<FeatureCardAction>();

  handleAction(action?: FeatureCardAction): void {
    if (!action) {
      return;
    }

    // Open the modal to show more details
    if (this.modal) {
      this.modal.open();
    }

    this.action.emit(action);

    // if (action.url && typeof window !== 'undefined') {
    //   window.open(action.url, action.target ?? '_blank');
    // }
  }

  get mediaSrc(): string | null {
    return this.card.media?.src ?? null;
  }

  get mediaPoster(): string | null {
    return this.card.media?.poster ?? null;
  }

  get mediaIsVideo(): boolean {
    return !!this.mediaSrc && this.mediaSrc.toLowerCase().endsWith('.mp4');
  }

  get resolvedAccent(): FeatureHighlightAccent {
    return this.card.accent ?? this.accent;
  }

  private io?: IntersectionObserver;
  private lastMediaSrc: string | null = null;

  @HostBinding('class.in-view') hostInView = false;

  @ViewChild('featureHighlightVideo') featureHighlightVideo?: ElementRef<HTMLVideoElement>;

  constructor(private host: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || !this.host?.nativeElement) return;

    // Simple observer to trigger the CSS reveal animation
    this.io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Toggle visibility every time it enters/leaves viewport
        this.hostInView = entry.isIntersecting;
      });
    }, { threshold: 0.15 });

    this.io.observe(this.host.nativeElement);
  }

  ngAfterViewChecked(): void {
    this.reloadPreviewVideo();
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
  }

  private reloadPreviewVideo(): void {
    if (!this.mediaIsVideo) {
      this.lastMediaSrc = null;
      return;
    }
    const currentSrc = this.mediaSrc;
    if (!currentSrc || this.lastMediaSrc === currentSrc) {
      return;
    }
    this.lastMediaSrc = currentSrc;
    const video = this.featureHighlightVideo?.nativeElement;
    if (!video) {
      return;
    }
    video.src = currentSrc;
    if (typeof video.load === 'function') {
      video.load();
    }
    if (typeof video.play === 'function') {
      video.play().catch(() => { /* ignore autoplay blocks */ });
    }
  }
}
