import { Routes } from "@angular/router";
import { familyGuard, guestGuard, panditGuard } from "./core/guards";
import { HomeRedirectComponent } from "./pages/home-redirect/home-redirect.component";
import { LoginComponent } from "./pages/login/login.component";
import { RegisterComponent } from "./pages/register/register.component";
import { PujaListComponent } from "./pages/puja-list/puja-list.component";
import { BookComponent } from "./pages/book/book.component";
import { BookingsComponent } from "./pages/bookings/bookings.component";
import { PanditHomeComponent } from "./pages/pandit-home/pandit-home.component";
import { PanditProfileComponent } from "./pages/pandit-profile/pandit-profile.component";

export const routes: Routes = [
  { path: "", pathMatch: "full", component: HomeRedirectComponent },
  { path: "login", component: LoginComponent, canActivate: [guestGuard] },
  { path: "register", component: RegisterComponent, canActivate: [guestGuard] },
  { path: "pujas", component: PujaListComponent, canActivate: [familyGuard] },
  { path: "pujas/:id", component: BookComponent, canActivate: [familyGuard] },
  { path: "bookings", component: BookingsComponent, canActivate: [familyGuard] },
  { path: "pandit", component: PanditHomeComponent, canActivate: [panditGuard] },
  { path: "pandit/profile", component: PanditProfileComponent, canActivate: [panditGuard] },
  { path: "**", redirectTo: "" },
];
