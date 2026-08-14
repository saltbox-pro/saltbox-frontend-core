import { Alert, Empty, Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
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

export const TranslationsTab = observer(({ store }: TranslationsTabProps) => {
  const { t } = useTranslation();
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const rows = store.translationRows;
  const locales = store.translationLocales;

  const columns = useMemo<ColumnsType<TranslationRow>>(
    () => [
      {
        title: t("task-template-editor.translations-column-key"),
        dataIndex: "key",
        key: "key",
        width: 240,
        fixed: "left",
        render: (_, row) => (
          <span className={styles.keyCell}>
            <code>{row.key}</code>
            {row.isOrphan && (
              <Tooltip title={t("task-template-editor.translations-orphan-hint")}>
                <Tag color="warning">{t("task-template-editor.translations-orphan")}</Tag>
              </Tooltip>
            )}
          </span>
        ),
      },
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

      {rows.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("task-template-editor.translations-empty")}
        />
      ) : (
        <Table<TranslationRow>
          rowKey="key"
          size="small"
          columns={columns}
          dataSource={rows}
          pagination={false}
          scroll={{ x: "max-content" }}
          rowClassName={styles.row}
          onRow={(row) => ({ onClick: () => setEditingKey(row.key) })}
        />
      )}

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
