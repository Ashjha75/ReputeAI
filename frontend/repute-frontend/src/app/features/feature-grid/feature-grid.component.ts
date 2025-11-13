import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feature-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feature-grid.component.html',
  styleUrls: ['./feature-grid.component.css'],
})
export class FeatureGridComponent {
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
}
