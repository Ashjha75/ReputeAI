import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

interface FooterLink {
  label: string;
  route?: string;
  external?: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  footerSections: FooterSection[] = [
    {
      title: 'Product',
      links: [
        { label: 'Features', route: '/features' },
        { label: 'Pricing', route: '/pricing' },
        { label: 'FAQ', route: '/faq' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', route: '/about' },
        { label: 'Contact', route: '/contact' },
        { label: 'Careers', route: '/careers' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', route: '/privacy' },
        { label: 'Terms of Service', route: '/terms' },
        { label: 'Security', route: '/security' }
      ]
    }
  ];

  socialLinks = [
    { icon: 'gmail', url: 'https://gmail.com', label: 'Gmail' },
    { icon: 'twitter', url: 'https://twitter.com', label: 'Twitter' },
    { icon: 'linkedin', url: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: 'github', url: 'https://github.com', label: 'GitHub' }
  ];
}
