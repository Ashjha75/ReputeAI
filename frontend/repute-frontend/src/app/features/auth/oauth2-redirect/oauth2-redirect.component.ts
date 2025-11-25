import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

/**
 * OAuth2 Redirect Handler
 *
 * This component is a small landing page that the backend redirects the
 * OAuth provider to after sign-in. It posts a message to the opener window
 * (if opened in a popup) with the result and then closes itself. If there
 * is no opener, it will redirect to the app root.
 */
@Component({
  selector: 'app-oauth2-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h2 class="text-lg font-semibold mb-2">Signing you in…</h2>
        <p class="text-sm text-gray-600">Completing authentication. You can close this window shortly.</p>
      </div>
    </div>
  `
})
export default class OAuth2RedirectComponent implements OnInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    // Only run DOM / window logic in browser
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      // Parse query params and hash (some providers return tokens in hash)
      const search = window.location.search ? window.location.search.substring(1) : '';
      const hash = window.location.hash ? window.location.hash.substring(1) : '';
      const params = new URLSearchParams(search);
      const result: any = {};
      params.forEach((v, k) => (result[k] = v));
      if (hash) {
        const h = new URLSearchParams(hash);
        h.forEach((v, k) => (result[k] = v));
      }

      // Notify opener if present. Wait a short moment to allow the browser
      // to persist any cookies set by the backend response that performed
      // the redirect to this page. This helps the opener detect the new
      // authentication cookie when it performs an XHR immediately after
      // receiving the postMessage.
      if (window.opener && !window.opener.closed) {
        const notify = () => {
          try {
            window.opener.postMessage({ type: 'oauth2:complete', payload: result, success: true }, '*');
          } catch (e) {
            try {
              window.opener.postMessage({ type: 'oauth2:complete', payload: result, success: true }, '*');
            } catch (err) {
              // ignore
            }
          }

          // Close after a small delay to allow message processing
          setTimeout(() => {
            try { window.close(); } catch (e) { /* ignore */ }
          }, 700);
        };

        // Use a short delay (500ms) to improve reliability across browsers
        // — adjust if necessary in environments with slower cookie persistence.
        setTimeout(notify, 500);
        return;
      }

      // If not opened as a popup, redirect to app root (or show a message)
      setTimeout(() => {
        try {
          window.location.href = window.location.origin || '/';
        } catch (e) {
          // ignore
        }
      }, 900);
    } catch (err) {
      console.error('OAuth2 redirect handler error', err);
      // Fallback: close or redirect
      try {
        window.close();
      } catch (e) {
        try {
          window.location.href = '/';
        } catch (err) {
          /* ignore */
        }
      }
    }
  }
}
