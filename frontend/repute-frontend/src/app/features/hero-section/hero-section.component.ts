import { Component, OnInit, AfterViewInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { FeatureModalComponent } from '../../shared/components/feature-modal/feature-modal.component';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [ConfirmModalComponent, FeatureModalComponent],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css'],
})
export class HeroSectionComponent implements OnInit, AfterViewInit, OnDestroy {
  
  private observer?: IntersectionObserver;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  
  ngOnInit(): void {
    // Component initialized
  }

  ngAfterViewInit(): void {
    // Only run in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Trigger animations on page load
      this.observeElements();
      
      // Add initial animation trigger
      setTimeout(() => {
        this.addVisibleClass();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    // Cleanup observer
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private observeElements(): void {
    // Check if IntersectionObserver is available
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: just add visible class immediately
      this.addVisibleClass();
      return;
    }

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, options);

    // Observe all fade-in elements
    const fadeElements = document.querySelectorAll('.fade-in-left, .fade-in-right');
    fadeElements.forEach(el => this.observer!.observe(el));
  }

  private addVisibleClass(): void {
    const fadeElements = document.querySelectorAll('.fade-in-left, .fade-in-right');
    fadeElements.forEach(el => {
      el.classList.add('visible');
    });
  }

  showFeatureModal = false;
  showConfirmModal = false;

  openFeatureModal() {
    this.showFeatureModal = true;
  }
  closeFeatureModal() {
    this.showFeatureModal = false;
  }

  openConfirmModal() {
    this.showConfirmModal = true;
  }
  closeConfirmModal() {
    this.showConfirmModal = false;
  }
  confirmAction() {
    // Handle confirmation logic here
    this.showConfirmModal = false;
  }
}