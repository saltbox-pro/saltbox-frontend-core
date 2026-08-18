import { InfoCircleOutlined } from "@ant-design/icons";
import { Tag, Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import { getFunctionDisplayName } from "../helpers/template-kind";
import { useFunctionSchemaTooltip } from "../hooks/use-function-schema-tooltip";

import { FunctionTemplateTooltip } from "./function-template-tooltip";
import tooltipStyles from "./function-template-tooltip.module.css";
import styles from "./template-picker-modal.module.css";

export type FunctionTemplateBadgeProps = {
  fun: string;
};

export function FunctionTemplateBadge({ fun }: FunctionTemplateBadgeProps) {
  const { t } = useTranslation();
  const { data, isLoading, load } = useFunctionSchemaTooltip(fun);

  return (
    <span className={styles.commandBadge}>
      <Tag color="processing" className={styles.commandTag}>
        {t("template-picker.command-tag")}
      </Tag>

      <Tooltip
        title={
          <FunctionTemplateTooltip
            displayName={getFunctionDisplayName(fun)}
            isLoading={isLoading}
            data={data}
          />
        }
        mouseEnterDelay={0.45}
        onOpenChange={(isTooltipOpen) => {
          if (isTooltipOpen) {
            load();
          }
        }}
        classNames={{ root: tooltipStyles.tooltip }}
        destroyOnHidden
      >
        <InfoCircleOutlined
          className={styles.commandInfoIcon}
          aria-label={t("template-picker.function-schema-hint")}
          onClick={(event) => event.stopPropagation()}
        />
      </Tooltip>
    </span>
  );
}
