# API Integration Architecture Documentation

## Overview
This architecture provides a robust, scalable API integration system with proper error handling, loading states, and authentication.

## Structure

### 1. Base API Service (`base-api.service.ts`)
**Purpose**: Centralized HTTP request handling with error management

**Features**:
- Generic HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Automatic token injection
- Error handling with retry logic
- Response standardization
- 401 unauthorized handling

**Usage**:
```typescript
// Extend in your custom services
export class MyService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getData(): Observable<any> {
    return this.get<DataType>('/endpoint', undefined, true);
  }
}
```

### 2. Auth Service (`auth.service.ts`)
**Purpose**: Handle all authentication operations

**Features**:
- Login/Signup
- Token management
- User profile
- Password reset
- Email verification
- Authentication state checking

**Key Methods**:
- `login(credentials)`: Authenticate user
- `signup(userData)`: Register new user
- `isAuthenticated()`: Check auth status
- `getCurrentUser()`: Get current user info
- `clearAuthData()`: Logout

### 3. Route Guards (`auth.guard.ts`)
**Purpose**: Protect routes based on authentication and roles

**Guards Available**:
- `authGuard`: Requires authentication
- `guestGuard`: Only for non-authenticated users
- `roleGuard(roles)`: Requires specific roles

**Usage in Routes**:
```typescript
{
  path: 'dashboard',
  canActivate: [authGuard],
  component: DashboardComponent
}

{
  path: 'admin',
  canActivate: [roleGuard(['admin'])],
  component: AdminComponent
}
```

### 4. HTTP Interceptors

#### Auth Interceptor (`auth.interceptor.ts`)
- Automatically adds Bearer token to requests
- Handles 401 errors globally
- Redirects to login on unauthorized

#### Loading Interceptor (`loading.interceptor.ts`)
- Shows loading indicator during API calls
- Tracks multiple concurrent requests
- Auto-hides on completion

### 5. Supporting Services

#### Loading Service (`loading.service.ts`)
- Manages global loading state
- Observable for UI binding
- Request counter for concurrent calls

#### Notification Service (`notification.service.ts`)
- Material Snackbar integration
- Success/Error/Warning/Info messages
- Customizable duration and position

## Usage Examples

### 1. Login Component Integration

```typescript
export class LoginComponent {
  constructor(
    private authService: AuthService,
    private notification: NotificationService,
    private router: Router
  ) {}

  login(): void {
    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.authService.saveAuthData(response.data.token, response.data.user);
        this.notification.success('Login successful!');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.notification.error(error.error);
      }
    });
  }
}
```

### 2. Create Custom Service

```typescript
@Injectable({ providedIn: 'root' })
export class ProductService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getProducts(): Observable<any> {
    return this.get<Product[]>('/products', undefined, true);
  }

  createProduct(data: Product): Observable<any> {
    return this.post<Product>('/products', data, true);
  }
}
```

### 3. Protected Route Setup

```typescript
export const routes: Routes = [
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component')
  }
];
```

## Error Handling

### Automatic Error Handling
- Network errors
- Server errors (500)
- Unauthorized (401)
- Forbidden (403)
- Not found (404)

### Custom Error Handling
```typescript
this.service.getData().subscribe({
  next: (response) => {
    // Handle success
  },
  error: (error) => {
    // Custom error handling
    if (error.statusCode === 404) {
      this.notification.warning('Data not found');
    }
  }
});
```

## Configuration

### Environment Files
- `environment.ts`: Development config
- `environment.prod.ts`: Production config

Set your API URL:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

## Security Features

1. **Token Storage**: Secure localStorage with SSR safety
2. **Auto Token Injection**: Via HTTP interceptor
3. **Token Expiration Check**: Decode and validate JWT
4. **Auto Logout**: On 401 responses
5. **Route Protection**: Via guards

## Best Practices

1. **Single Responsibility**: Each service handles one domain
2. **Error Boundaries**: All errors caught and handled
3. **Loading States**: Automatic UI feedback
4. **Type Safety**: TypeScript interfaces for all data
5. **Observable Pattern**: RxJS for async operations
6. **Retry Logic**: Automatic retry for failed requests
7. **Clean Separation**: Business logic separated from UI

## Testing Checklist

- [ ] Login/Logout flow
- [ ] Token refresh
- [ ] Protected route access
- [ ] Error handling
- [ ] Loading states
- [ ] Unauthorized redirect
- [ ] Role-based access
- [ ] API timeout handling
- [ ] Network error handling
- [ ] Form validation

## Maintenance

### Adding New Endpoints
1. Create service extending `BaseApiService`
2. Define endpoint constants
3. Create methods using base HTTP methods
4. Add proper TypeScript interfaces

### Modifying Auth Flow
1. Update `AuthService` methods
2. Adjust token storage if needed
3. Update guards if adding new checks
4. Test all protected routes

## Support

For issues or questions:
1. Check console for detailed error logs
2. Verify API URL in environment files
3. Check network tab for request/response
4. Ensure token is properly stored
