import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    loadComponent: () => import('./features/home/home').then(m => m.Home)
  },
  
  // Auth routes (only accessible when not logged in)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'signup',
        loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent)
      },
      {
        path: 'verify-email',
        loadComponent: () => import('./features/auth/otp/otp.component').then(m => m.OtpComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },

  // Protected routes (require authentication)
//   {
//     path: 'dashboard',
//     canActivate: [authGuard],
//     loadComponent: () => import('../features/dashboard/dashboard.component').then(m => m.DashboardComponent)
//   },

  // Admin routes (require admin role)
//   {
//     path: 'admin',
//     canActivate: [roleGuard(['admin'])],
//     loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent)
//   },

  // Error routes
//   {
//     path: 'unauthorized',
//     loadComponent: () => import('./shared/components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
//   },
//   {
//     path: '**',
//     loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
//   }
];
