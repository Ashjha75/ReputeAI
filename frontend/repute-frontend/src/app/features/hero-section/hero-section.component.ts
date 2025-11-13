import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-hero-section',
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css'],
})
export class HeroSectionComponent implements OnInit, AfterViewInit, OnDestroy {
  
  ngOnInit(): void {
    // Component initialized
  }

  ngAfterViewInit(): void {
    // Trigger animations on page load
    this.observeElements();
    
    // Add initial animation trigger
    setTimeout(() => {
      this.addVisibleClass();
    }, 100);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private observeElements(): void {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, options);

    // Observe all fade-in elements
    const fadeElements = document.querySelectorAll('.fade-in-left, .fade-in-right');
    fadeElements.forEach(el => observer.observe(el));
  }

  private addVisibleClass(): void {
    const fadeElements = document.querySelectorAll('.fade-in-left, .fade-in-right');
    fadeElements.forEach(el => {
      el.classList.add('visible');
    });
  }
}