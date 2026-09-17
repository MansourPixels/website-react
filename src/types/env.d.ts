/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPOTIFY_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_GOOGLE_API_KEY?: string;
  readonly VITE_GOOGLE_APP_ID?: string;
  /** "true" faz o token vir do revi-back em vez do navegador. Ver GOOGLE.md. */
  readonly VITE_GOOGLE_BACKEND?: string;
}
