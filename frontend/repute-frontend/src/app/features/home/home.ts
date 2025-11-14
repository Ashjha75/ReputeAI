import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { FeaturesCarouselComponent } from '../features-carousel/features-carousel.component';
import { FeatureGridComponent } from '../feature-grid/feature-grid.component';
import { SupportFaqComponent } from '../support-faq/support-faq.component';
import { HowItWorksComponent } from '../how-it-works/how-it-works.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import {
  FeatureCardAction,
  FeatureHighlightCard,
  FeatureHighlightCardComponent
} from '../../shared/components/feature-highlight-card/feature-highlight-card.component';

@Component({
    selector: 'app-home',
    imports: [
      CommonModule,
      HeroSectionComponent,
      FeatureGridComponent,
      SupportFaqComponent,
      FeaturesCarouselComponent,
      HowItWorksComponent,
      FooterComponent,
      FeatureHighlightCardComponent
    ],
    templateUrl: './home.html',
    styleUrl: './home.css'
})
export class Home {
  // Update copy, media, and actions here to reshuffle spotlight cards without editing the template.
  readonly featureHighlights: FeatureHighlightCard[] = [
    {
      badge: 'Realtime Alerts',
      context: 'Signals & Messaging',
      title: 'Give reputation teams the context they need instantly.',
      description: 'Custom alert recipes surface the right incidents for each stakeholder, complete with AI-authored summaries that explain the "why" at a glance',
      footnote: '1',
      chips: ['Slack', 'Teams', 'Email'],
      actions: [
        { label: 'Launch playbook', icon: 'arrow_forward', url: 'https://repute.ai/playbooks', variant: 'primary' }
      ],
      media: {
        alt: 'Realtime notification mockup',
        showPlayButton: true
      },
      accent: 'aqua'
    },
    {
      badge: 'Insights Studio',
      context: 'Reporting & Analytics',
      title: 'Remix your signals with AI-generated storyboards.',
      description: 'Create tailored update decks in seconds by blending KPI trends, notable mentions, and recommended actions. Share as slides or interactive dashboards',
      footnote: '2',
      chips: ['Deck export', 'AI recap'],
      actions: [
        { label: 'Try now', icon: 'arrow_forward', url: 'https://repute.ai/insights-studio', variant: 'primary' }
      ],
      media: {
        alt: 'Reporting storyboard preview'
      },
      accent: 'violet'
    },
    {
      badge: 'Coverage Map',
      context: 'Discovery',
      title: 'Map every conversation that can impact trust.',
      description: 'Track narratives across press, social, forums, and developer channels with a unified knowledge graph that updates hourly',
      chips: ['News', 'Social', 'Communities'],
      actions: [
        { label: 'See live demo', icon: 'open_in_new', url: 'https://repute.ai/coverage-map-demo', variant: 'outline' }
      ],
      media: {
        showPlayButton: true
      },
      accent: 'emerald'
    }
  ];

  benefits = [
    { stat: '95%', label: 'Time Saved' },
    { stat: '<1hr', label: 'Alert Time' },
    { stat: '5+', label: 'Platforms' },
    { stat: '90%+', label: 'Accuracy' }
  ];

  riskLevels = [
    { level: 'Low Risk', range: '0-49', color: 'bg-emerald-100 text-emerald-800', icon: 'check_circle' },
    { level: 'Medium Risk', range: '50-69', color: 'bg-amber-100 text-amber-800', icon: 'warning' },
    { level: 'High Risk', range: '70-89', color: 'bg-orange-100 text-orange-800', icon: 'error' },
    { level: 'Critical Risk', range: '90-100', color: 'bg-red-100 text-red-800', icon: 'dangerous' }
  ];

  handleCardAction(action?: FeatureCardAction): void {
    if (!action) {
      return;
    }

    if (action.url && typeof window !== 'undefined') {
      window.open(action.url, action.target ?? '_blank');
    }
  }
}
