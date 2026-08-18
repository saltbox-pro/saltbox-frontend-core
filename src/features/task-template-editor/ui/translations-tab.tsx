import { FastTableListed } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Alert, Tag, Tooltip, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { TranslationRow } from "../lib/template-i18n";
import type { TemplateEditorStore } from "../model/template-editor-store";

import { TranslationEditModal } from "./translation-edit-modal";
import styles from "./translations-tab.module.css";

interface TranslationsTabProps {
  store: TemplateEditorStore;
}

const columnHelper = createColumnHelper<TranslationRow>();

export const TranslationsTab = observer(({ store }: TranslationsTabProps) => {
  const { t } = useTranslation();
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const rows = store.translationRows;
  const locales = store.translationLocales;

  const columns = useMemo(
    () => [
      columnHelper.accessor("key", {
        header: t("task-template-editor.translations-column-key"),
        enableSorting: false,
        cell: (info) => {
          const row = info.row.original;
          return (
            <span className={styles.keyCell}>
              <code>{row.key}</code>
              {row.isOrphan && (
                <Tooltip title={t("task-template-editor.translations-orphan-hint")}>
                  <Tag color="warning">{t("task-template-editor.translations-orphan")}</Tag>
                </Tooltip>
              )}
            </span>
          );
        },
      }),
    ],
    [t]
  );

  if (store.hasMetaError) {
    return (
      <div className={styles.stateWrapper}>
        <Alert
          type="error"
          showIcon
          message={t("task-template-editor.schema-parse-error")}
          description={store.metaError ?? undefined}
        />
      </div>
    );
  }

  const editingRow = rows.find((row) => row.key === editingKey);

  return (
    <div className={styles.container}>
      <Typography.Title level={5} className={styles.title}>
        {t("task-template-editor.translations-title")}
      </Typography.Title>

      <FastTableListed<TranslationRow>
        tableId="core-task-template-editor-translations"
        columns={columns}
        data={rows}
        getRowId={(row) => row.key}
        isEmpty={rows.length === 0}
        hideFooter
        enableColumnResize={false}
        activeRowId={editingKey}
        onRowClick={(row) => setEditingKey(row.key)}
        locale={{ empty: t("task-template-editor.translations-empty") }}
      />

      <TranslationEditModal
        open={editingRow !== undefined}
        translationKey={editingKey}
        locales={locales}
        values={editingRow?.values ?? {}}
        onCancel={() => setEditingKey(null)}
        onSubmit={(values) => {
          if (editingKey) {
            store.setTranslations(editingKey, values);
          }
          setEditingKey(null);
        }}
      />
    </div>
  );
});
