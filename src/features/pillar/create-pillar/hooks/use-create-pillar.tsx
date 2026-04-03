import { PlusOutlined } from "@ant-design/icons";
import { PillarTgtType } from "@saltbox/saltbox-core-api-client";
import { Button } from "antd";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { PillarsStore } from "saltbox-core/store";

import { CreatePillarModal } from "../ui/create-pillar-modal";

export interface UseCreatePillarOptions {
  store: PillarsStore;
  targetType: PillarTgtType;
  tgtId?: string;
  targetName?: string;
}

export function useCreatePillar({ store, targetType, tgtId, targetName }: UseCreatePillarOptions) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  const modalTitle = useMemo(() => {
    if (targetType === PillarTgtType.Root) {
      return t("pillars.create.modal-title-root");
    }
    if (targetType === PillarTgtType.Collection) {
      return t("pillars.create.modal-title-collection", { name: targetName });
    }
    return t("pillars.create.modal-title-minion", { name: targetName });
  }, [t, targetType, targetName]);

  const addPillarButton = useMemo(
    () => (
      <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
        {t("pillars.create.add-button")}
      </Button>
    ),
    [openModal, t]
  );

  const createPillarModal = useMemo(
    () => (
      <CreatePillarModal
        isOpen={isOpen}
        onClose={closeModal}
        title={modalTitle}
        store={store}
        tgtType={targetType}
        tgtId={tgtId}
      />
    ),
    [isOpen, closeModal, modalTitle, store, targetType, tgtId]
  );

  return {
    addPillarButton,
    createPillarModal,
    openModal,
    closeModal,
    isOpen,
  };
}
