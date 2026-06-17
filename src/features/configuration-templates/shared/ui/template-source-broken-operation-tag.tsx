import type { SourceOperation } from "@saltbox/saltbox-core-api-client";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";

import { getSourceOperationBrokenContextKey } from "../constants/source-operations";

export type TemplateSourceBrokenOperationTagProps = {
  currentOperation: SourceOperation | null;
};

export function TemplateSourceBrokenOperationTag({
  currentOperation,
}: TemplateSourceBrokenOperationTagProps) {
  const { t } = useTranslation();

  return (
    <Tag color="red">
      {t("configuration-templates.source.broken-operation", {
        operation: t(getSourceOperationBrokenContextKey(currentOperation)),
      })}
    </Tag>
  );
}
