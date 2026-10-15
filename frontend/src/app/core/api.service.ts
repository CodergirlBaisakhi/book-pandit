import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { of } from "rxjs";
import { environment } from "../../environments/environment";
import { DemoStore } from "../demo/demo-store";
import { API_URL, AppUser, Booking, Pandit, Puja } from "./models";

@Injectable({ providedIn: "root" })
export class ApiService {
  private http = inject(HttpClient);
  private demo = inject(DemoStore);

  pujas() {
    if (environment.demo) return of(this.demo.pujas());
    return this.http.get<Puja[]>(`${API_URL}/pujas`);
  }

  puja(id: string) {
    if (environment.demo) return of(this.demo.puja(id));
    return this.http.get<Puja>(`${API_URL}/pujas/${id}`);
  }

  pandits(filters: { pujaId?: string; minRating?: string; qualification?: string }) {
    if (environment.demo) return of(this.demo.pandits(filters));
    let params = new HttpParams();
    if (filters.pujaId) params = params.set("pujaId", filters.pujaId);
    if (filters.minRating) params = params.set("minRating", filters.minRating);
    if (filters.qualification) params = params.set("qualification", filters.qualification);
    return this.http.get<Pandit[]>(`${API_URL}/pandits`, { params });
  }

  bookings() {
    if (environment.demo) return of(this.demo.bookings(localStorage.getItem("bp_token")));
    return this.http.get<Booking[]>(`${API_URL}/bookings`);
  }

  createBooking(body: {
    pujaId: string;
    panditId: string;
    date: string;
    startTime: string;
    hours: number;
    address: string;
    notes: string;
  }) {
    if (environment.demo) return of(this.demo.createBooking(localStorage.getItem("bp_token"), body));
    return this.http.post<Booking>(`${API_URL}/bookings`, body);
  }

  bookingAction(id: string, action: string, body?: unknown) {
    if (environment.demo) return of(this.demo.bookingAction(localStorage.getItem("bp_token"), id, action, body));
    return this.http.post<Booking>(`${API_URL}/bookings/${id}/${action}`, body ?? {});
  }

  saveProfile(body: {
    qualification: string;
    experienceYears: number;
    languages: string;
    bio: string;
    city: string;
    pujaIds: string[];
  }) {
    if (environment.demo) return of(this.demo.saveProfile(localStorage.getItem("bp_token"), body));
    return this.http.post<{ user: AppUser }>(`${API_URL}/pandits/me`, body);
  }
}
