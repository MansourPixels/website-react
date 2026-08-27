/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * ID público do app no Spotify. O fluxo PKCE não usa client secret, então
   * este é o único valor necessário — e ele é público por design.
   * Opcional de propósito: o projeto precisa compilar e rodar sem .env.
   */
  readonly VITE_SPOTIFY_CLIENT_ID?: string;
}
