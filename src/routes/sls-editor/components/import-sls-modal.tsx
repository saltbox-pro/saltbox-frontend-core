import { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { FastTableListed, isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Modal, message } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiCoreStore } from "saltbox-core/store";

import styles from "./import-sls-modal.module.css";

interface ImportSlsModalProps {
  open: boolean;
  onCancel: () => void;
  onImport: (slsContent: string) => void;
}

const TaskTemplatesTable = FastTableListed<TaskTemplatePublicSchema>;
const columnHelper = createColumnHelper<TaskTemplatePublicSchema>();

export const ImportSlsModal = observer(({ open, onCancel, onImport }: ImportSlsModalProps) => {
  const { t } = useTranslation();
  const [modal, modalContextHolder] = Modal.useModal();
  const [templates, setTemplates] = useState<TaskTemplatePublicSchema[]>([]);
  const [loading, setLoading] = useState(false);

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: t("sls-editor.import-column-title"),
      }),
      columnHelper.accessor("name", {
        header: t("sls-editor.import-column-name"),
      }),
    ],
    [t]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const loadTemplates = async () => {
      setLoading(true);

      try {
        const response = await apiCoreStore.taskTemplateSourcesApi?.templateSourceList({
          TemplateSourceListBody: {},
        });

        setTemplates((response?.data ?? []).flatMap((source) => source.templates ?? []));
      } catch (error) {
        console.error("Failed to load templates:", error);
        if (isGlobalServerError(error)) return;
        message.error(t("sls-editor.import-load-failed"));
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [open, t]);

  const handleRowClick = (template: TaskTemplatePublicSchema) => {
    const performImport = async () => {
      try {
        const fullTemplate = await apiCoreStore.taskTemplatesApi?.taskTemplateRead({
          source_id: template.source_id,
          template_id: template.id,
        });

        if (fullTemplate?.sls_content) {
          onImport(fullTemplate.sls_content);
          message.success(t("sls-editor.import-success"));
          onCancel();
        } else {
          message.error(t("sls-editor.import-empty-sls"));
        }
      } catch (error) {
        console.error("Failed to import template:", error);
        if (isGlobalServerError(error)) return;
        message.error(t("sls-editor.import-failed"));
      }
    };

    modal.confirm({
      title: t("sls-editor.import-confirm-title"),
      content: t("sls-editor.import-confirm-description"),
      okText: t("sls-editor.import-confirm-ok"),
      cancelText: t("sls-editor.import-confirm-cancel"),
      onOk: performImport,
    });
  };

  return (
    <Modal
      title={t("sls-editor.import-modal-title")}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      {modalContextHolder}
      <div className={styles.modalContent}>
        <TaskTemplatesTable
          columns={columns}
          getRowId={(row) => row.id}
          data={templates}
          total={templates.length}
          isLoading={loading}
          isEmpty={!loading && templates.length === 0}
          onRowClick={handleRowClick}
        />
      </div>
    </Modal>
  );
});
