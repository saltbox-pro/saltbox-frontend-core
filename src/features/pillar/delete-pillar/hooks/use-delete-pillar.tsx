import { notify, runMutation } from "@saltbox/saltbox-frontend-common";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { deletePillar } from "../api/delete-pillar";

export interface UseDeletePillarOptions {
  pillarId: string | null | undefined;
  pillarName: string | null | undefined;
  onDeleted?: () => void;
}

export function useDeletePillar({ pillarId, pillarName, onDeleted }: UseDeletePillarOptions) {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const openModal = useCallback(() => {
    if (!pillarId) return;
    setIsOpen(true);
  }, [pillarId]);

  const closeModal = useCallback(() => {
    if (isDeleting) return;
    setIsOpen(false);
  }, [isDeleting]);

  const handleDelete = useCallback(async () => {
    if (!pillarId) return;

    setIsDeleting(true);

    const result = await runMutation({
      run: () => deletePillar({ pillarId }),
      errorMessage: t("pillars.delete.error"),
    });

    setIsDeleting(false);
    setIsOpen(false);

    if (!result.ok) return;

    const displayName = pillarName ?? pillarId;
    notify.success(
      displayName
        ? `${t("pillars.delete.success-before-name")}${displayName}${t("pillars.delete.success-after-name")}`
        : t("pillars.delete.success")
    );
    onDeleted?.();
  }, [onDeleted, pillarId, pillarName, t]);

  return {
    isOpen,
    isDeleting,
    openModal,
    closeModal,
    handleDelete,
  };
}
