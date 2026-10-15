import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../../core/auth.service";

@Component({
  selector: "app-home-redirect",
  template: "",
})
export class HomeRedirectComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    void this.go();
  }

  private async go() {
    const user = await this.auth.ensureUser();
    await this.router.navigateByUrl(user ? this.auth.homeFor(user) : "/login");
  }
}
