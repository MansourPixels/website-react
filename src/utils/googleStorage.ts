const GOOGLE_RETURN_TO_KEY = "revi:google-return-to";

export function validGoogleReturnTo(returnTo: string): string {
  return returnTo.startsWith("/") && !returnTo.startsWith("//")
    ? returnTo
    : "/";
}

export function saveGoogleReturnTo(returnTo: string) {
  sessionStorage.setItem(GOOGLE_RETURN_TO_KEY, validGoogleReturnTo(returnTo));
}

export function takeGoogleReturnTo(): string {
  const returnTo = sessionStorage.getItem(GOOGLE_RETURN_TO_KEY) ?? "/";

  sessionStorage.removeItem(GOOGLE_RETURN_TO_KEY);

  return validGoogleReturnTo(returnTo);
}
