import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TranslationService } from './services/translation.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
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
