import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
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
export class FeatureHighlightCardComponent {
  readonly placeholderImage = 'https://via.placeholder.com/360x220.png?text=Feature+Preview';

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
    if (this.card.media?.src) {
      return this.card.media.src;
    }
    return this.placeholderImage;
  }

  get resolvedAccent(): FeatureHighlightAccent {
    return this.card.accent ?? this.accent;
  }
}
