import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = await auth.ensureUser();
  if (!user) return true;
  return router.createUrlTree([auth.homeFor(user)]);
};

export const familyGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = await auth.ensureUser();
  if (!user) return router.createUrlTree(["/login"]);
  if (user.role !== "FAMILY") return router.createUrlTree(["/pandit"]);
  return true;
};

export const panditGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = await auth.ensureUser();
  if (!user) return router.createUrlTree(["/login"]);
  if (user.role !== "PANDIT") return router.createUrlTree(["/pujas"]);
  return true;
};
