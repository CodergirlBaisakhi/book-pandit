import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService, errorText } from "../../core/auth.service";

@Component({
  selector: "app-login",
  imports: [FormsModule, RouterLink],
  templateUrl: "./login.component.html",
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = "";
  password = "";
  error = "";
  busy = false;

  fill(email: string) {
    this.email = email;
    this.password = "password123";
  }

  async submit() {
    this.error = "";
    this.busy = true;
    try {
      const user = await this.auth.login(this.email, this.password);
      await this.router.navigateByUrl(this.auth.homeFor(user));
    } catch (error) {
      this.error = errorText(error);
    } finally {
      this.busy = false;
    }
  }
}
