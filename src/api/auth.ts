import type {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  TokenPairResponse,
} from "@/types/api/auth";

import { apiFetch } from "./client";

export function register(body: RegisterRequest): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body,
    auth: false,
  });
}

export function login(body: LoginRequest): Promise<TokenPairResponse> {
  return apiFetch<TokenPairResponse>("/api/auth/login", {
    method: "POST",
    body,
    auth: false,
  });
}

export function refresh(refreshToken: string): Promise<TokenPairResponse> {
  return apiFetch<TokenPairResponse>("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken },
    auth: false,
  });
}

export function logout(refreshToken: string): Promise<void> {
  return apiFetch<void>("/api/auth/logout", {
    method: "POST",
    body: { refreshToken },
    auth: false,
  });
}

export function forgotPassword(email: string): Promise<void> {
  return apiFetch<void>("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

export function resendVerificationEmail(): Promise<void> {
  return apiFetch<void>("/api/auth/resend-verification-email", {
    method: "POST",
  });
}
