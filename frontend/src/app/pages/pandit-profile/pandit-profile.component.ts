import { Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../core/api.service";
import { AuthService, errorText } from "../../core/auth.service";
import { CATEGORY_ORDER, Puja } from "../../core/models";

@Component({
  selector: "app-pandit-profile",
  imports: [FormsModule],
  templateUrl: "./pandit-profile.component.html",
})
export class PanditProfileComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  qualification = "";
  experienceYears = 0;
  languages = "";
  city = "";
  bio = "";
  pujas: Puja[] = [];
  selected = new Set<string>();
  error = "";
  saved = "";
  busy = false;

  ngOnInit() {
    const profile = this.auth.user()?.panditProfile;
    if (profile) {
      this.qualification = profile.qualification;
      this.experienceYears = profile.experienceYears;
      this.languages = profile.languages;
      this.city = profile.city;
      this.bio = profile.bio;
      this.selected = new Set(profile.pujaIds);
    }
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

  save() {
    this.error = "";
    this.saved = "";
    this.busy = true;
    this.api
      .saveProfile({
        qualification: this.qualification,
        experienceYears: Number(this.experienceYears),
        languages: this.languages,
        city: this.city,
        bio: this.bio,
        pujaIds: [...this.selected],
      })
      .subscribe({
        next: (response) => {
          this.auth.setUser(response.user);
          this.saved = "Profile saved.";
          this.busy = false;
        },
        error: (error) => {
          this.error = errorText(error);
          this.busy = false;
        },
      });
  }
}
