import { Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { ApiService } from "../../core/api.service";
import { errorText } from "../../core/auth.service";
import { hoursLabel, inr, photoFor, tomorrowISO } from "../../core/format";
import { Pandit, Puja } from "../../core/models";

@Component({
  selector: "app-book",
  imports: [FormsModule, RouterLink],
  templateUrl: "./book.component.html",
})
export class BookComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  puja: Puja | null = null;
  pandits: Pandit[] = [];
  date = tomorrowISO();
  startTime = "10:00";
  hours = 2;
  address = "";
  notes = "";
  minRating = "";
  qualification = "";
  selectedPanditId = "";
  error = "";
  listError = "";
  busy = false;
  inr = inr;
  hoursLabel = hoursLabel;
  photoFor = photoFor;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) return;
    this.api.puja(id).subscribe({
      next: (puja) => {
        this.puja = puja;
        this.hours = puja.includedHours;
        this.loadPandits();
      },
      error: () => (this.error = "This puja could not be loaded."),
    });
  }

  extraHours() {
    if (!this.puja) return 0;
    return Math.round(Math.max(0, Number(this.hours) - this.puja.includedHours) * 2) / 2;
  }

  amount() {
    if (!this.puja) return 0;
    return this.puja.basePrice + Math.round(this.extraHours() * this.puja.extraHourRate);
  }

  loadPandits() {
    if (!this.puja) return;
    this.listError = "";
    this.api
      .pandits({
        pujaId: this.puja.id,
        minRating: this.minRating,
        qualification: this.qualification.trim(),
      })
      .subscribe({
        next: (pandits) => {
          this.pandits = pandits;
          if (!pandits.some((pandit) => pandit.id === this.selectedPanditId)) {
            this.selectedPanditId = "";
          }
        },
        error: () => (this.listError = "Pandits could not be loaded."),
      });
  }

  async confirm() {
    if (!this.puja || !this.selectedPanditId) {
      this.error = "Choose a pandit before confirming.";
      return;
    }
    this.error = "";
    this.busy = true;
    try {
      await new Promise<void>((resolve, reject) => {
        this.api
          .createBooking({
            pujaId: this.puja!.id,
            panditId: this.selectedPanditId,
            date: this.date,
            startTime: this.startTime,
            hours: Number(this.hours),
            address: this.address.trim(),
            notes: this.notes.trim(),
          })
          .subscribe({
            next: () => resolve(),
            error: (error) => reject(error),
          });
      });
      await this.router.navigateByUrl("/bookings");
    } catch (error) {
      this.error = errorText(error);
    } finally {
      this.busy = false;
    }
  }
}
