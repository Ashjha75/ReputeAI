import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => {
    // Show error in the UI for easier debugging
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100vw';
    errorDiv.style.background = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.zIndex = '9999';
    errorDiv.style.padding = '1rem';
    errorDiv.style.fontSize = '1.2rem';
    errorDiv.innerText = 'Angular bootstrap error: ' + err;
    document.body.appendChild(errorDiv);
    console.error(err);
  });
