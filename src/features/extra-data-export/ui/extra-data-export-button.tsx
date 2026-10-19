import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { ExportToCsv, buildCsvExportFilename, runMutation } from "@saltbox/saltbox-frontend-common";
import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { fileDownloader } from "saltbox-core/features/file-download";
import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";

import { exportExtraData } from "../api/export-extra-data";
import {
  DEFAULT_EXTRA_DATA_COLLECTION_EXPORT_FORMAT,
  type ExtraDataCollectionExportFormat,
} from "../model/types";

import { ExtraDataCollectionExportConfirmContent } from "./extra-data-collection-export-confirm-content";

export interface ExtraDataExportButtonProps {
  category: ExtraDataCategoryModel;
  collectionSlug: string;
  minionId?: string;
  search: string;
}

function getCollectionExportFallbackPrefix(
  categoryName: string,
  format: ExtraDataCollectionExportFormat
): string {
  const suffix = format === "flat" ? "per_client" : "summary";
  return `export_extra_data_${categoryName}_${suffix}`;
}

export function ExtraDataExportButton({
  category,
  collectionSlug,
  minionId,
  search,
}: ExtraDataExportButtonProps) {
  const { t, i18n } = useTranslation();
  const { t: tCommon } = useTranslation("common");
  const collectionFormatRef = useRef<ExtraDataCollectionExportFormat>(
    DEFAULT_EXTRA_DATA_COLLECTION_EXPORT_FORMAT
  );

  const categoryLabel = getExtraDataCategoryDisplayName(category, i18n.language);
  const isCollectionExport = !minionId;

  const handleFormatChange = useCallback((format: ExtraDataCollectionExportFormat) => {
    collectionFormatRef.current = format;
  }, []);

  const handleExport = useCallback(async () => {
    const collectionFormat = isCollectionExport ? collectionFormatRef.current : undefined;

    const result = await runMutation({
      run: async () => {
        const response = await exportExtraData({
          minionId,
          collectionSlug,
          categoryId: category.id,
          search,
          collectionFormat,
        });

        const fallbackPrefix = collectionFormat
          ? getCollectionExportFallbackPrefix(category.name, collectionFormat)
          : `export_extra_data_${category.name}`;

        await fileDownloader.downloadByResponse(response, buildCsvExportFilename(fallbackPrefix));
      },
      errorMessage: tCommon("export-to-csv.error", {
        subject: t("minions.extra-data.export-subject"),
      }),
    });

    return result.ok;
  }, [
    category.id,
    category.name,
    collectionSlug,
    isCollectionExport,
    minionId,
    search,
    t,
    tCommon,
  ]);

  const collectionConfirmContent = useMemo(
    () => (
      <ExtraDataCollectionExportConfirmContent
        categoryLabel={categoryLabel}
        onFormatChange={handleFormatChange}
      />
    ),
    [categoryLabel, handleFormatChange]
  );

  if (isCollectionExport) {
    return <ExportToCsv onExport={handleExport} confirmContent={collectionConfirmContent} />;
  }

  return (
    <ExportToCsv
      scope={t("minions.extra-data.export-scope-client", { category: categoryLabel })}
      onExport={handleExport}
    />
  );
}
