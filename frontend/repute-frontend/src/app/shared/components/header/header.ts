import { Component, HostListener, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, UserProfile } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { Subscription } from 'rxjs';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import IMAGES from '../../assets/images';

type DropdownSection = { label: string; sectionId: string };
type DropdownLink = { label: string; link: string };

type HeaderDropdownItem = DropdownSection | DropdownLink;
interface HeaderNavItem {
  id: string;
  label: string;
  hasDropdown: boolean;
  link?: string;
  dropdownItems: HeaderDropdownItem[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, ConfirmModalComponent, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnDestroy {
  @ViewChild(ConfirmModalComponent) confirmModal!: ConfirmModalComponent;
  @ViewChild('searchInput') searchInput!: ElementRef;
  
  // expose static images to the template
  public logo = IMAGES.logo;
  isScrolled = false;
  openDropdown: string | null = null;
  isMobileMenuOpen = false;
  isAuthenticated = false; // This should be connected to your auth service
  userDropdownOpen = false;
  currentUser: UserProfile | null = null;
  
  // Search state
  isSearchOpen = false;
  searchQuery = '';

  private authSub: Subscription | null = null;

  navItems: HeaderNavItem[] = [
    {
      id: 'features',
      label: 'Features',
      hasDropdown: true,
      dropdownItems: [
        { label: 'Spotlight', sectionId: 'feature-highlights' },
        { label: 'Highlights', sectionId: 'feature-grid' },
        { label: 'How It Works', sectionId: 'how-it-works' },
        { label: 'Features Banner', sectionId: 'cta-banner' },
        { label: 'Faq', sectionId: 'support-faq' },
      ]
    },
    {
      id: 'solutions',
      label: 'Solutions',
      hasDropdown: true,
      dropdownItems: [
        { label: 'Enterprise', link: '/solutions/enterprise' },
        { label: 'Agencies', link: '/solutions/agencies' },
        { label: 'Small Business', link: '/solutions/small-business' },
      ]
    },
    {
      id: 'resources',
      label: 'Resources',
      hasDropdown: true,
      dropdownItems: [
        { label: 'Blog', link: '/blog' },
        { label: 'Case Studies', link: '/case-studies' },
        { label: 'API Docs', link: '/docs' },
      ]
    },
    {
      id: 'pricing',
      label: 'Pricing',
      hasDropdown: false,
      link: '/pricing',
      dropdownItems: []
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

  scrollToSection(sectionId: string): void {
    if (!sectionId || typeof document === 'undefined') {
      return;
    }
    const target = document.getElementById(sectionId);
    if (target) {
      this.closeDropdown();
      if (this.isMobileMenuOpen) {
        this.toggleMobileMenu();
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  isDropdownSection(item: HeaderDropdownItem): item is DropdownSection {
    return (item as DropdownSection).sectionId !== undefined;
  }

  isDropdownLink(item: HeaderDropdownItem): item is DropdownLink {
    return (item as DropdownLink).link !== undefined;
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

    // If there is a stored profile (from previous OAuth/login) but authState
    // is false (cookie-based session), mark session authenticated so UI updates
    // correctly after a page reload.
    if (!this.isAuthenticated && this.currentUser) {
      this.isAuthenticated = true;
      try { this.authService.markAuthenticated(this.currentUser); } catch (e) { /* ignore */ }
    }
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

  /** Returns avatar URL if available (checks common fields), otherwise null */
  get avatarUrl(): string | null {
    if (!this.currentUser) return null;
    // Prefer `avatar` property, fall back to `profilePictureUrl` (backend naming)
    // and also handle nested shapes if any.
    const anyUser: any = this.currentUser as any;
    const url = this.currentUser.avatar || this.currentUser.avatarUrl || anyUser.profilePictureUrl || anyUser.profile_picture_url || null;
    if (this.avatarBroken) return null;
    if (typeof url === 'string' && url.trim().length > 0) return url;
    return null;
  }

  // Track if avatar image failed to load so we can fallback to initials
  public avatarBroken = false;

  onAvatarError(): void {
    this.avatarBroken = true;
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

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
    if (this.isSearchOpen) {
      setTimeout(() => {
        this.searchInput?.nativeElement?.focus();
      }, 100);
    } else {
      this.searchQuery = '';
    }
  }

  closeSearch() {
    this.isSearchOpen = false;
    this.searchQuery = '';
  }

  performSearch() {
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
      this.notificationService.success(`Searching for: ${this.searchQuery}`);
      // Implement actual search logic here, e.g., navigate to search results
      // this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
      this.closeSearch();
    }
  }

  ngOnDestroy(): void {
    if (this.authSub) { this.authSub.unsubscribe(); }
  }
}
