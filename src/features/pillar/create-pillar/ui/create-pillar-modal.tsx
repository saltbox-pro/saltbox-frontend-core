import { PillarTgtType } from "@saltbox/saltbox-core-api-client";
import { Modal } from "@saltbox/saltbox-frontend-common";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { CreatePillarForm } from "./create-pillar-form";

export type CreatePillarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  targetName?: string;
  loadPillars: () => void;
  tgtType: PillarTgtType;
  tgtId?: string;
};

export function CreatePillarModal({
  isOpen,
  onClose,
  targetName,
  loadPillars,
  tgtType,
  tgtId,
}: CreatePillarModalProps) {
  const { t } = useTranslation();

  const title = useMemo(() => {
    if (tgtType === PillarTgtType.Root) {
      return t("pillars.create.modal-title-root");
    }
    if (tgtType === PillarTgtType.Collection) {
      return t("pillars.create.modal-title-collection", { name: targetName });
    }
    return t("pillars.create.modal-title-minion", { name: targetName });
  }, [t, tgtType, targetName]);

  return (
    <Modal width={650} open={isOpen} title={title} onCancel={onClose} footer={null} destroyOnHidden>
      <CreatePillarForm
        refreshPillars={loadPillars}
        tgtType={tgtType}
        tgtId={tgtId}
        onClose={onClose}
      />
    </Modal>
  );
}
