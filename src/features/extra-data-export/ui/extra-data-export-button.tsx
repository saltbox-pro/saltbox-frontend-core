import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { ExportToCsv, buildCsvExportFilename, runMutation } from "@saltbox/saltbox-frontend-common";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { fileDownloader } from "saltbox-core/features/file-download";
import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";

import { exportExtraData } from "../api/export-extra-data";

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
  const { t, i18n } = useTranslation();
  const { t: tCommon } = useTranslation("common");

  const categoryLabel = getExtraDataCategoryDisplayName(category, i18n.language);
  const scope = minionId
    ? t("minions.extra-data.export-scope-client", { category: categoryLabel })
    : t("minions.extra-data.export-scope-collection", { category: categoryLabel });

  const handleExport = useCallback(async () => {
    const result = await runMutation({
      run: async () => {
        const response = await exportExtraData({
          minionId,
          collectionSlug,
          categoryId: category.id,
          search,
        });

        await fileDownloader.downloadByResponse(
          response,
          buildCsvExportFilename(`export_extra_data_${category.name}`)
        );
      },
      errorMessage: tCommon("export-to-csv.error", {
        subject: t("minions.extra-data.export-subject"),
      }),
    });

    return result.ok;
  }, [category.id, category.name, collectionSlug, minionId, search, t, tCommon]);

  return <ExportToCsv scope={scope} onExport={handleExport} />;
}
