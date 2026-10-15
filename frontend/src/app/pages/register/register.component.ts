import { Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { ApiService } from "../../core/api.service";
import { AuthService, errorText } from "../../core/auth.service";
import { CATEGORY_ORDER, Puja } from "../../core/models";

@Component({
  selector: "app-register",
  imports: [FormsModule, RouterLink],
  templateUrl: "./register.component.html",
})
export class RegisterComponent implements OnInit {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  role: "FAMILY" | "PANDIT" = "FAMILY";
  name = "";
  email = "";
  phone = "";
  password = "";
  qualification = "";
  experienceYears = 5;
  languages = "";
  city = "";
  bio = "";
  pujas: Puja[] = [];
  selected = new Set<string>();
  error = "";
  busy = false;

  ngOnInit() {
    this.api.pujas().subscribe({
      next: (pujas) => (this.pujas = pujas),
      error: () => (this.error = "The puja list could not be loaded."),
    });
  }

  groups() {
    return CATEGORY_ORDER.map((category) => ({
      category,
      pujas: this.pujas.filter((puja) => puja.category === category),
    })).filter((group) => group.pujas.length);
  }

  togglePuja(id: string, checked: boolean) {
    if (checked) this.selected.add(id);
    else this.selected.delete(id);
  }

  async submit() {
    this.error = "";
    if (this.role === "PANDIT" && this.selected.size === 0) {
      this.error = "Choose at least one puja you can perform.";
      return;
    }
    this.busy = true;
    try {
      const user = await this.auth.register({
        name: this.name,
        email: this.email,
        phone: this.phone,
        password: this.password,
        role: this.role,
        qualification: this.qualification,
        experienceYears: Number(this.experienceYears),
        languages: this.languages,
        city: this.city,
        bio: this.bio,
        pujaIds: [...this.selected],
      });
      await this.router.navigateByUrl(this.auth.homeFor(user));
    } catch (error) {
      this.error = errorText(error);
    } finally {
      this.busy = false;
    }
  }
}
