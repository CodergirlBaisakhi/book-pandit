import { Component, inject } from "@angular/core";
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { environment } from "../environments/environment";
import { AuthService } from "./core/auth.service";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  demo = environment.demo;
  menuOpen = false;

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) this.menuOpen = false;
    });
  }

  closeMenu() {
    this.menuOpen = false;
  }

  logout() {
    this.closeMenu();
    this.auth.logout();
  }
}
