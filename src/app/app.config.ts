import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { TranslationService } from './services/translation.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes, withHashLocation()),
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const ts = inject(TranslationService);
        return () => ts.initialize();
      },
      multi: true,
    },
  ],
};
