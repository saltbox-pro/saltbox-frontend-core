import { FastTableListed, Modal } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, Flex, Input, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { isValidLocaleCode } from "../lib/template-i18n";

import { TranslationDeleteCell } from "./translation-delete-cell";
import {
  TranslationDraftContext,
  type TranslationDraftContextValue,
} from "./translation-draft-context";
import styles from "./translation-edit-modal.module.css";
import { TranslationTextCell } from "./translation-text-cell";

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

const columnHelper = createColumnHelper<LocaleRow>();

export const TranslationEditModal = ({
  open,
  translationKey,
  locales,
  values,
  onSubmit,
  onCancel,
}: TranslationEditModalProps) => {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();
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

  const handleRemoveLocale = useCallback((locale: string) => {
    setRowLocales((prev) => prev.filter((item) => item !== locale));
    setDraft((prev) => ({ ...prev, [locale]: "" }));
  }, []);

  const confirmRemoveLocale = useCallback(
    (locale: string) => {
      modalApi.confirm({
        title: t("task-template-editor.translations-remove-locale-confirm-title"),
        icon: null,
        content: t("task-template-editor.translations-remove-locale-confirm-content", { locale }),
        okText: t("common.delete"),
        cancelText: t("common.cancel"),
        okButtonProps: { danger: true },
        onOk: () => handleRemoveLocale(locale),
      });
    },
    [handleRemoveLocale, modalApi, t]
  );

  const handleDraftChange = useCallback((locale: string, value: string) => {
    setDraft((prev) => ({ ...prev, [locale]: value }));
  }, []);

  const draftContext = useMemo(
    () => ({ values: draft, onChange: handleDraftChange }),
    [draft, handleDraftChange]
  ) satisfies TranslationDraftContextValue;

  const columns = useMemo(
    () => [
      columnHelper.accessor("locale", {
        header: t("task-template-editor.translations-column-locale"),
        enableSorting: false,
        cell: (info) => <code className={styles.locale}>{info.getValue()}</code>,
        meta: {
          ellipsis: false,
          width: "15%",
        },
      }),
      columnHelper.display({
        id: "value",
        header: t("task-template-editor.translations-column-text"),
        enableSorting: false,
        cell: (info) => <TranslationTextCell locale={info.row.original.locale} />,
        meta: {
          ellipsis: false,
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        enableSorting: false,
        cell: (info) => (
          <TranslationDeleteCell locale={info.row.original.locale} onDelete={confirmRemoveLocale} />
        ),
        meta: {
          ellipsis: false,
          width: 32,
          minWidth: 32,
        },
      }),
    ],
    [confirmRemoveLocale, t]
  );

  const data = useMemo(() => rowLocales.map((locale) => ({ locale })), [rowLocales]);

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
      {modalContextHolder}
      <TranslationDraftContext.Provider value={draftContext}>
        <FastTableListed<LocaleRow>
          tableId="core-task-template-editor-translation-edit"
          columns={columns}
          data={data}
          getRowId={(row) => row.locale}
          isEmpty={data.length === 0}
          hideFooter
        />
      </TranslationDraftContext.Provider>

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
