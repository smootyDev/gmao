import { ApplicationConfig, provideZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { offlineInterceptor } from './core/interceptors/offline.interceptor';
import { buildThemePreset, loadPersistedLayoutConfig } from './layout/theme';

export function translateLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

// Se calcula antes de arrancar Angular para que la primera pintura (login incluido)
// ya use el tema persistido/por defecto, sin flash del preset Aura sin modificar.
const initialLayoutConfig = loadPersistedLayoutConfig();
if (typeof document !== 'undefined' && initialLayoutConfig.darkTheme) {
  document.documentElement.classList.add('app-dark');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor, offlineInterceptor])),
    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useFactory: translateLoaderFactory,
        deps: [HttpClient]
      },
      defaultLanguage: 'es'
    }),
    providePrimeNG({
      theme: {
        preset: buildThemePreset(initialLayoutConfig),
        options: {
          darkModeSelector: '.app-dark',
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng'
          }
        }
      },
      ripple: true
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
