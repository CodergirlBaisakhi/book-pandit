import { Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "./core/auth.service";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  auth = inject(AuthService);

  logout() {
    this.auth.logout();
  }
}
