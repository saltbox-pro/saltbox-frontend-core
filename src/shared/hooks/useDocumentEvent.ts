import { useEffect } from "react";

export const useDocumentEvent = <TEventName extends keyof DocumentEventMap>(
  eventName: TEventName,
  listener: ((event: DocumentEventMap[TEventName]) => void) | undefined,
  options?: boolean | AddEventListenerOptions
) => {
  useEffect(() => {
    if (!listener) return;

    document.addEventListener(eventName, listener, options);

    return () => {
      document.removeEventListener(eventName, listener, options);
    };
  }, [eventName, listener, options]);
};
