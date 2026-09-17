// Tipos mínimos dos dois SDKs que o Google só distribui por <script>: o
// Identity Services (token client) e o `gapi` que carrega o Picker. Só o que
// o Revi usa está aqui — declarar a superfície inteira seria manter de graça
// uma API que não chamamos.

interface GoogleTokenResponse {
  access_token?: string;
  /** Segundos. */
  expires_in?: number;
  /** Escopos concedidos, separados por espaço. */
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClientError {
  /** `popup_failed_to_open` é bloqueio de pop-up; `popup_closed` é desistência. */
  type: "popup_failed_to_open" | "popup_closed" | string;
  message?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  prompt?: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: GoogleTokenClientError) => void;
}

interface GooglePickerDocument {
  id: string;
  name?: string;
  mimeType?: string;
  sizeBytes?: string | number;
}

interface GooglePickerResponse {
  /** "picked" | "cancel" | "loaded". */
  action: string;
  docs?: GooglePickerDocument[];
}

interface GooglePickerInstance {
  setVisible: (isVisible: boolean) => void;
  dispose: () => void;
}

interface GooglePickerDocsView {
  setIncludeFolders: (include: boolean) => GooglePickerDocsView;
  setMimeTypes: (mimeTypes: string) => GooglePickerDocsView;
  setSelectFolderEnabled: (enabled: boolean) => GooglePickerDocsView;
}

interface GooglePickerBuilder {
  addView: (view: GooglePickerDocsView) => GooglePickerBuilder;
  setOAuthToken: (token: string) => GooglePickerBuilder;
  setDeveloperKey: (key: string) => GooglePickerBuilder;
  setAppId: (appId: string) => GooglePickerBuilder;
  setLocale: (locale: string) => GooglePickerBuilder;
  setTitle: (title: string) => GooglePickerBuilder;
  setCallback: (
    callback: (response: GooglePickerResponse) => void,
  ) => GooglePickerBuilder;
  build: () => GooglePickerInstance;
}

declare namespace google {
  namespace accounts.oauth2 {
    function initTokenClient(config: GoogleTokenClientConfig): GoogleTokenClient;
    function revoke(accessToken: string, done?: () => void): void;
  }

  namespace picker {
    const DocsView: new () => GooglePickerDocsView;
    const PickerBuilder: new () => GooglePickerBuilder;
  }
}

declare const gapi: {
  load: (api: string, callback: () => void) => void;
};
