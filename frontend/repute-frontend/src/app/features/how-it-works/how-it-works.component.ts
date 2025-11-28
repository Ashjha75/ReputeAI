import { Component } from '@angular/core';
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
  styleUrls: ['./how-it-works.component.css']
})
export class HowItWorksComponent {
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
}
