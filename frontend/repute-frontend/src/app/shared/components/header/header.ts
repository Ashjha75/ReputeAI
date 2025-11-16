import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, UserProfile } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnDestroy {
  isScrolled = false;
  openDropdown: string | null = null;
  isMobileMenuOpen = false;
  isAuthenticated = false; // This should be connected to your auth service
  userDropdownOpen = false;
  currentUser: UserProfile | null = null;
  private authSub: Subscription | null = null;

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

  toggleUserDropdown() {
    this.userDropdownOpen = !this.userDropdownOpen;
  }

  closeUserDropdown() {
    this.userDropdownOpen = false;
  }

  constructor(private router: Router, private authService: AuthService, private notificationService: NotificationService) {
    // initialize auth state and subscribe to changes
    this.isAuthenticated = this.authService.isAuthenticated();
    this.currentUser = this.authService.getCurrentUser();
    this.authSub = this.authService.authState.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      this.currentUser = this.authService.getCurrentUser();
    });
  }

  logout() {
    // Call backend logout then clear local data and redirect
    this.authService.logout().subscribe({
      next: () => {
        this.authService.clearAuthData();
        this.notificationService.success('Logged out successfully');
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        // Even if API logout fails, clear local data
        this.authService.clearAuthData();
        this.notificationService.info('You have been logged out');
        this.router.navigate(['/auth/login']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSub) { this.authSub.unsubscribe(); }
  }
}
