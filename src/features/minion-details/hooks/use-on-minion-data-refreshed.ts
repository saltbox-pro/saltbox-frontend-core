import {
  type MinionDataRefreshedEventDetail,
  subscribe,
  UiEvent,
  unsubscribe,
} from "@saltbox/saltbox-frontend-common";
import { useEffect, useRef } from "react";

type UseOnMinionDataRefreshedOptions = {
  queueWhenUnset?: boolean;
};

export function useOnMinionDataRefreshed(
  currentMinionId: string | null | undefined,
  onRefreshed: () => void,
  options?: UseOnMinionDataRefreshedOptions
): void {
  const onRefreshedRef = useRef(onRefreshed);
  onRefreshedRef.current = onRefreshed;
  const pendingMinionIdRef = useRef<string | null>(null);
  const queueWhenUnset = options?.queueWhenUnset ?? false;

  useEffect(() => {
    const onMinionDataRefreshed = (event: CustomEvent<MinionDataRefreshedEventDetail>) => {
      const updatedMinionId = event.detail?.minionId;
      if (!updatedMinionId) {
        return;
      }

      if (currentMinionId == null) {
        if (queueWhenUnset) {
          pendingMinionIdRef.current = updatedMinionId;
        }
        return;
      }

      if (updatedMinionId === currentMinionId) {
        onRefreshedRef.current();
      }
    };

    subscribe(UiEvent.MinionDataRefreshed, onMinionDataRefreshed);
    return () => {
      unsubscribe(UiEvent.MinionDataRefreshed, onMinionDataRefreshed);
    };
  }, [currentMinionId, queueWhenUnset]);

  useEffect(() => {
    if (!queueWhenUnset) {
      return;
    }

    const pendingMinionId = pendingMinionIdRef.current;
    if (!pendingMinionId || currentMinionId == null) {
      return;
    }

    pendingMinionIdRef.current = null;
    if (pendingMinionId === currentMinionId) {
      onRefreshedRef.current();
    }
  }, [currentMinionId, queueWhenUnset]);
}
