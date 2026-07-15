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
  const { store, wrapperRef, startingInputValue, handleInput } = useMinionTerminal(
    minion,
    isTabActive
  );

  const isBusy = store.status !== "idle";

  const lineClassNames: Partial<Record<TerminalLineKind, string>> = {
    error: styles.errorLine,
    info: styles.infoLine,
  };

  return (
    <div ref={wrapperRef} className={styles.terminalTab}>
      <Terminal
        colorMode={ColorMode.Dark}
        height="100%"
        prompt="$"
        onInput={isBusy ? null : handleInput}
        startingInputValue={startingInputValue}
        TopButtonsPanel={HiddenTopButtonsPanel}
      >
        {store.lines.map((line) =>
          line.kind === "input" ? (
            <TerminalInput key={line.id}>{line.text}</TerminalInput>
          ) : (
            <TerminalOutput key={line.id}>
              <span className={lineClassNames[line.kind]}>
                {line.localeKey ? t(line.localeKey, line.localeParams) : (line.text ?? "")}
              </span>
            </TerminalOutput>
          )
        )}
        {isBusy && (
          <TerminalOutput key="terminal-busy">
            <span className={styles.executingLine}>
              {t(store.status === "interrupting" ? "terminal.interrupting" : "terminal.executing")}
            </span>
          </TerminalOutput>
        )}
      </Terminal>
    </div>
  );
});
