import { useEffect } from "react";

export const useDocumentEvent = <TEventName extends keyof DocumentEventMap>(
  eventName: TEventName,
  getListener: () => ((event: DocumentEventMap[TEventName]) => void) | undefined,
  dependencies: unknown[]
) => {
  useEffect(() => {
    const listener = getListener();
    if (!listener) return;
    document.addEventListener(eventName, listener);
    return () => document.removeEventListener(eventName, listener);
  }, dependencies);
};
