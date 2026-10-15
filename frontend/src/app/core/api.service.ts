import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { API_URL, AppUser, Booking, Pandit, Puja } from "./models";

@Injectable({ providedIn: "root" })
export class ApiService {
  private http = inject(HttpClient);

  pujas() {
    return this.http.get<Puja[]>(`${API_URL}/pujas`);
  }

  puja(id: string) {
    return this.http.get<Puja>(`${API_URL}/pujas/${id}`);
  }

  pandits(filters: { pujaId?: string; minRating?: string; qualification?: string }) {
    let params = new HttpParams();
    if (filters.pujaId) params = params.set("pujaId", filters.pujaId);
    if (filters.minRating) params = params.set("minRating", filters.minRating);
    if (filters.qualification) params = params.set("qualification", filters.qualification);
    return this.http.get<Pandit[]>(`${API_URL}/pandits`, { params });
  }

  bookings() {
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
    return this.http.post<Booking>(`${API_URL}/bookings`, body);
  }

  bookingAction(id: string, action: string, body?: unknown) {
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
    return this.http.post<{ user: AppUser }>(`${API_URL}/pandits/me`, body);
  }
}
