import { SourceState } from "@saltbox/saltbox-core-api-client";
import { useEffect } from "react";

import type { ConfigurationTemplatesStore } from "../model/configuration-templates-store";

const POLL_INTERVAL_MS = 2000;

export function useSourceOperationPoll(
  sourceId: string,
  currentOperation: unknown,
  store: ConfigurationTemplatesStore
) {
  useEffect(() => {
    if (currentOperation === null) return;
    const source = store.sources.find((item) => item.id === sourceId);
    if (!source) return;
    if (source.state === SourceState.Broken) return;
    if (source.last_error) return;
    if (store.actionSourceId === sourceId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      const updated = await store.refreshSource(sourceId);
      if (cancelled || !updated) return;

      store.applySourceUpdate(updated);

      if (updated.state === SourceState.Broken) return;
      if (updated.last_error) return;

      if (updated.current_operation !== null) {
        timer = setTimeout(() => {
          poll().catch(console.error);
        }, POLL_INTERVAL_MS);
      }
    };

    poll().catch(console.error);

    return () => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
    };
  }, [sourceId, currentOperation, store, store.actionSourceId]);
}
