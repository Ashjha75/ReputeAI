import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  isScrolled = false;
  openDropdown: string | null = null;
  isMobileMenuOpen = false;

  navItems = [
    {
      id: 'discover',
      label: 'Discover Android',
      hasDropdown: true,
      dropdownItems: [
        { label: 'Features', link: '#' },
        { label: 'What\'s New', link: '#' },
        { label: 'Android Updates', link: '#' },
      ]
    },
    {
      id: 'switch',
      label: 'Switch to Android',
      hasDropdown: true,
      dropdownItems: [
        { label: 'Make the Switch', link: '#' },
        { label: 'Transfer Your Data', link: '#' },
        { label: 'Why Android', link: '#' },
      ]
    },
    {
      id: 'devices',
      label: 'Explore devices',
      hasDropdown: true,
      dropdownItems: [
        { label: 'Phones', link: '#' },
        { label: 'Tablets', link: '#' },
        { label: 'Watches', link: '#' },
      ]
    }
  ];

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  toggleDropdown(itemId: string) {
    if (this.openDropdown === itemId) {
      this.openDropdown = null;
    } else {
      this.openDropdown = itemId;
    }
  }

  closeDropdown() {
    this.openDropdown = null;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
