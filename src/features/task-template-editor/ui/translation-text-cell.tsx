import { Input } from "antd";
import { memo, useContext } from "react";
import { useTranslation } from "react-i18next";

import { TranslationDraftContext } from "./translation-draft-context";

interface TranslationTextCellProps {
  locale: string;
}

export const TranslationTextCell = memo(function TranslationTextCell({
  locale,
}: TranslationTextCellProps) {
  const draft = useContext(TranslationDraftContext);
  const { t } = useTranslation();

  if (!draft) {
    throw new Error("TranslationTextCell must be used inside TranslationDraftContext.Provider");
  }

  return (
    <Input.TextArea
      value={draft.values[locale] ?? ""}
      autoSize={{ minRows: 1, maxRows: 6 }}
      placeholder={t("task-template-editor.translations-text-placeholder")}
      onChange={(event) => draft.onChange(locale, event.target.value)}
    />
  );
});
