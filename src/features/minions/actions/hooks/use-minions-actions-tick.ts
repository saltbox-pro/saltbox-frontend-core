import { subscribe, UiEvent, unsubscribe } from "@saltbox/saltbox-frontend-common";
import { useEffect, useState } from "react";

export function useMinionsActionsTick(): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onActionsChanged = () => {
      setTick((value) => value + 1);
    };
    subscribe(UiEvent.MinionsActionsChanged, onActionsChanged);
    return () => {
      unsubscribe(UiEvent.MinionsActionsChanged, onActionsChanged);
    };
  }, []);

  return tick;
}
