import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected baseUrl: string = environment.apiUrl || 'http://localhost:8080/api';
  private defaultHeaders: HttpHeaders;
  private notificationService = inject(NotificationService);

  constructor(protected http: HttpClient) {
    this.defaultHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  /**
   * Get authorization headers with token
   */
  protected getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token) {
      return this.defaultHeaders.set('Authorization', `Bearer ${token}`);
    }
    return this.defaultHeaders;
  }

  /**
   * Get token from storage
   */
  protected getToken(): string | null {
    // No longer used, tokens are in httpOnly cookies
    return null;
  }

  /**
   * Generic GET request
   */
  protected get<T>(
    endpoint: string,
    params?: HttpParams | { [param: string]: string | string[] },
    requireAuth: boolean = false,
    showNotification: boolean = false
  ): Observable<ApiResponse<T>> {
    const headers = requireAuth ? this.getAuthHeaders() : this.defaultHeaders;

    return this.http.get<T>(`${this.baseUrl}${endpoint}`, {
      headers,
      params
    }).pipe(
      map(response => this.handleSuccess<T>(response, showNotification)),
      retry(2), // Retry failed requests twice
      catchError(error => this.handleError(error, showNotification))
    );
  }

  /**
   * Generic POST request
   */
  protected post<T>(
    endpoint: string,
    body: any,
    requireAuth: boolean = false,
    showNotification: boolean = true
  ): Observable<ApiResponse<T>> {
    const headers = requireAuth ? this.getAuthHeaders() : this.defaultHeaders;

    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, {
      headers
    }).pipe(
      map(response => this.handleSuccess<T>(response, showNotification)),
      catchError(error => this.handleError(error, showNotification))
    );
  }

  /**
   * Generic PUT request
   */
  protected put<T>(
    endpoint: string,
    body: any,
    requireAuth: boolean = true,
    showNotification: boolean = true
  ): Observable<ApiResponse<T>> {
    const headers = requireAuth ? this.getAuthHeaders() : this.defaultHeaders;

    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, {
      headers
    }).pipe(
      map(response => this.handleSuccess<T>(response, showNotification)),
      catchError(error => this.handleError(error, showNotification))
    );
  }

  /**
   * Generic PATCH request
   */
  protected patch<T>(
    endpoint: string,
    body: any,
    requireAuth: boolean = true,
    showNotification: boolean = true
  ): Observable<ApiResponse<T>> {
    const headers = requireAuth ? this.getAuthHeaders() : this.defaultHeaders;

    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body, {
      headers
    }).pipe(
      map(response => this.handleSuccess<T>(response, showNotification)),
      catchError(error => this.handleError(error, showNotification))
    );
  }

  /**
   * Generic DELETE request
   */
  protected delete<T>(
    endpoint: string,
    requireAuth: boolean = true,
    showNotification: boolean = true
  ): Observable<ApiResponse<T>> {
    const headers = requireAuth ? this.getAuthHeaders() : this.defaultHeaders;

    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, {
      headers
    }).pipe(
      map(response => this.handleSuccess<T>(response, showNotification)),
      catchError(error => this.handleError(error, showNotification))
    );
  }

  /**
   * Handle successful response
   */
  private handleSuccess<T>(response: any, showNotification: boolean = false): ApiResponse<T> {
    // Backend returns { success: true, message: "..." } or { Message: "..." }
    const message = response?.message || response?.Message || 'Operation successful';

    if (showNotification) {
      this.notificationService.success(message);
    }
    return {
      success: true,
      data: response,
      message: message,
      statusCode: 200
    };
  }

  /**
   * Handle error response
   */
  private handleError(error: HttpErrorResponse, showNotification: boolean = true): Observable<never> {
    let errorMessage = 'An error occurred';
    let statusCode = error.status || 500;
    let backendError = error.error;

    if (error.status === 429) {
      // Rate limit: API only sends status code, no body
      errorMessage = 'You are being rate limited. Please try again later.';
      backendError = { message: errorMessage, success: false };
    } else if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
      backendError = { message: errorMessage };
    } else if (typeof error.error === 'string') {
      // If backend sent a plain string
      backendError = { message: error.error };
      errorMessage = error.error;
    } else if (typeof error.error === 'object' && error.error !== null) {
      // If backend sent an object, prefer its message
      errorMessage = error.error.message || error.message || errorMessage;
    } else {
      // Fallback for unknown error shape
      backendError = { message: error.message || errorMessage };
      errorMessage = error.message || errorMessage;
    }

    // Always show a clear error message for 429 and unknown errors
    if (showNotification) {
      if (statusCode === 429) {
        this.notificationService.error('You are being rate limited. Please try again later.');
      } else if (errorMessage && errorMessage !== 'An error occurred') {
        this.notificationService.error(errorMessage);
      } else {
        this.notificationService.error('Request failed. Please try again.');
      }
    }

    // Always return the backend error object, plus statusCode and success
    return throwError(() => ({
      ...backendError,
      success: false,
      statusCode: statusCode
    }));
  }

  /**
   * Handle unauthorized access
   */
  private handleUnauthorized(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Redirect to login will be handled by auth guard
    }
  }
}
