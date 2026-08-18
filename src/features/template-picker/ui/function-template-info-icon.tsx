import { InfoCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import { getFunctionDisplayName } from "../helpers/template-kind";
import { useTemplateSchemaTooltip } from "../hooks/use-template-schema-tooltip";
import type { TaskTemplatePickerItem } from "../type/types";

import { FunctionTemplateTooltip } from "./function-template-tooltip";
import tooltipStyles from "./function-template-tooltip.module.css";
import styles from "./template-picker-modal.module.css";

export type FunctionTemplateInfoIconProps = {
  template: TaskTemplatePickerItem;
};

export function FunctionTemplateInfoIcon({ template }: FunctionTemplateInfoIconProps) {
  const { t } = useTranslation();
  const { fun } = template;
  const { data, isLoading, load } = useTemplateSchemaTooltip({
    sourceId: template.source_id,
    templateId: template.id,
    fun,
  });

  return (
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
  );
}
