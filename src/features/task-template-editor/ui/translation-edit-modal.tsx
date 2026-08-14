import { DeleteOutlined } from "@ant-design/icons";
import { Button, Flex, Input, Modal, Table, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { BASE_TEMPLATE_LOCALES, isValidLocaleCode } from "../lib/template-i18n";

import styles from "./translation-edit-modal.module.css";

interface TranslationEditModalProps {
  open: boolean;
  translationKey: string | null;
  locales: string[];
  values: Record<string, string>;
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
}

interface LocaleRow {
  locale: string;
}

export const TranslationEditModal = ({
  open,
  translationKey,
  locales,
  values,
  onSubmit,
  onCancel,
}: TranslationEditModalProps) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [rowLocales, setRowLocales] = useState<string[]>([]);
  const [newLocale, setNewLocale] = useState("");
  const [localeError, setLocaleError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setDraft({ ...values });
    setRowLocales(locales);
    setNewLocale("");
    setLocaleError(null);
    // Диалог заполняется один раз на открытие: дальше правки живут в черновике
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, translationKey]);

  const handleAddLocale = () => {
    const locale = newLocale.trim().toLowerCase();

    if (!isValidLocaleCode(locale)) {
      setLocaleError(t("task-template-editor.translations-locale-invalid"));
      return;
    }
    if (rowLocales.includes(locale)) {
      setLocaleError(t("task-template-editor.translations-locale-duplicate"));
      return;
    }

    setRowLocales((prev) => [...prev, locale]);
    setDraft((prev) => ({ ...prev, [locale]: "" }));
    setNewLocale("");
    setLocaleError(null);
  };

  const handleRemoveLocale = (locale: string) => {
    setRowLocales((prev) => prev.filter((item) => item !== locale));
    setDraft((prev) => ({ ...prev, [locale]: "" }));
  };

  const columns = useMemo<ColumnsType<LocaleRow>>(
    () => [
      {
        title: t("task-template-editor.translations-column-locale"),
        dataIndex: "locale",
        key: "locale",
        width: 110,
        render: (_, row) => <code className={styles.locale}>{row.locale}</code>,
      },
      {
        title: t("task-template-editor.translations-column-text"),
        dataIndex: "value",
        key: "value",
        render: (_, row) => (
          <Input.TextArea
            value={draft[row.locale] ?? ""}
            autoSize={{ minRows: 1, maxRows: 6 }}
            placeholder={t("task-template-editor.translations-text-placeholder")}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, [row.locale]: event.target.value }))
            }
          />
        ),
      },
      {
        key: "actions",
        width: 48,
        render: (_, row) =>
          BASE_TEMPLATE_LOCALES.includes(row.locale) ? null : (
            <Tooltip title={t("task-template-editor.translations-remove-locale")}>
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveLocale(row.locale)}
              />
            </Tooltip>
          ),
      },
    ],
    [draft, t]
  );

  const dataSource = useMemo(() => rowLocales.map((locale) => ({ locale })), [rowLocales]);

  return (
    <Modal
      title={
        <span>
          {t("task-template-editor.translations-modal-title")}{" "}
          <Typography.Text code>{translationKey}</Typography.Text>
        </span>
      }
      open={open}
      width={720}
      onCancel={onCancel}
      onOk={() => onSubmit(draft)}
      okText={t("common.save")}
      cancelText={t("common.cancel")}
      destroyOnHidden
    >
      <Table<LocaleRow>
        rowKey="locale"
        size="small"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
      />

      <Flex gap="small" align="flex-start" className={styles.addLocale}>
        <div className={styles.addLocaleField}>
          <Input
            value={newLocale}
            status={localeError ? "error" : undefined}
            placeholder={t("task-template-editor.translations-locale-placeholder")}
            onChange={(event) => {
              setNewLocale(event.target.value);
              setLocaleError(null);
            }}
            onPressEnter={handleAddLocale}
          />
          {localeError && (
            <Typography.Text type="danger" className={styles.localeError}>
              {localeError}
            </Typography.Text>
          )}
        </div>
        <Button onClick={handleAddLocale} disabled={!newLocale.trim()}>
          {t("task-template-editor.translations-add-locale")}
        </Button>
      </Flex>
    </Modal>
  );
};
