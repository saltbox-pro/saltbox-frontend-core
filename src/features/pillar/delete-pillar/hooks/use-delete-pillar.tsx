import { message } from "antd";
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
    try {
      await deletePillar({ pillarId });

      const displayName = pillarName ?? pillarId;

      if (displayName) {
        message.success({
          content: (
            <>
              {t("pillars.delete.success-before-name")}
              <strong>{displayName}</strong>
              {t("pillars.delete.success-after-name")}
            </>
          ),
        });
      } else {
        message.success(t("pillars.delete.success"));
      }
      onDeleted?.();
    } catch {
      message.error(t("pillars.delete.error"));
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  }, [onDeleted, pillarId, pillarName, t]);

  return {
    isOpen,
    isDeleting,
    openModal,
    closeModal,
    handleDelete,
  };
}
