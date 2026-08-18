import { Spin } from "antd";
import { useTranslation } from "react-i18next";

import type { FunctionTooltipData } from "../helpers/function-tooltip";

import styles from "./function-template-tooltip.module.css";

export type FunctionTemplateTooltipProps = {
  displayName: string;
  isLoading: boolean;
  data?: FunctionTooltipData;
};

export function FunctionTemplateTooltip({
  displayName,
  isLoading,
  data,
}: FunctionTemplateTooltipProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className={styles.spinnerContainer}>
        <Spin />
      </div>
    );
  }

  if (!data) {
    return <span>{displayName}</span>;
  }

  if (data.isLoadError) {
    return <span>{t("job-function-select.error")}</span>;
  }

  return (
    <div className={styles.tooltipContent} onWheel={(event) => event.stopPropagation()}>
      <div className={styles.tooltipTitle}>{data.name}</div>

      {data.description && (
        <div className={styles.tooltipSection}>
          <div className={styles.tooltipSectionTitle}>
            {t("job-function-select.tooltip-description")}
          </div>
          <div className={styles.tooltipDescription}>{data.description}</div>
        </div>
      )}

      {data.arguments.length > 0 && (
        <div className={styles.tooltipSection}>
          <div className={styles.tooltipSectionTitle}>
            {t("job-function-select.tooltip-arguments")}
          </div>
          <div className={styles.tooltipArguments}>
            {data.arguments.map((argument) => (
              <div key={argument.name} className={styles.tooltipArgument}>
                <div className={styles.tooltipArgumentHead}>
                  <span className={styles.tooltipArgumentName}>{argument.name}</span>
                  {argument.required && <span className={styles.tooltipArgumentRequired}>*</span>}
                  {argument.type && (
                    <span className={styles.tooltipArgumentType}>{argument.type}</span>
                  )}
                </div>
                {argument.description && (
                  <div className={styles.tooltipArgumentDescription}>{argument.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.example && (
        <div className={styles.tooltipSection}>
          <div className={styles.tooltipSectionTitle}>
            {t("job-function-select.tooltip-example")}
          </div>
          <pre className={styles.tooltipExample}>{data.example}</pre>
        </div>
      )}
    </div>
  );
}
