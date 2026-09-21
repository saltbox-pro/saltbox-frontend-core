import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { InfoDrawer } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { useConfirmDeleteTemplate } from "saltbox-core/features/template-source-ui";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import { getTemplateTitleText } from "saltbox-core/shared/utils/template-localized-text";

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
  const { t, i18n } = useTranslation();
  const { confirmDeleteTemplate, modalContextHolder } = useConfirmDeleteTemplate();

  return (
    <InfoDrawer
      open={open}
      drawerId={DRAWER_IDS.templatePreview}
      titleName={getTemplateTitleText(template?.title, i18n.language) || template?.name}
      titleLabel={t("configuration-templates.source.preview-drawer-title")}
      loading={open && store.isLoading}
      loaders={[store.previewLoad]}
      transitionKey={open ? "opened" : "closed"}
      width={900}
      onClose={onClose}
      afterOpenChange={(isOpen) => {
        if (!isOpen) {
          store.clearContent();
        }
      }}
      extra={
        !store.previewLoad.error ? (
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
