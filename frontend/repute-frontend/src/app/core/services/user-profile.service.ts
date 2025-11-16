import { Injectable } from '@angular/core';
import { UserProfile } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly STORAGE_KEY = 'userProfile';

  setUserProfile(profile: UserProfile): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
    }
  }

  getUserProfile(): UserProfile | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const str = localStorage.getItem(this.STORAGE_KEY);
      return str ? JSON.parse(str) : null;
    }
    return null;
  }

  clearUserProfile(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
