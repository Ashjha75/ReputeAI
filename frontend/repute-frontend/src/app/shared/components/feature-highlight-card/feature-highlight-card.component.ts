import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ElementRef, AfterViewInit, OnDestroy, Renderer2, HostBinding } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

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
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './feature-highlight-card.component.html',
  styleUrl: './feature-highlight-card.component.css'
})
export class FeatureHighlightCardComponent implements AfterViewInit, OnDestroy {

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

    this.action.emit(action);

    if (action.url && typeof window !== 'undefined') {
      window.open(action.url, action.target ?? '_blank');
    }
  }

  get mediaSrc(): string {
    return this.card.media?.src ?? '';
  }

  get resolvedAccent(): FeatureHighlightAccent {
    return this.card.accent ?? this.accent;
  }

  private io?: IntersectionObserver;
  private rafId = 0;

  @HostBinding('class.in-view') hostInView = false;

  constructor(private host: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || !this.host?.nativeElement) return;

    this.io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const visible = entry.isIntersecting && entry.intersectionRatio > 0;
        this.hostInView = visible;
        if (visible) {
          this.startParallaxLoop();
        } else {
          this.stopParallaxLoop();
          // reset transform when offscreen
          const wrap = this.host.nativeElement.querySelector('.parallax-wrap') as HTMLElement | null;
          if (wrap) {
            this.renderer.setStyle(wrap, 'transform', 'translate3d(0,0,0)');
          }
        }
      });
    }, { threshold: [0, 0.12, 0.4, 0.7] });

    this.io.observe(this.host.nativeElement);
  }

  private startParallaxLoop(): void {
    if (this.rafId) return; // already running

    const frame = () => {
      const wrap = this.host.nativeElement.querySelector('.parallax-wrap') as HTMLElement | null;
      if (wrap) {
        const rect = this.host.nativeElement.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const cardCenter = rect.top + rect.height / 2;
        const distanceFromCenter = cardCenter - (vh / 2);
        const max = (vh / 2 + rect.height / 2);
        const ratio = Math.max(-1, Math.min(1, distanceFromCenter / max));
        const depth = 12; // px translate range
        const y = -ratio * depth;
        this.renderer.setStyle(wrap, 'transform', `translate3d(0, ${y}px, 0)`);
      }
      this.rafId = requestAnimationFrame(frame);
    };

    this.rafId = requestAnimationFrame(frame);
  }

  private stopParallaxLoop(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
    this.stopParallaxLoop();
  }
}
