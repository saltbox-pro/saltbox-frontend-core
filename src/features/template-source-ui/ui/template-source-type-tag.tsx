import type { SourceType } from "@saltbox/saltbox-core-api-client";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";

import { getSourceTypeColor, getSourceTypeLabelKey } from "../helpers/source-type-presentation";

export function TemplateSourceTypeTag({ sourceType }: { sourceType: SourceType }) {
  const { t } = useTranslation();

  return <Tag color={getSourceTypeColor(sourceType)}>{t(getSourceTypeLabelKey(sourceType))}</Tag>;
}
