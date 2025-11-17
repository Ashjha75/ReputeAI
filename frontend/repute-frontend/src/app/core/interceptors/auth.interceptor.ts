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
        if (error.status === 401) {
          // On 401, clear auth and redirect to login
          this.authService.clearAuthData();
          this.notificationService.error('Session expired. Please sign in again.');
          this.router.navigate(['/auth/login']);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Refresh logic removed: tokens are in httpOnly cookies, so just clear auth and redirect
    this.authService.clearAuthData();
    this.notificationService.error('Session expired. Please sign in again.');
    this.router.navigate(['/auth/login']);
    return throwError(() => new Error('Session expired. Please sign in again.'));
  }

  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    // No longer needed
    return request;
  }
}
