import { Component, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, UserProfile } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { Subscription } from 'rxjs';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import IMAGES from '../../assets/images';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, ConfirmModalComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnDestroy {
  @ViewChild(ConfirmModalComponent) confirmModal!: ConfirmModalComponent;
  // expose static images to the template
  public logo = IMAGES.logo;
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

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private userProfileService: UserProfileService
  ) {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.currentUser = this.loadUser();
    this.authSub = this.authService.authState.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      this.currentUser = this.loadUser();
    });
  }

  private loadUser(): UserProfile | null {
    const profile = this.userProfileService.getUserProfile();
    if (profile) {
      return profile;
    }
    return this.authService.getCurrentUser();
  }

  get userInitial(): string {
    const name = this.currentUser?.firstName?.trim() || this.currentUser?.username || 'U';
    return name.charAt(0).toUpperCase();
  }

  logout() {
    // Refresh token is in httpOnly cookie, no need to pass it
    this.authService.logout().subscribe({
      next: (res: any) => {
        if (res?.success) {
          this.authService.clearAuthData();
          this.userProfileService.clearUserProfile();
          this.notificationService.success(res?.message || 'Logged out successfully');
          this.router.navigate(['/auth/login']);
        } else {
          this.notificationService.error(res?.message || 'Logout failed');
        }
      },
      error: (err) => {
        // Don't redirect automatically on error; show message so user can retry
        this.notificationService.error(err?.error?.message || err?.message || 'Logout failed');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSub) { this.authSub.unsubscribe(); }
  }
}
