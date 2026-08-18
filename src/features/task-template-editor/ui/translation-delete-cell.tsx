import { DeleteOutlined } from "@ant-design/icons";
import { BaseActionButton } from "@saltbox/saltbox-frontend-common";
import { memo } from "react";
import { useTranslation } from "react-i18next";

import { BASE_TEMPLATE_LOCALES } from "../lib/template-i18n";

interface TranslationDeleteCellProps {
  locale: string;
  onDelete: (locale: string) => void;
}

export const TranslationDeleteCell = memo(function TranslationDeleteCell({
  locale,
  onDelete,
}: TranslationDeleteCellProps) {
  const { t } = useTranslation();

  if (BASE_TEMPLATE_LOCALES.includes(locale)) {
    return null;
  }

  return (
    <BaseActionButton
      color="danger"
      icon={<DeleteOutlined />}
      title={t("task-template-editor.translations-remove-locale")}
      onClick={() => onDelete(locale)}
    />
  );
});
