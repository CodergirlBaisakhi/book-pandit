import { Component, inject, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ApiService } from "../../core/api.service";
import { hoursLabel, inr, photoFor } from "../../core/format";
import { CATEGORY_ORDER, Puja } from "../../core/models";

@Component({
  selector: "app-puja-list",
  imports: [RouterLink],
  templateUrl: "./puja-list.component.html",
})
export class PujaListComponent implements OnInit {
  private api = inject(ApiService);

  pujas: Puja[] = [];
  error = "";
  inr = inr;
  hoursLabel = hoursLabel;
  photoFor = photoFor;

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
}
