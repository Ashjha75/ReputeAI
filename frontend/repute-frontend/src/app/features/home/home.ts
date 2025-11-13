import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { MatCardModule } from '@angular/material/card';
import { HeroSectionComponent } from '../hero-section/hero-section.component';
import { FeaturesCarouselComponent } from '../features-carousel/features-carousel.component';
import { FeatureGridComponent } from '../feature-grid/feature-grid.component';
import { SupportFaqComponent } from '../support-faq/support-faq.component';


@Component({
    selector: 'app-home',
    imports: [
      CommonModule,
      MatButtonModule,
      MatIconModule,
      MatCardModule,
      HeroSectionComponent,
      FeaturesCarouselComponent,
      FeatureGridComponent,
      SupportFaqComponent
    ],
    templateUrl: './home.html',
    styleUrl: './home.css'
})
export class Home {
  features = [
    {
      icon: 'shield',
      title: 'AI-Powered Analysis',
      description: 'Advanced AI scans and analyzes your digital content across multiple platforms in minutes',
      color: 'text-blue-600'
    },
    {
      icon: 'speed',
      title: 'Real-Time Monitoring',
      description: 'Continuous monitoring detects reputation risks before they become problems',
      color: 'text-emerald-600'
    },
    {
      icon: 'analytics',
      title: 'Risk Scoring',
      description: 'Intelligent risk assessment provides clear, actionable insights with 0-100 scoring',
      color: 'text-violet-600'
    },
    {
      icon: 'public',
      title: 'Multi-Platform Coverage',
      description: 'Scan Twitter, LinkedIn, GitHub, Reddit, and Stack Overflow from one dashboard',
      color: 'text-amber-600'
    },
    {
      icon: 'verified_user',
      title: 'Privacy First',
      description: 'Your data stays secure with enterprise-grade encryption and privacy controls',
      color: 'text-red-600'
    },
    {
      icon: 'trending_up',
      title: 'Actionable Reports',
      description: 'Clear, comprehensive reports with recommended actions and trend analysis',
      color: 'text-indigo-600'
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
}
