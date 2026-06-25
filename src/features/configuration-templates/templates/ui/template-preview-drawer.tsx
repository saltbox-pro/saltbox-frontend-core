import { CopyOutlined } from "@ant-design/icons";
import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { InfoDrawer } from "@saltbox/saltbox-frontend-common";
import { Button } from "antd";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";

import { getDuplicateTemplatePath } from "../../shared/helpers/source-presentation";
import type { TemplatePreviewStore } from "../store/template-preview-store";

import { TemplatePreviewDrawerContent } from "./template-preview-drawer-content";

export type TemplatePreviewDrawerProps = {
  open: boolean;
  template: TaskTemplatePublicSchema | null;
  store: TemplatePreviewStore;
  canDuplicate?: boolean;
  onClose: () => void;
};

export const TemplatePreviewDrawer = observer(function TemplatePreviewDrawer({
  open,
  template,
  store,
  canDuplicate = false,
  onClose,
}: TemplatePreviewDrawerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleDuplicate = () => {
    if (!template) return;

    navigate(getDuplicateTemplatePath(template.source_id, template.id));
    onClose();
  };

  return (
    <InfoDrawer
      open={open}
      drawerId={DRAWER_IDS.templatePreview}
      titleName={template?.title}
      titleLabel={t("configuration-templates.source.preview-drawer-title")}
      loading={open && store.isLoading}
      errorMessage={
        store.hasError ? t("configuration-templates.source.preview-load-error") : undefined
      }
      hasData={!store.hasError}
      transitionKey={open ? "opened" : "closed"}
      width={900}
      onClose={onClose}
      extra={
        <Button
          size="small"
          icon={<CopyOutlined />}
          variant="outlined"
          color="default"
          disabled={!canDuplicate}
          onClick={handleDuplicate}
        >
          {t("configuration-templates.source.duplicate-template")}
        </Button>
      }
    >
      <TemplatePreviewDrawerContent store={store} />
    </InfoDrawer>
  );
});
