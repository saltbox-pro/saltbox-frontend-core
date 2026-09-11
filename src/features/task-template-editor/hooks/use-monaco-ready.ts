import { useEffect, useState } from "react";

import { ensureMonaco, isMonacoReady } from "../lib/monaco-loader";

/** `true`, когда monaco загружен и настроен: до этого редактор рендерить нельзя. */
export function useMonacoReady(): boolean {
  const [ready, setReady] = useState(isMonacoReady);

  useEffect(() => {
    if (ready) return undefined;

    let cancelled = false;
    ensureMonaco()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((error: unknown) => {
        console.error("Failed to load monaco editor:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [ready]);

  return ready;
}
