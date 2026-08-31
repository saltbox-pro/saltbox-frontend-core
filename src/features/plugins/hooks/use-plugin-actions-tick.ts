import { subscribe, type UiEvent, unsubscribe } from "@saltbox/saltbox-frontend-common";
import { useEffect, useState } from "react";

export function usePluginActionsTick(event: UiEvent): void {
  const [, setTick] = useState(0);

  useEffect(() => {
    const onActionsChanged = () => {
      setTick((value) => value + 1);
    };
    subscribe(event, onActionsChanged);
    return () => {
      unsubscribe(event, onActionsChanged);
    };
  }, [event]);
}
