import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-feature-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feature-grid.component.html',
  styleUrls: ['./feature-grid.component.css'],
})
export class FeatureGridComponent implements OnInit, OnDestroy {
  @ViewChild('gridSection', { static: true }) gridSection!: ElementRef;
  
  isVisible = false;
  private observer?: IntersectionObserver;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  features = [
    {
      id: 1,
      title: 'YouTube Create and other ways to elevate your content.',
      buttonText: 'See the latest',
      imagePosition: 'left',
      imageAlt: 'Content creation'
    },
    {
      id: 2,
      title: 'Pair and cast to your favourite devices.',
      buttonText: 'See how devices connect',
      imagePosition: 'right',
      imageAlt: 'Device pairing'
    },
    {
      id: 3,
      title: 'More spam and phishing protection.',
      buttonText: 'Learn about security',
      imagePosition: 'left',
      imageAlt: 'Security features'
    }
  ];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setupScrollAnimation();
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupScrollAnimation(): void {
    if (isPlatformBrowser(this.platformId) && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.isVisible = true;
            }
          });
        },
        { threshold: 0.2 }
      );

      if (this.gridSection) {
        this.observer.observe(this.gridSection.nativeElement);
      }
    } else {
      this.isVisible = true;
    }
  }
}
