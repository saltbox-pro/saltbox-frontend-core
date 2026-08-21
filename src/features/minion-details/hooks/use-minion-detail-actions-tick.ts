import { subscribe, UiEvent, unsubscribe } from "@saltbox/saltbox-frontend-common";
import { useEffect, useState } from "react";

export function useMinionDetailActionsTick(): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onActionsChanged = () => {
      setTick((value) => value + 1);
    };
    subscribe(UiEvent.MinionDetailActionsChanged, onActionsChanged);
    return () => {
      unsubscribe(UiEvent.MinionDetailActionsChanged, onActionsChanged);
    };
  }, []);

  return tick;
}
