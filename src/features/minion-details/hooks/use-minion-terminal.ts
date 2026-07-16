import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useDocumentEvent } from "saltbox-core/shared/hooks/useDocumentEvent";
import { appStore, getTerminalSessionStore } from "saltbox-core/store";

export function useMinionTerminal(minion: MinionDetailSchema, isTabActive: boolean) {
  const terminalSessionStore = useMemo(
    () => getTerminalSessionStore(minion.id, minion.minion_id, minion.master ?? ""),
    [minion.id, minion.master, minion.minion_id]
  );

  const terminalWrapperRef = useRef<HTMLDivElement>(null);
  const [startingInputValue, setStartingInputValue] = useState("");
  const historyIndexRef = useRef(-1);
  const forceInputValueUpdateToggleRef = useRef(false);

  const isCommandRunning = terminalSessionStore.status !== "idle";

  const handleCommandSubmit = useCallback(
    (command: string) => {
      historyIndexRef.current = -1;
      terminalSessionStore.handleRunCommand(command);
    },
    [terminalSessionStore]
  );

  const setTerminalInputValue = useCallback((value: string) => {
    forceInputValueUpdateToggleRef.current = !forceInputValueUpdateToggleRef.current;
    setStartingInputValue(value + (forceInputValueUpdateToggleRef.current ? " " : ""));
  }, []);

  const recallHistory = useCallback(
    (direction: -1 | 1) => {
      const history = terminalSessionStore.commandHistory;
      if (!history.length) {
        return;
      }

      let index = historyIndexRef.current;
      if (index === -1) {
        if (direction === 1) {
          return;
        }
        index = history.length - 1;
      } else {
        index += direction;
      }

      if (index > history.length - 1) {
        historyIndexRef.current = -1;
        setTerminalInputValue("");
        return;
      }

      historyIndexRef.current = Math.max(index, 0);
      setTerminalInputValue(history[historyIndexRef.current]);
    },
    [setTerminalInputValue, terminalSessionStore]
  );

  useEffect(() => {
    const terminalWrapper = terminalWrapperRef.current;
    if (!terminalWrapper) {
      return;
    }

    const keepTextSelectionOnClick = (event: MouseEvent) => {
      if (document.getSelection()?.toString()) {
        event.stopPropagation();
      }
    };

    terminalWrapper.addEventListener("click", keepTextSelectionOnClick, true);
    return () => {
      terminalWrapper.removeEventListener("click", keepTextSelectionOnClick, true);
    };
  }, []);

  useEffect(() => {
    const terminalWrapper = terminalWrapperRef.current;
    if (!terminalWrapper || isCommandRunning) {
      return;
    }

    const handleIdleKeyDown = (event: KeyboardEvent) => {
      const isCtrl = event.ctrlKey && !event.metaKey && !event.altKey;

      if (isCtrl && event.code === "KeyC") {
        if (document.getSelection()?.toString()) {
          return;
        }
        event.preventDefault();
        const hiddenInput =
          terminalWrapper.querySelector<HTMLInputElement>(".terminal-hidden-input");
        terminalSessionStore.handleIdleInterrupt(hiddenInput?.value ?? "");
        historyIndexRef.current = -1;
        setTerminalInputValue("");
        return;
      }

      if (isCtrl && event.code === "KeyL") {
        event.preventDefault();
        terminalSessionStore.handleClearScreen();
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();
        recallHistory(event.key === "ArrowUp" ? -1 : 1);
        return;
      }

      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1) {
        historyIndexRef.current = -1;
      }
    };

    terminalWrapper.addEventListener("keydown", handleIdleKeyDown);
    return () => {
      terminalWrapper.removeEventListener("keydown", handleIdleKeyDown);
    };
  }, [isCommandRunning, recallHistory, setTerminalInputValue, terminalSessionStore]);

  const handleRunningKeyDown = useMemo(() => {
    if (!isCommandRunning || !isTabActive) {
      return undefined;
    }

    return (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.code === "KeyC") {
        event.preventDefault();
        terminalSessionStore.handleStopCommand("^C");
      } else if (event.code === "KeyZ") {
        event.preventDefault();
        terminalSessionStore.handleStopCommand("^Z");
      } else if (event.code === "KeyL") {
        event.preventDefault();
        terminalSessionStore.handleClearScreen();
      }
    };
  }, [isCommandRunning, isTabActive, terminalSessionStore]);

  useDocumentEvent("keydown", handleRunningKeyDown);

  useEffect(() => {
    const accessToken = appStore.authStore?.user?.access_token;
    if (accessToken) {
      terminalSessionStore.sendAccessToken(accessToken);
    }
  }, [appStore.authStore?.user, terminalSessionStore]);

  useEffect(() => {
    const scrollContainer = terminalWrapperRef.current?.querySelector(".react-terminal");
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [terminalSessionStore.screenLines.length, terminalSessionStore.status]);

  useEffect(() => {
    if (!isTabActive || isCommandRunning || document.getSelection()?.toString()) {
      return;
    }
    terminalWrapperRef.current
      ?.querySelector<HTMLInputElement>(".terminal-hidden-input")
      ?.focus({ preventScroll: true });
  }, [isCommandRunning, isTabActive]);

  return { terminalSessionStore, terminalWrapperRef, startingInputValue, handleCommandSubmit };
}
