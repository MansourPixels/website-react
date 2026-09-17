import { cn } from "@heroui/styles";

// Mesma regra do `SpotifyMark`: a marca de terceiro entra só como glifo, e é a
// única coisa colorida fora da paleta do Revi na seção inteira.
export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Google"
      className={cn("size-6 shrink-0", className)}
    >
      <path
        fill="#4285F4"
        d="M23.52 12.273c0-.851-.076-1.669-.218-2.455H12v4.642h6.458a5.52 5.52 0 0 1-2.395 3.622v3.01h3.878c2.269-2.088 3.579-5.165 3.579-8.819z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.956-1.075 7.941-2.908l-3.878-3.01c-1.075.72-2.45 1.145-4.063 1.145-3.125 0-5.77-2.11-6.715-4.947H1.276v3.107A11.995 11.995 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.285 14.28a7.212 7.212 0 0 1 0-4.56V6.613H1.276a11.999 11.999 0 0 0 0 10.774l4.009-3.107z"
      />
      <path
        fill="#EA4335"
        d="M12 4.773c1.762 0 3.344.606 4.589 1.794l3.442-3.442C17.951 1.19 15.235 0 12 0 7.309 0 3.251 2.69 1.276 6.613l4.009 3.107C6.23 6.883 8.875 4.773 12 4.773z"
      />
    </svg>
  );
}
