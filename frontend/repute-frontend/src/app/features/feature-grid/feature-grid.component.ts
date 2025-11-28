import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import IMAGES from '../../shared/assets/images';
import { FeatureModalComponent } from '../../shared/components/feature-modal/feature-modal.component';

interface FeatureGridItem {
  id: number;
  title: string;
  description: string;
  buttonText: string;
  imagePosition: 'left' | 'right';
  imageAlt: string;
  imageSrc: string;
}

@Component({
  selector: 'app-feature-grid',
  standalone: true,
  templateUrl: './feature-grid.component.html',
  styleUrls: ['./feature-grid.component.css'],
  imports: [CommonModule, FeatureModalComponent]
})
export class FeatureGridComponent implements AfterViewInit, OnDestroy {
  @ViewChild(FeatureModalComponent) modal!: FeatureModalComponent;
  features = [
    {
      id: 1,
      title: 'Real-time Reputation Analytics',
      description: 'Monitor your brand health across millions of sources instantly. Our AI filters noise to give you actionable insights.',
      buttonText: 'Explore Analytics',
      imagePosition: 'left',
      imageAlt: 'Analytics Dashboard',
      imageSrc: IMAGES.feature1
    },
    {
      id: 2,
      title: 'AI-Driven Sentiment Analysis',
      description: 'Go beyond simple keywords. Our NLP models understand context, sarcasm, and emotion to gauge true customer sentiment.',
      buttonText: 'See How It Works',
      imagePosition: 'right',
      imageAlt: 'Sentiment Analysis',
      imageSrc: IMAGES.feature2
    },
    {
      id: 3,
      title: 'Automated Crisis Prevention',
      description: 'Detect negative trends before they go viral. Set up smart alerts and automated workflows to protect your brand image.',
      buttonText: 'View Security Features',
      imagePosition: 'left',
      imageAlt: 'Crisis Prevention',
      imageSrc: IMAGES.feature3
    }
  ];

  @ViewChildren('featureItem') featureItems!: QueryList<ElementRef>;
  modalContent = {
    badgeLabel: 'ReputeAI Feature Spotlight',
    badgeContext: 'Product Highlights',
    title: '',
    subtitle: '',
    description: '',
    mediaSrc: IMAGES.feature1,
    mediaAlt: 'Feature preview'
  };
  private observer: IntersectionObserver | undefined;
  openFeatureModal(feature: FeatureGridItem) {
    this.modalContent = {
      ...this.modalContent,
      title: feature.title,
      subtitle: feature.buttonText,
      description: `${feature.description} ReputeAI extends this capability with automated playbooks tailored to teams, audit-ready logs, and mobile alerts so every stakeholder can stay on top of shifts in seconds.`,
      mediaSrc: feature.imageSrc,
      mediaAlt: feature.imageAlt
    };
    this.modal?.open();
  }

  ngAfterViewInit() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          // Toggle class based on visibility for continuous scroll effect
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          } else {
            entry.target.classList.remove('in-view');
          }
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

      this.featureItems.changes.subscribe(() => {
        this.observeItems();
      });
      
      this.observeItems();
    }
  }

  private observeItems() {
    this.featureItems.forEach(item => {
      this.observer?.observe(item.nativeElement);
    });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
