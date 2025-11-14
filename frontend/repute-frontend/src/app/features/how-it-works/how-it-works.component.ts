import { Component, ElementRef, AfterViewInit, QueryList, ViewChildren, NgZone } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.css'],
  animations: [
    trigger('scrollFadeInUp', [
      state('hidden', style({ opacity: 0, transform: 'translateY(40px)' })),
      state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('hidden => visible', [
        animate('0.7s cubic-bezier(.4,0,.2,1)')
      ])
    ])
  ]
})
export class HowItWorksComponent implements AfterViewInit {
  steps: Step[] = [
    {
      number: 1,
      title: 'Create Your Account',
      description: 'Sign up in seconds with your email or social accounts. Get started with our AI-powered reputation management platform.',
      icon: 'person_add'
    },
    {
      number: 2,
      title: 'Connect Your Platforms',
      description: 'Link your social media accounts and online profiles. We support all major platforms for comprehensive monitoring.',
      icon: 'link'
    },
    {
      number: 3,
      title: 'AI Analysis Begins',
      description: 'Our advanced AI scans and analyzes your online presence, identifying key reputation metrics and insights.',
      icon: 'psychology'
    },
    {
      number: 4,
      title: 'Get Actionable Insights',
      description: 'Receive real-time recommendations and reports. Take control of your digital reputation with data-driven decisions.',
      icon: 'insights'
    }
  ];
  // Track which step is visible
  stepStates: string[] = [];

  @ViewChildren('stepCard', { read: ElementRef }) stepCards!: QueryList<ElementRef>;


  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {
    this.stepStates = Array(this.steps.length).fill('hidden');
  }

  ngAfterViewInit() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const idx = Number((entry.target as HTMLElement).getAttribute('data-step-index'));
          if (entry.isIntersecting && this.stepStates[idx] !== 'visible') {
            setTimeout(() => {
              this.ngZone.run(() => {
                this.stepStates[idx] = 'visible';
                this.cdr.detectChanges();
              });
            });
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.18 });
      this.stepCards.forEach((el, idx) => {
        el.nativeElement.setAttribute('data-step-index', idx);
        observer.observe(el.nativeElement);
      });
    } else {
      // Fallback: show all if IntersectionObserver not available
      setTimeout(() => {
        this.stepStates = this.stepStates.map(() => 'visible');
        this.cdr.detectChanges();
      });
    }
  }
}
