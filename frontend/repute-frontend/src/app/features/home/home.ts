import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { FeaturesCarouselComponent } from '../features-carousel/features-carousel.component';
import { FeatureGridComponent } from '../feature-grid/feature-grid.component';
import { SupportFaqComponent } from '../support-faq/support-faq.component';
import { HowItWorksComponent } from '../how-it-works/how-it-works.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { isPlatformBrowser } from '@angular/common';

import {
  FeatureCardAction,
  FeatureHighlightCard,
  FeatureHighlightCardComponent
} from '../../shared/components/feature-highlight-card/feature-highlight-card.component';
import { CtaBannerComponent } from '../../shared/components/cta-banner/cta-banner.component';
import { PixelDropPromoComponent } from '../../shared/components/pixel-drop-promo/pixel-drop-promo.component';
import { assetPath } from '../../shared/assets/images';

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
    FeatureHighlightCardComponent,
    CtaBannerComponent,
    PixelDropPromoComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  // Update copy, media, and actions here to reshuffle spotlight cards without editing the template.
  readonly featureHighlights: FeatureHighlightCard[] = [
    {
      badge: 'Real-Time Alerts',
      context: 'AI Risk Monitoring',
      title: 'Get Instant Context on Digital Risks.',
      description: 'Receive immediate notifications when our AI flags high-risk content. Each alert includes an AI-generated summary explaining the "why," delivered directly via Slack, Teams, or Email.',
      chips: ['Slack', 'Teams', 'Email'],
      actions: [
        { label: 'Customize Your Alerts', icon: 'arrow_forward', url: '#', variant: 'primary' }
      ],
      media: {
        alt: 'Realtime notification mockup',
        poster: assetPath('banner-notification.png'),
        showPlayButton: true,
        src: assetPath('banner-bg-1.mp4')
      },
      accent: 'aqua' // Google Blue
    },
    {
      badge: 'Insights Studio',
      context: 'Reporting & Analytics',
      title: 'AI-Generated Reports on Your Digital Health.',
      description: 'Go beyond raw data. The Insights Studio automatically generates visual reports on your reputation score, risk trends, and content categories. Export as a PDF or share a live dashboard.',
      chips: ['PDF Export', 'Trend Analysis', 'AI Summaries'],
      actions: [
        { label: 'View Sample Report', icon: 'arrow_forward', url: '#', variant: 'primary' }
      ],
      media: {
        alt: 'Reporting storyboard preview',
        poster: assetPath('banner-report.png'),
        src: assetPath('banner-bg-2.mp4')
      },
      accent: 'violet' // A distinct secondary color
    },
    {
      badge: 'Multi-Platform Scan',
      context: 'Platform Integration',
      title: 'Connect & Monitor Your Entire Digital Footprint.',
      description: 'Securely connect Twitter, LinkedIn, GitHub, and more. ReputeAI creates a unified, searchable view of your historical and real-time content, ensuring you have no blind spots.',
      chips: ['Social Media', 'Professional Networks', 'Developer Forums'],
      actions: [
        { label: 'Supported Platforms', icon: 'open_in_new', url: '#', variant: 'outline' }
      ],
      media: {
        showPlayButton: true,
        poster: assetPath('banner-map.png'),
        src: assetPath('banner-bg-3.mp4')
      },
      accent: 'emerald' // Android Green accent
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

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    try {
      if (isPlatformBrowser(this.platformId)) {
        // Any browser-only logic can go here
      }
    } catch (err) {
      console.error('SSR/Prerender error in Home:', err);
    }
  }

  handleCardAction(action?: FeatureCardAction): void {
    if (!action) {
      return;
    }
    // Hook for analytics or custom routing when consuming the reusable card component.
  }
}
