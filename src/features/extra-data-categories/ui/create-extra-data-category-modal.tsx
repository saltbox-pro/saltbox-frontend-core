import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { Modal } from "@saltbox/saltbox-frontend-common";
import { useTranslation } from "react-i18next";

import { CreateExtraDataCategoryForm } from "./create-extra-data-category-form";

type CreateExtraDataCategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (category: ExtraDataCategoryModel) => void;
};

export function CreateExtraDataCategoryModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateExtraDataCategoryModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={isOpen}
      title={t("extra-data-categories.create.modal-title")}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={800}
    >
      <CreateExtraDataCategoryForm onClose={onClose} onSuccess={onSuccess} />
    </Modal>
  );
}
