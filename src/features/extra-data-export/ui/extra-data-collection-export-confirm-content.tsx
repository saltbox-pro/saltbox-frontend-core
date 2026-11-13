import { ExportToCsvConfirmContent } from "@saltbox/saltbox-frontend-common";
import { Radio } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  DEFAULT_EXTRA_DATA_COLLECTION_EXPORT_FORMAT,
  type ExtraDataCollectionExportFormat,
} from "../model/types";

import styles from "./extra-data-collection-export-confirm-content.module.css";

type ExtraDataCollectionExportConfirmContentProps = {
  categoryLabel: string;
  onFormatChange: (format: ExtraDataCollectionExportFormat) => void;
};

export function ExtraDataCollectionExportConfirmContent({
  categoryLabel,
  onFormatChange,
}: ExtraDataCollectionExportConfirmContentProps) {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExtraDataCollectionExportFormat>(
    DEFAULT_EXTRA_DATA_COLLECTION_EXPORT_FORMAT
  );

  useEffect(() => {
    onFormatChange(format);
  }, [format, onFormatChange]);

  const scope = t(
    format === "flat"
      ? "minions.extra-data.export-scope-collection-flat"
      : "minions.extra-data.export-scope-collection-aggregated",
    { category: categoryLabel }
  );

  return (
    <ExportToCsvConfirmContent scope={scope}>
      <div className={styles.format}>
        <div className={styles.formatLabel}>{t("minions.extra-data.export-format-label")}</div>
        <Radio.Group
          value={format}
          onChange={(event) => setFormat(event.target.value as ExtraDataCollectionExportFormat)}
        >
          <Radio value="aggregated">{t("minions.extra-data.export-format-aggregated")}</Radio>
          <Radio value="flat">{t("minions.extra-data.export-format-flat")}</Radio>
        </Radio.Group>
      </div>
    </ExportToCsvConfirmContent>
  );
}
