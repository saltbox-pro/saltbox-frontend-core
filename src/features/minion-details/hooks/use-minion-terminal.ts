import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useDocumentEvent } from "saltbox-core/shared/hooks/useDocumentEvent";
import { appStore, getTerminalSessionStore } from "saltbox-core/store";

import { loadTerminalCmdRunSettings } from "../model/terminal-cmd-settings";

const TERMINAL_COLOR_MODE_STORAGE_KEY = "terminalColorMode";
const CURSOR_SCROLL_MARGIN = 4;

interface CursorOverlayRect {
  top: number;
  left: number;
  height: number;
}

export function useMinionTerminal(
  minion: MinionDetailSchema,
  isTabActive: boolean,
  isSettingsOpen: boolean
) {
  const terminalSessionStore = useMemo(
    () => getTerminalSessionStore(minion.id, minion.minion_id, minion.master ?? ""),
    [minion.id, minion.master, minion.minion_id]
  );

  const terminalWrapperRef = useRef<HTMLDivElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const [startingInputValue, setStartingInputValue] = useState("");
  const [cursorOverlayRect, setCursorOverlayRect] = useState<CursorOverlayRect | null>(null);
  const [isLightTheme, setIsLightTheme] = useState(
    () => localStorage.getItem(TERMINAL_COLOR_MODE_STORAGE_KEY) === "light"
  );
  const historyIndexRef = useRef(-1);
  const forceInputValueUpdateToggleRef = useRef(false);

  const isCommandRunning = terminalSessionStore.status !== "idle";

  const toggleTheme = useCallback(() => {
    const nextIsLightTheme = !isLightTheme;
    localStorage.setItem(TERMINAL_COLOR_MODE_STORAGE_KEY, nextIsLightTheme ? "light" : "dark");
    setIsLightTheme(nextIsLightTheme);
  }, [isLightTheme]);

  const handleCommandSubmit = useCallback(
    (command: string) => {
      historyIndexRef.current = -1;
      const settings = loadTerminalCmdRunSettings();
      terminalSessionStore.handleRunCommand(
        command,
        settings ? { kwarg: settings.kwargs, ttl: settings.ttlSeconds } : undefined
      );
    },
    [terminalSessionStore]
  );

  const updateCursorOverlay = useCallback(() => {
    requestAnimationFrame(() => {
      const wrapper = terminalWrapperRef.current;
      const terminalBody = terminalBodyRef.current;
      const scrollContainer = wrapper?.querySelector<HTMLElement>(".react-terminal");
      const activeLine = wrapper?.querySelector<HTMLElement>(".react-terminal-active-input");
      const hiddenInput = wrapper?.querySelector<HTMLInputElement>(".terminal-hidden-input");

      if (!terminalBody || !scrollContainer || !activeLine || !hiddenInput) {
        setCursorOverlayRect(null);
        return;
      }

      const textNode = activeLine.firstChild;
      const textLength =
        textNode?.nodeType === Node.TEXT_NODE ? (textNode.textContent?.length ?? 0) : 0;

      const measureCaretPoint = (): { top: number; left: number; height: number } => {
        if (textNode?.nodeType !== Node.TEXT_NODE || textLength === 0) {
          const nativeCursor = activeLine.querySelector<HTMLElement>(".cursor");
          const rect = nativeCursor?.getBoundingClientRect() ?? activeLine.getBoundingClientRect();
          return { top: rect.top, left: rect.left, height: rect.height };
        }

        const caretIndex = Math.min(hiddenInput.selectionStart ?? textLength, textLength);
        const range = document.createRange();

        if (caretIndex < textLength) {
          range.setStart(textNode, caretIndex);
          range.setEnd(textNode, caretIndex + 1);
          const rect = range.getClientRects()[0] ?? range.getBoundingClientRect();
          return { top: rect.top, left: rect.left, height: rect.height };
        }

        range.setStart(textNode, caretIndex - 1);
        range.setEnd(textNode, caretIndex);
        const rects = range.getClientRects();
        const rect = rects[rects.length - 1] ?? range.getBoundingClientRect();
        return { top: rect.top, left: rect.right, height: rect.height };
      };

      let caretPoint = measureCaretPoint();

      const containerRect = scrollContainer.getBoundingClientRect();
      if (caretPoint.top < containerRect.top) {
        scrollContainer.scrollTop -= containerRect.top - caretPoint.top + CURSOR_SCROLL_MARGIN;
        caretPoint = measureCaretPoint();
      } else if (caretPoint.top + caretPoint.height > containerRect.bottom) {
        scrollContainer.scrollTop +=
          caretPoint.top + caretPoint.height - containerRect.bottom + CURSOR_SCROLL_MARGIN;
        caretPoint = measureCaretPoint();
      }

      const bodyRect = terminalBody.getBoundingClientRect();
      setCursorOverlayRect({
        top: caretPoint.top - bodyRect.top,
        left: caretPoint.left - bodyRect.left,
        height: caretPoint.height || 16,
      });
    });
  }, []);

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
    if (!terminalWrapper || isCommandRunning || isSettingsOpen) {
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

      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "Home" ||
        event.key === "End"
      ) {
        updateCursorOverlay();
      }

      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1) {
        historyIndexRef.current = -1;
      }
    };

    terminalWrapper.addEventListener("keydown", handleIdleKeyDown);
    return () => {
      terminalWrapper.removeEventListener("keydown", handleIdleKeyDown);
    };
  }, [
    isCommandRunning,
    isSettingsOpen,
    recallHistory,
    updateCursorOverlay,
    setTerminalInputValue,
    terminalSessionStore,
  ]);

  useEffect(() => {
    const terminalWrapper = terminalWrapperRef.current;
    if (!terminalWrapper) {
      return;
    }

    if (isCommandRunning || isSettingsOpen) {
      setCursorOverlayRect(null);
      return;
    }

    const scrollContainer = terminalWrapper.querySelector<HTMLElement>(".react-terminal");
    if (!scrollContainer) {
      return;
    }

    updateCursorOverlay();

    const observer = new MutationObserver(() => {
      updateCursorOverlay();
    });
    observer.observe(scrollContainer, { childList: true, characterData: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [isCommandRunning, isSettingsOpen, updateCursorOverlay]);

  const handleRunningKeyDown = useMemo(() => {
    if (!isCommandRunning || !isTabActive || isSettingsOpen) {
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
  }, [isCommandRunning, isSettingsOpen, isTabActive, terminalSessionStore]);

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
    if (!isTabActive || isCommandRunning || isSettingsOpen || document.getSelection()?.toString()) {
      return;
    }
    terminalWrapperRef.current
      ?.querySelector<HTMLInputElement>(".terminal-hidden-input")
      ?.focus({ preventScroll: true });
  }, [isCommandRunning, isSettingsOpen, isTabActive]);

  return {
    terminalSessionStore,
    terminalWrapperRef,
    terminalBodyRef,
    startingInputValue,
    handleCommandSubmit,
    isLightTheme,
    toggleTheme,
    isCommandRunning,
    cursorOverlayRect,
  };
}
