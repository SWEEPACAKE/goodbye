import { ApplicationConfig, APP_INITIALIZER, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { SlotRegistryService } from './services/slot-registry';

import { Nicolas } from './components/nicolas/nicolas';
import { Dylan } from './components/dylan/dylan';
import { Hugo } from './components/hugo/hugo';
import { Abdelazize } from './components/abdelazize/abdelazize';
import { Thomas } from './components/thomas/thomas';
import { Carole } from './components/carole/carole';
import { Nadege } from './components/nadege/nadege';
import { Emmanuel } from './components/emmanuel/emmanuel';

const STUDENT_COMPONENTS = [
  Nicolas,
  Dylan,
  Hugo,
  Abdelazize,
  Thomas,
  Carole,
  Nadege,
  Emmanuel,
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const registry = inject(SlotRegistryService);
        return () => STUDENT_COMPONENTS.forEach(c => registry.register(c));
      },
      multi: true,
    },
  ]
};