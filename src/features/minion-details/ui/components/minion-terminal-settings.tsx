import { JsonForm } from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Flex, InputNumber, Select, Spin, Typography } from "antd";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import type { TerminalCmdSettingsController } from "../../hooks/use-terminal-cmd-settings";

import styles from "./minion-terminal-settings.module.css";

type MinionTerminalSettingsProps = {
  settings: TerminalCmdSettingsController;
};

export function MinionTerminalSettings({ settings }: MinionTerminalSettingsProps) {
  const { t } = useTranslation();
  const {
    isSchemaLoading,
    hasSchemaLoadError,
    schemaLayout,
    ttlValue,
    setTtlValue,
    ttlUnit,
    setTtlUnit,
    ttlPlaceholder,
    handleTtlInputKeyDown,
    handleTtlInputPaste,
    jsonFormValue,
    setJsonFormValue,
    jsonFormRef,
    overlayRef,
    closeSettings,
    saveSettings,
    resetFields,
    retrySchemaLoad,
  } = settings;

  return (
    <div ref={overlayRef} className={styles.settingsOverlay}>
      <Typography.Text strong>{t("terminal.settings-title")}</Typography.Text>

      {isSchemaLoading ? (
        <div className={styles.spinnerContainer}>
          <Spin />
        </div>
      ) : (
        <div className={styles.settingsBody}>
          {hasSchemaLoadError && (
            <Alert
              type="error"
              showIcon
              message={t("job-modal.error-load-function-schema")}
              action={
                <Button size="small" onClick={retrySchemaLoad}>
                  {t("terminal.settings-retry")}
                </Button>
              }
            />
          )}

          <Flex vertical gap={8}>
            <Typography.Text>{t("job-modal.timeout-label")}</Typography.Text>
            <Flex gap={8} align="center" wrap>
              <InputNumber
                min={0}
                precision={0}
                value={ttlValue ?? undefined}
                onChange={(value) => setTtlValue(value ?? null)}
                placeholder={ttlPlaceholder}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={handleTtlInputKeyDown}
                onPaste={handleTtlInputPaste}
                autoFocus
              />
              <Select
                value={ttlUnit}
                onChange={(value) => setTtlUnit(value)}
                options={[
                  { label: t("job-modal.timeout-unit-seconds"), value: "seconds" },
                  { label: t("job-modal.timeout-unit-minutes"), value: "minutes" },
                  { label: t("job-modal.timeout-unit-hours"), value: "hours" },
                ]}
                style={{ width: 100 }}
              />
            </Flex>
          </Flex>

          {schemaLayout.displaySchema && !hasSchemaLoadError && (
            <JsonForm
              ref={jsonFormRef}
              schema={schemaLayout.displaySchema}
              uiSchema={schemaLayout.displayUiSchema}
              omitExtraData={false}
              focusOnFirstError
              id="terminal-cmd-settings-form"
              className={styles.settingsJsonForm}
              idPrefix="terminal-cmd-settings-form"
              idSeparator="-"
              formData={jsonFormValue}
              onChange={(d) => {
                setJsonFormValue((d?.formData ?? {}) as Record<string, unknown>);
              }}
            >
              <Fragment />
            </JsonForm>
          )}
        </div>
      )}

      <Flex justify="space-between" gap={8}>
        <Button onClick={resetFields} disabled={isSchemaLoading}>
          {t("terminal.settings-reset")}
        </Button>
        <Flex gap={8}>
          <Button onClick={closeSettings}>{t("terminal.settings-cancel")}</Button>
          <Button type="primary" onClick={saveSettings} disabled={isSchemaLoading}>
            {t("terminal.settings-save")}
          </Button>
        </Flex>
      </Flex>
    </div>
  );
}
