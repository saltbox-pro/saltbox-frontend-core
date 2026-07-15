import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useDocumentEvent } from "saltbox-core/shared/hooks/useDocumentEvent";
import { appStore, getTerminalSessionStore } from "saltbox-core/store";

export function useMinionTerminal(minion: MinionDetailSchema, isTabActive: boolean) {
  const store = useMemo(
    () => getTerminalSessionStore(minion.id, minion.minion_id, minion.master ?? ""),
    [minion.id, minion.master, minion.minion_id]
  );

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [startingInputValue, setStartingInputValue] = useState("");
  const historyPointerRef = useRef(-1);
  const padToggleRef = useRef(false);

  const isBusy = store.status !== "idle";

  const handleInput = useCallback(
    (input: string) => {
      historyPointerRef.current = -1;
      store.runCommand(input);
    },
    [store]
  );

  const setInputValue = useCallback((value: string) => {
    padToggleRef.current = !padToggleRef.current;
    setStartingInputValue(value + (padToggleRef.current ? " " : ""));
  }, []);

  const recallHistory = useCallback(
    (direction: -1 | 1) => {
      const history = store.commandHistory;
      if (!history.length) {
        return;
      }

      let pointer = historyPointerRef.current;
      if (pointer === -1) {
        if (direction === 1) {
          return;
        }
        pointer = history.length - 1;
      } else {
        pointer += direction;
      }

      if (pointer > history.length - 1) {
        historyPointerRef.current = -1;
        setInputValue("");
        return;
      }

      historyPointerRef.current = Math.max(pointer, 0);
      setInputValue(history[historyPointerRef.current]);
    },
    [setInputValue, store]
  );

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }

    const handleClickCapture = (event: MouseEvent) => {
      if (document.getSelection()?.toString()) {
        event.stopPropagation();
      }
    };

    wrapper.addEventListener("click", handleClickCapture, true);
    return () => {
      wrapper.removeEventListener("click", handleClickCapture, true);
    };
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || isBusy) {
      return;
    }

    const handleIdleKeyDown = (event: KeyboardEvent) => {
      const isCtrl = event.ctrlKey && !event.metaKey && !event.altKey;
      const key = event.key;

      if (isCtrl && key.toLowerCase() === "c") {
        if (document.getSelection()?.toString()) {
          return;
        }
        event.preventDefault();
        const hiddenInput = wrapper.querySelector<HTMLInputElement>(".terminal-hidden-input");
        store.echoIdlePrompt(hiddenInput?.value ?? "");
        historyPointerRef.current = -1;
        setInputValue("");
        return;
      }

      if (isCtrl && key.toLowerCase() === "l") {
        event.preventDefault();
        store.clear();
        return;
      }

      if (key === "ArrowUp" || key === "ArrowDown") {
        event.preventDefault();
        recallHistory(key === "ArrowUp" ? -1 : 1);
        return;
      }

      if (!event.ctrlKey && !event.metaKey && !event.altKey && key.length === 1) {
        historyPointerRef.current = -1;
      }
    };

    wrapper.addEventListener("keydown", handleIdleKeyDown);
    return () => {
      wrapper.removeEventListener("keydown", handleIdleKeyDown);
    };
  }, [isBusy, recallHistory, setInputValue, store]);

  const handleRunningKeyDown = useMemo(() => {
    if (!isBusy || !isTabActive) {
      return undefined;
    }

    return (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "c") {
        event.preventDefault();
        store.interrupt("^C");
      } else if (key === "z") {
        event.preventDefault();
        store.interrupt("^Z");
      } else if (key === "l") {
        event.preventDefault();
        store.clear();
      }
    };
  }, [isBusy, isTabActive, store]);

  useDocumentEvent("keydown", handleRunningKeyDown);

  useEffect(() => {
    const accessToken = appStore.authStore?.user?.access_token;
    if (accessToken) {
      store.sendAccessToken(accessToken);
    }
  }, [appStore.authStore?.user, store]);

  useEffect(() => {
    const scrollEl = wrapperRef.current?.querySelector(".react-terminal");
    if (scrollEl) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  }, [store.lines.length, store.status]);

  useEffect(() => {
    if (!isTabActive || isBusy || document.getSelection()?.toString()) {
      return;
    }
    wrapperRef.current
      ?.querySelector<HTMLInputElement>(".terminal-hidden-input")
      ?.focus({ preventScroll: true });
  }, [isBusy, isTabActive]);

  return { store, wrapperRef, startingInputValue, handleInput };
}
