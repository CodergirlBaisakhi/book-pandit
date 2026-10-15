import { NgTemplateOutlet } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ApiService } from "../../core/api.service";
import { errorText } from "../../core/auth.service";
import { hoursLabel, inr, statusLabel } from "../../core/format";
import { Booking } from "../../core/models";

@Component({
  selector: "app-pandit-home",
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: "./pandit-home.component.html",
})
export class PanditHomeComponent implements OnInit {
  private api = inject(ApiService);

  bookings: Booking[] = [];
  error = "";
  inr = inr;
  hoursLabel = hoursLabel;
  statusLabel = statusLabel;

  pending() {
    return this.bookings.filter((booking) => booking.status === "PENDING");
  }

  accepted() {
    return this.bookings.filter((booking) => booking.status === "ACCEPTED");
  }

  earlier() {
    return this.bookings.filter(
      (booking) => booking.status !== "PENDING" && booking.status !== "ACCEPTED",
    );
  }

  ngOnInit() {
    this.api.bookings().subscribe({
      next: (bookings) => (this.bookings = bookings),
      error: () => (this.error = "Your schedule could not be loaded."),
    });
  }

  act(booking: Booking, action: string) {
    this.error = "";
    this.api.bookingAction(booking.id, action).subscribe({
      next: (updated) => {
        this.bookings = this.bookings.map((item) => (item.id === updated.id ? updated : item));
      },
      error: (error) => (this.error = errorText(error)),
    });
  }

  cancel(booking: Booking) {
    if (!confirm("Cancel this accepted visit?")) return;
    this.act(booking, "cancel");
  }
}
