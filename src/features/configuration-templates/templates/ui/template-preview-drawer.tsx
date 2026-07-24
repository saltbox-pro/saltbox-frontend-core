import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { InfoDrawer } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { useConfirmDeleteTemplate } from "saltbox-core/features/template-source-ui";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";

import type { SourceTemplateActionsPermissions } from "../helpers/source-template-actions";
import type { TemplatePreviewStore } from "../store/template-preview-store";

import { TemplateItemActionsGuarded } from "./template-item-actions";
import { TemplatePreviewDrawerContent } from "./template-preview-drawer-content";

export type TemplatePreviewDrawerProps = {
  open: boolean;
  template: TaskTemplatePublicSchema | null;
  store: TemplatePreviewStore;
  permissions: SourceTemplateActionsPermissions | null;
  onDeleteTemplate?: (templateId: string) => Promise<void>;
  onDeleteError?: () => Promise<void>;
  onClose: () => void;
};

export const TemplatePreviewDrawer = observer(function TemplatePreviewDrawer({
  open,
  template,
  store,
  permissions,
  onDeleteTemplate,
  onDeleteError,
  onClose,
}: TemplatePreviewDrawerProps) {
  const { t } = useTranslation();
  const { confirmDeleteTemplate, modalContextHolder } = useConfirmDeleteTemplate();

  return (
    <InfoDrawer
      open={open}
      drawerId={DRAWER_IDS.templatePreview}
      titleName={template?.title}
      titleLabel={t("configuration-templates.source.preview-drawer-title")}
      loading={open && store.isLoading}
      loadError={store.loadError}
      onRetry={() => {
        if (template?.id && template.source_id) {
          store.load(template.source_id, template.id).catch(() => undefined);
        }
      }}
      hasData={!store.hasError}
      transitionKey={open ? "opened" : "closed"}
      width={900}
      onClose={onClose}
      afterOpenChange={(isOpen) => {
        if (!isOpen) {
          store.clearContent();
        }
      }}
      extra={
        !store.hasError ? (
          <>
            {modalContextHolder}
            <TemplateItemActionsGuarded
              template={template}
              permissions={permissions}
              confirmDeleteTemplate={confirmDeleteTemplate}
              onDeleteTemplate={onDeleteTemplate}
              onDeleteError={onDeleteError}
              onAfterNavigate={onClose}
              onDeleteTemplateSuccess={onClose}
            />
          </>
        ) : null
      }
    >
      {open ? <TemplatePreviewDrawerContent store={store} /> : null}
    </InfoDrawer>
  );
});
