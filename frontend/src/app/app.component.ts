import { Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
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
  demo = environment.demo;

  logout() {
    this.auth.logout();
  }
}
