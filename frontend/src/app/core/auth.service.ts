import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
import { DemoStore } from "../demo/demo-store";
import { API_URL, AppUser, AuthResponse } from "./models";

@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private demo = inject(DemoStore);

  token = signal<string | null>(localStorage.getItem("bp_token"));
  user = signal<AppUser | null>(null);

  async ensureUser() {
    const token = this.token();
    if (!token) return null;
    if (this.user()) return this.user();
    if (environment.demo) {
      const user = this.demo.me(token);
      if (!user) {
        this.clear();
        return null;
      }
      this.user.set(user);
      return user;
    }
    try {
      const response = await firstValueFrom(this.http.get<{ user: AppUser }>(`${API_URL}/auth/me`));
      this.user.set(response.user);
      return response.user;
    } catch {
      this.clear();
      return null;
    }
  }

  async login(email: string, password: string) {
    if (environment.demo) {
      const response = this.demo.login(email, password);
      this.persist(response);
      return response.user;
    }
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_URL}/auth/login`, { email, password }),
    );
    this.persist(response);
    return response.user;
  }

  async register(body: Record<string, unknown>) {
    if (environment.demo) {
      const response = this.demo.register(body);
      this.persist(response);
      return response.user;
    }
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${API_URL}/auth/register`, body),
    );
    this.persist(response);
    return response.user;
  }

  setUser(user: AppUser) {
    this.user.set(user);
  }

  homeFor(user: AppUser) {
    return user.role === "PANDIT" ? "/pandit" : "/pujas";
  }

  logout() {
    this.clear();
    void this.router.navigate(["/login"]);
  }

  private persist(response: AuthResponse) {
    localStorage.setItem("bp_token", response.token);
    this.token.set(response.token);
    this.user.set(response.user);
  }

  private clear() {
    localStorage.removeItem("bp_token");
    this.token.set(null);
    this.user.set(null);
  }
}

export function errorText(error: unknown) {
  if (error instanceof HttpErrorResponse) {
    const message = error.error?.error;
    if (typeof message === "string" && message) return message;
  }
  return "Something went wrong. Please try again.";
}
