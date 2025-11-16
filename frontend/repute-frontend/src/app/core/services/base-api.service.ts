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
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('authToken');
    }
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

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.message || `Server Error: ${error.status}`;
      
      // Handle specific status codes
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          this.handleUnauthorized();
          break;
        case 403:
          errorMessage = 'Access forbidden.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        case 0:
          errorMessage = 'Network error. Please check your connection.';
          break;
      }
    }

    console.error('API Error:', errorMessage, error);

    // Show error notification
    if (showNotification) {
      this.notificationService.error(errorMessage);
    }

    return throwError(() => ({
      success: false,
      error: errorMessage,
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
