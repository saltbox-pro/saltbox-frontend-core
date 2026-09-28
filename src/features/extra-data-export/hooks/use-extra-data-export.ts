import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { runMutation } from "@saltbox/saltbox-frontend-common";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { fileDownloader } from "saltbox-core/features/file-download";

import { exportCollectionExtraData, exportMinionExtraData } from "../api/export-extra-data";

export interface UseExtraDataExportOptions {
  category: ExtraDataCategoryModel;
  collectionSlug: string;
  minionId?: string;
  search: string;
}

export function useExtraDataExport({
  category,
  collectionSlug,
  minionId,
  search,
}: UseExtraDataExportOptions) {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const categoryLabel = t(`minions.extra-data.categories.${category.name}`, {
    defaultValue: category.name,
  });
  const warning = minionId
    ? t("minions.extra-data.export-to-csv-warning-minion", { category: categoryLabel })
    : t("minions.extra-data.export-to-csv-warning-collection", { category: categoryLabel });

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleExport = useCallback(async () => {
    setIsOpen(false);
    setIsExporting(true);

    await runMutation({
      run: async () => {
        const response = minionId
          ? await exportMinionExtraData({
              minionId,
              collectionSlug,
              categoryId: category.id,
              search,
            })
          : await exportCollectionExtraData({
              collectionSlug,
              categoryId: category.id,
              search,
            });

        await fileDownloader.downloadByResponse(
          response,
          `extra-data-${category.name}-${Date.now()}.csv`
        );
      },
      errorMessage: t("minions.extra-data.export-error"),
    });

    setIsExporting(false);
  }, [category, collectionSlug, minionId, search, t]);

  return {
    isOpen,
    isExporting,
    warning,
    openModal,
    closeModal,
    handleExport,
  };
}
