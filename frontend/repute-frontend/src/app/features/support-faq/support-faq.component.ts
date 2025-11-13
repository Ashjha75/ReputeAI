import { Component, OnInit, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-support-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './support-faq.component.html',
  styleUrls: ['./support-faq.component.css'],
})
export class SupportFaqComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('faqSection', { static: false }) faqSection!: ElementRef;
  
  openAccordionId: number | null = null;
  isVisible = true;
  private observer?: IntersectionObserver;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  supportLinks = [
    { label: 'Pixel', url: '#', icon: 'external' },
    { label: 'Samsung', url: '#', icon: 'external' }
  ];

  faqs = [
    {
      id: 1,
      question: 'How do I log into my apps and services?',
      answer: 'When you switch to Android, you can sign in to your apps with your existing account credentials. Most apps will remember your login information, and you can use password managers to securely store and autofill your passwords. Android also supports biometric authentication for added security.'
    },
    {
      id: 2,
      question: 'Will I have to repurchase my apps? What about my subscriptions?',
      answer: 'Your app purchases and subscriptions are typically tied to your account (like Google Play, Apple ID, etc.) rather than your device. Many apps offer cross-platform support, so you can access your content on Android. For subscriptions, you can manage them through your account settings and continue using them on your new Android device.'
    },
    {
      id: 3,
      question: 'How do I get WhatsApp chats and data onto my new Android device?',
      answer: 'WhatsApp provides built-in tools to transfer your chat history. You can back up your chats to Google Drive on your old device, then restore them on your new Android device by logging into WhatsApp with the same phone number. Make sure both devices are connected to Wi-Fi during the transfer process.'
    },
    {
      id: 4,
      question: 'What if I do not have my old device?',
      answer: 'If you don\'t have access to your old device, you can still set up your new Android device using cloud backups. Sign in with your Google account to restore contacts, photos, and app data. For specific apps, check if they offer cloud backup options that you can restore from. You may need to manually download and set up some apps again.'
    },
    {
      id: 5,
      question: 'I have everything backed up to iCloud. Can I use iCloud with Android?',
      answer: 'While iCloud is primarily designed for Apple devices, you can access some iCloud services on Android through a web browser. For a smoother transition, consider using cross-platform services like Google Drive, Dropbox, or OneDrive. You can also use the "Switch to Android" app to help transfer data from your iPhone to your Android device.'
    },
    {
      id: 6,
      question: 'I use an eSIM, what should I do?',
      answer: 'Most modern Android devices support eSIM technology. Contact your mobile carrier to transfer your eSIM to your new Android device. They will provide you with a QR code or activation details to set up the eSIM. Make sure your new Android device is eSIM-compatible before proceeding with the transfer.'
    }
  ];

  ngOnInit(): void {
    // Component initialized
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setupScrollAnimation();
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupScrollAnimation(): void {
    if (isPlatformBrowser(this.platformId) && typeof IntersectionObserver !== 'undefined') {
      // Start invisible for animation
      this.isVisible = false;
      
      setTimeout(() => {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && !this.isVisible) {
                this.isVisible = true;
              }
            });
          },
          { threshold: 0.1, rootMargin: '0px' }
        );

        if (this.faqSection?.nativeElement) {
          this.observer.observe(this.faqSection.nativeElement);
        }
      }, 100);
    } else {
      // Fallback: show immediately
      this.isVisible = true;
    }
  }

  toggleAccordion(id: number): void {
    if (this.openAccordionId === id) {
      this.openAccordionId = null;
    } else {
      this.openAccordionId = id;
    }
  }

  isOpen(id: number): boolean {
    return this.openAccordionId === id;
  }
}
