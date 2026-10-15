import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter, withHashLocation } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { environment } from "../environments/environment";
import { routes } from "./app.routes";
import { authInterceptor } from "./core/auth.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, ...(environment.hash ? [withHashLocation()] : [])),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
