import { Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ApiService } from "../../core/api.service";
import { errorText } from "../../core/auth.service";
import { hoursLabel, inr, statusLabel } from "../../core/format";
import { Booking } from "../../core/models";

@Component({
  selector: "app-bookings",
  imports: [FormsModule, RouterLink],
  templateUrl: "./bookings.component.html",
})
export class BookingsComponent implements OnInit {
  private api = inject(ApiService);

  bookings: Booking[] = [];
  error = "";
  ratingDraft: Record<string, number> = {};
  commentDraft: Record<string, string> = {};
  inr = inr;
  hoursLabel = hoursLabel;
  statusLabel = statusLabel;

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.bookings().subscribe({
      next: (bookings) => {
        for (const booking of bookings) {
          this.ratingDraft[booking.id] ??= 5;
          this.commentDraft[booking.id] ??= "";
        }
        this.bookings = bookings;
      },
      error: () => (this.error = "Bookings could not be loaded."),
    });
  }

  canCancel(booking: Booking) {
    return booking.status === "PENDING" || booking.status === "ACCEPTED";
  }

  canPay(booking: Booking) {
    return !booking.paid && (booking.status === "ACCEPTED" || booking.status === "COMPLETED");
  }

  canRate(booking: Booking) {
    return booking.status === "COMPLETED" && !booking.review;
  }

  act(booking: Booking, action: string, body?: unknown) {
    this.error = "";
    this.api.bookingAction(booking.id, action, body).subscribe({
      next: (updated) => {
        this.bookings = this.bookings.map((item) => (item.id === updated.id ? updated : item));
      },
      error: (error) => (this.error = errorText(error)),
    });
  }

  cancel(booking: Booking) {
    if (!confirm("Cancel this visit?")) return;
    this.act(booking, "cancel");
  }

  rate(booking: Booking) {
    const rating = this.ratingDraft[booking.id] || 5;
    this.act(booking, "review", {
      rating,
      comment: this.commentDraft[booking.id] || "",
    });
  }
}
