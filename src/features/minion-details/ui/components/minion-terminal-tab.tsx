import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import Terminal, { ColorMode, TerminalInput, TerminalOutput } from "react-terminal-ui";

import type { TerminalLineKind } from "saltbox-core/store";

import { useMinionTerminal } from "../../hooks/use-minion-terminal";

import styles from "./minion-terminal-tab.module.css";

interface MinionTerminalTabProps {
  minion: MinionDetailSchema;
  isTabActive: boolean;
}

const HiddenTopButtonsPanel = () => null;

export const MinionTerminalTab = observer(function MinionTerminalTab({
  minion,
  isTabActive,
}: MinionTerminalTabProps) {
  const { t } = useTranslation();
  const { terminalSessionStore, terminalWrapperRef, startingInputValue, handleCommandSubmit } =
    useMinionTerminal(minion, isTabActive);

  const isCommandRunning = terminalSessionStore.status !== "idle";

  const lineKindClassNames: Partial<Record<TerminalLineKind, string>> = {
    error: styles.errorLine,
    info: styles.infoLine,
  };

  return (
    <div ref={terminalWrapperRef} className={styles.terminalTab}>
      <Terminal
        colorMode={ColorMode.Dark}
        height="100%"
        prompt="#"
        onInput={isCommandRunning ? null : handleCommandSubmit}
        startingInputValue={startingInputValue}
        TopButtonsPanel={HiddenTopButtonsPanel}
      >
        {terminalSessionStore.screenLines.map((line) =>
          line.kind === "input" ? (
            <TerminalInput key={line.id}>{line.text}</TerminalInput>
          ) : (
            <TerminalOutput key={line.id}>
              <span className={lineKindClassNames[line.kind]}>
                {line.localeKey ? t(line.localeKey, line.localeParams) : (line.text ?? "")}
              </span>
            </TerminalOutput>
          )
        )}
        {isCommandRunning && (
          <TerminalOutput key="terminal-busy">
            <span className={styles.executingLine}>
              {t(
                terminalSessionStore.status === "interrupting"
                  ? "terminal.interrupting"
                  : "terminal.executing"
              )}
            </span>
          </TerminalOutput>
        )}
      </Terminal>
    </div>
  );
});
