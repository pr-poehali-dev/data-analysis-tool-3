import { useEffect } from "react";

export function useNoIndex() {
  useEffect(() => {
    const meta = document.getElementById("robots-meta") as HTMLMetaElement | null;
    const previous = meta?.getAttribute("content") ?? null;
    meta?.setAttribute("content", "noindex, nofollow");

    return () => {
      if (meta && previous !== null) meta.setAttribute("content", previous);
    };
  }, []);
}
