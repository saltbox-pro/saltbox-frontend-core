import { DownloadOutlined } from "@ant-design/icons";
import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { Button, Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import { useExtraDataExport } from "../hooks/use-extra-data-export";

import styles from "./extra-data-export-button.module.css";
import { ExtraDataExportModal } from "./extra-data-export-modal";

export interface ExtraDataExportButtonProps {
  category: ExtraDataCategoryModel;
  collectionSlug: string;
  minionId?: string;
  search: string;
}

export function ExtraDataExportButton({
  category,
  collectionSlug,
  minionId,
  search,
}: ExtraDataExportButtonProps) {
  const { t } = useTranslation();

  const exportState = useExtraDataExport({ category, collectionSlug, minionId, search });

  return (
    <>
      <Tooltip title={t("minions.extra-data.download-to-csv")}>
        <span className={styles.anchor}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={exportState.isExporting}
            onClick={exportState.openModal}
          />
        </span>
      </Tooltip>

      <ExtraDataExportModal
        open={exportState.isOpen}
        warning={exportState.warning}
        onCancel={exportState.closeModal}
        onConfirm={exportState.handleExport}
      />
    </>
  );
}
