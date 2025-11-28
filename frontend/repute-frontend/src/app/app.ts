import { AsyncPipe } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { Header } from './shared/components/header/header';
import { LoadingService } from './core/services/loading.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, LoaderComponent, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('repute-frontend');
  private readonly loadingService = inject(LoadingService);
  private readonly authService = inject(AuthService);
  protected readonly loading$ = this.loadingService.loading$;

  ngOnInit(): void {
    // Validate auth state on app initialization/refresh
    // This ensures localStorage is synced with cookie presence
    this.authService.validateAuthState();
  }
}
