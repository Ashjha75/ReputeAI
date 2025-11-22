import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // No need to add Authorization header, tokens are in httpOnly cookies

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !request.url.includes('/auth/login')) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Try to refresh token (refresh token is in httpOnly cookie)
      return this.authService.refreshToken().pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;
          if (response?.success) {
            this.refreshTokenSubject.next(response);
            // Retry the original request
            return next.handle(request);
          }
          // Refresh failed, redirect to login
          this.authService.clearAuthData();
          this.notificationService.error('Session expired. Please sign in again.');
          this.router.navigate(['/auth/login']);
          return throwError(() => new Error('Session expired'));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.authService.clearAuthData();
          this.notificationService.error('Session expired. Please sign in again.');
          this.router.navigate(['/auth/login']);
          return throwError(() => err);
        })
      );
    } else {
      // Wait for refresh to complete, then retry request
      return this.refreshTokenSubject.pipe(
        filter(result => result !== null),
        take(1),
        switchMap(() => next.handle(request))
      );
    }
  }
}
