import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-features-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './features-carousel.component.html',
  styleUrls: ['./features-carousel.component.css'],
})
export class FeaturesCarouselComponent implements OnInit, OnDestroy {
  currentSlide = 0;
  totalSlides = 3; // You can adjust this based on your needs
  autoPlayInterval: any;
  isPaused = false;

  features = [
    {
      badge: 'New',
      badgeColor: 'bg-lime-400',
      title: 'Feature One',
      heading: 'Precision crafted.',
      subheading: 'Performance ready.',
      description: 'Reach your goals with comprehensive set of tools. And get help from our AI assistant.',
      price: 'From ₹39,900.00',
      buttonText: 'Buy now'
    },
    {
      badge: 'New',
      badgeColor: 'bg-lime-400',
      title: 'Feature Two',
      heading: 'Innovation first.',
      subheading: 'Quality assured.',
      description: 'Experience cutting-edge technology with powerful features designed for your needs.',
      price: 'From ₹49,900.00',
      buttonText: 'Buy now'
    },
    {
      badge: 'New',
      badgeColor: 'bg-lime-400',
      title: 'Feature Three',
      heading: 'Design excellence.',
      subheading: 'User focused.',
      description: 'Beautiful design meets functionality with intuitive controls and seamless experience.',
      price: 'From ₹59,900.00',
      buttonText: 'Buy now'
    }
  ];

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  startAutoPlay(): void {
    this.autoPlayInterval = setInterval(() => {
      if (!this.isPaused) {
        this.nextSlide();
      }
    }, 6000);
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  pauseAutoPlay(): void {
    this.isPaused = true;
  }

  resumeAutoPlay(): void {
    this.isPaused = false;
  }
}
