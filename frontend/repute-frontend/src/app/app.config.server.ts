import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
// import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';


// SSR setup for Angular 19: use provideServerModule or provideServerTransition if needed
const serverConfig: ApplicationConfig = {
  providers: [
    // Add SSR providers here for Angular 19 if needed
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
