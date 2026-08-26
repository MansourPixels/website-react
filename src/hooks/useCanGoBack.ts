import { useEffect, useState } from "react";
import { useLocation } from "react-router";

function readIdx() {
  if (typeof window === "undefined") return 0;
  return (window.history.state as { idx?: number } | null)?.idx ?? 0;
}

export function useCanGoBack() {
  const location = useLocation();
  const [canGoBack, setCanGoBack] = useState(() => readIdx() > 0);

  useEffect(() => {
    setCanGoBack(readIdx() > 0);
  }, [location.key]);

  return canGoBack;
}
