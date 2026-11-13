import { DownloadOutlined } from "@ant-design/icons";
import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { Button, Tooltip } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ExtraDataImportModal } from "./extra-data-import-modal";

export interface ExtraDataImportButtonProps {
  category: ExtraDataCategoryModel;
  collectionSlug: string;
  onSuccess?: () => void;
}

export function ExtraDataImportButton({
  category,
  collectionSlug,
  onSuccess,
}: ExtraDataImportButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const title = t("minions.extra-data.import.button");

  return (
    <>
      <Tooltip title={title}>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => setOpen(true)}
          aria-label={title}
        />
      </Tooltip>

      {open && (
        <ExtraDataImportModal
          category={category}
          collectionSlug={collectionSlug}
          onClose={() => setOpen(false)}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}
