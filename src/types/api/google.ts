export interface GoogleConnectionStatus {
  connected: boolean;
  email: string | null;
  scopes: string[];
}

export interface GoogleAuthorizeUrl {
  url: string;
}

export interface GoogleToken {
  accessToken: string;
  expiresIn: number;
  scope: string;
}
