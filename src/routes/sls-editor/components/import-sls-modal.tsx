import { TaskTemplateShortSchema } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated } from "@saltbox/saltbox-frontend-common";
import { PaginationState, createColumnHelper } from "@tanstack/react-table";
import { Modal, message } from "antd";
import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { apiCoreStore } from "saltbox-core/store";

import styles from "./import-sls-modal.module.css";

interface ImportSlsModalProps {
  open: boolean;
  onCancel: () => void;
  onImport: (slsContent: string) => void;
}

const TaskTemplatesTable = FastTablePaginated<TaskTemplateShortSchema>;
const columnHelper = createColumnHelper<TaskTemplateShortSchema>();

export const ImportSlsModal = observer(({ open, onCancel, onImport }: ImportSlsModalProps) => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<TaskTemplateShortSchema[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const columns = [
    columnHelper.accessor("title", {
      header: t("sls-editor.import-column-title"),
    }),
    columnHelper.accessor("name", {
      header: t("sls-editor.import-column-name"),
    }),
  ];

  useEffect(() => {
    if (open) {
      setPagination({ pageIndex: 0, pageSize: 50 });
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [pagination, open]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await apiCoreStore.taskTemplatesApi?.taskTemplatesList({
        TaskTemplateListBody: {
          limit: pagination.pageSize,
          skip: pagination.pageIndex * pagination.pageSize,
        },
      });
      if (response?.data) {
        setTemplates(response.data);
        setTotal(response.total || 0);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
      message.error(t("sls-editor.import-load-failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (template: TaskTemplateShortSchema) => {
    const performImport = async () => {
      try {
        const fullTemplate = await apiCoreStore.taskTemplatesApi?.taskTemplateRetrieve({
          tpl_id: template.id,
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
        message.error(t("sls-editor.import-failed"));
      }
    };

    Modal.confirm({
      title: t("sls-editor.import-confirm-title"),
      content: t("sls-editor.import-confirm-description"),
      okText: t("sls-editor.import-confirm-ok"),
      cancelText: t("sls-editor.import-confirm-cancel"),
      onOk: performImport,
    });
  };

  const handleLazyLoad = (newPagination: PaginationState) => {
    setPagination(newPagination);
  };

  return (
    <Modal
      title={t("sls-editor.import-modal-title")}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <div className={styles.modalContent}>
        <TaskTemplatesTable
          columns={columns}
          getRowId={(row) => row.id}
          data={templates}
          total={total}
          isLoading={loading}
          pagination={pagination}
          onRowClick={handleRowClick}
          onLazyLoad={handleLazyLoad}
        />
      </div>
    </Modal>
  );
});
