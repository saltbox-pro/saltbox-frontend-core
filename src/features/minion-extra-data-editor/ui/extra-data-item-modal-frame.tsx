import { Modal } from "@saltbox/saltbox-frontend-common";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type ExtraDataItemModalFrameProps = {
  open: boolean;
  title?: string;
  isSubmitting: boolean;
  onCancel: () => void;
  children: ReactNode;
};

export function ExtraDataItemModalFrame({
  open,
  title,
  isSubmitting,
  onCancel,
  children,
}: ExtraDataItemModalFrameProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      title={title ?? t("minions.extra-data.item-form.create-title")}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
      width={720}
      closable={!isSubmitting}
      maskClosable={!isSubmitting}
      keyboard={!isSubmitting}
    >
      {children}
    </Modal>
  );
}
