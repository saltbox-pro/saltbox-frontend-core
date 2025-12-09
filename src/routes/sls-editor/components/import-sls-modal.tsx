import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Modal, message } from "antd";
import { PaginationState, createColumnHelper } from "@tanstack/react-table";
import { TaskTemplateShortSchema } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated } from "@saltbox/saltbox-frontend-common";
import { apiCoreStore } from "saltbox-core/store";

import styles from "./import-sls-modal.module.css";

interface ImportSlsModalProps {
  open: boolean;
  onCancel: () => void;
  onImport: (slsContent: string) => void;
}

const TaskTemplatesTable = FastTablePaginated<TaskTemplateShortSchema>;
const columnHelper = createColumnHelper<TaskTemplateShortSchema>();

export const ImportSlsModal = observer(
  ({ open, onCancel, onImport }: ImportSlsModalProps) => {
    const [templates, setTemplates] = useState<TaskTemplateShortSchema[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });

    const columns = [
      columnHelper.accessor("title", {
        header: "Title",
      }),
      columnHelper.accessor("name", {
        header: "Name",
      }),
    ];

    useEffect(() => {
      if (open) {
        setPagination({ pageIndex: 0, pageSize: 10 });
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
        const response = await apiCoreStore.taskTemplatesApi?.taskTemplatesList(
          {
            limit: pagination.pageSize,
            skip: pagination.pageIndex * pagination.pageSize,
          }
        );
        if (response?.data) {
          setTemplates(response.data);
          setTotal(response.total || 0);
        }
      } catch (error) {
        console.error("Failed to load templates:", error);
        message.error("Failed to load templates");
      } finally {
        setLoading(false);
      }
    };

    const handleRowClick = async (template: TaskTemplateShortSchema) => {
      try {
        const fullTemplate =
          await apiCoreStore.taskTemplatesApi?.taskTemplateRetrieve({
            tpl_id: template.id,
          });

        if (fullTemplate?.sls_content) {
          onImport(fullTemplate.sls_content);
          message.success("Template imported successfully");
          onCancel();
        } else {
          message.error("Template has no SLS content");
        }
      } catch (error) {
        console.error("Failed to import template:", error);
        message.error("Failed to import template");
      }
    };

    const handleLazyLoad = (newPagination: PaginationState) => {
      setPagination(newPagination);
    };

    return (
      <Modal
        title="Import SLS from Template"
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
  }
);
