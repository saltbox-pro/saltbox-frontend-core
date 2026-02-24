import type { PillarTgtType } from "@saltbox/saltbox-core-api-client";
import { Modal } from "@saltbox/saltbox-frontend-common";

import type { PillarsStore } from "saltbox-core/store";

import { CreatePillarForm } from "./create-pillar-form";

export type CreatePillarModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  store: PillarsStore;
  tgtType: PillarTgtType;
  tgtId: string;
};

export function CreatePillarModal({
  isOpen,
  onClose,
  title,
  store,
  tgtType,
  tgtId,
}: CreatePillarModalProps) {
  return (
    <Modal width={650} open={isOpen} title={title} onCancel={onClose} footer={null} destroyOnHidden>
      <CreatePillarForm store={store} tgtType={tgtType} tgtId={tgtId} onClose={onClose} />
    </Modal>
  );
}
