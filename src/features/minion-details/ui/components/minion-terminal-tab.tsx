import { MoonOutlined, SettingOutlined, SunOutlined } from "@ant-design/icons";
import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { Badge, Button, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import Terminal, { ColorMode, TerminalInput, TerminalOutput } from "react-terminal-ui";

import type { TerminalLineKind } from "saltbox-core/store";

import { useMinionTerminal } from "../../hooks/use-minion-terminal";
import { useTerminalCmdSettings } from "../../hooks/use-terminal-cmd-settings";

import { MinionTerminalSettings } from "./minion-terminal-settings";
import styles from "./minion-terminal-tab.module.css";

interface MinionTerminalTabProps {
  minion: MinionDetailSchema;
  isTabActive: boolean;
}

const HiddenTopButtonsPanel = () => null;

const lineKindClassNames: Partial<Record<TerminalLineKind, string>> = {
  error: styles.errorLine,
  info: styles.infoLine,
};

export const MinionTerminalTab = observer(function MinionTerminalTab({
  minion,
  isTabActive,
}: MinionTerminalTabProps) {
  const { t } = useTranslation();
  const cmdSettings = useTerminalCmdSettings();
  const {
    terminalSessionStore,
    terminalWrapperRef,
    startingInputValue,
    handleCommandSubmit,
    isLightTheme,
    toggleTheme,
    isCommandRunning,
  } = useMinionTerminal(minion, isTabActive, cmdSettings.isOpen);

  return (
    <div
      ref={terminalWrapperRef}
      className={`${styles.terminalTab} ${isLightTheme ? styles.terminalTabLight : ""}`}
    >
      <div className={styles.terminalTopBar}>
        <Tooltip
          title={t(
            cmdSettings.hasSavedParams
              ? "terminal.settings-params-set-tooltip"
              : "terminal.settings-tooltip"
          )}
        >
          <Badge
            dot={cmdSettings.hasSavedParams}
            offset={[-4, 4]}
            classNames={{ indicator: styles.settingsBadgeDot }}
          >
            <Button
              size="small"
              className={styles.topBarButton}
              icon={<SettingOutlined />}
              onClick={cmdSettings.toggleSettings}
            />
          </Badge>
        </Tooltip>
        <Button
          size="small"
          className={styles.topBarButton}
          icon={isLightTheme ? <MoonOutlined /> : <SunOutlined />}
          title={t("terminal.toggle-theme")}
          onClick={toggleTheme}
        />
      </div>
      <div className={styles.terminalBody}>
        <Terminal
          colorMode={isLightTheme ? ColorMode.Light : ColorMode.Dark}
          height="100%"
          prompt="#"
          onInput={isCommandRunning || cmdSettings.isOpen ? null : handleCommandSubmit}
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
        {cmdSettings.isOpen && <MinionTerminalSettings settings={cmdSettings} />}
      </div>
    </div>
  );
});
