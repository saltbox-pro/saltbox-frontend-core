import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { useInfoDrawer } from "@saltbox/saltbox-frontend-common";
import { useCallback, useMemo, useState } from "react";

import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";

import { TemplatePreviewStore } from "../store/template-preview-store";

export type TemplatePreviewListProps = {
  onTemplateClick: (template: TaskTemplatePublicSchema) => void;
  activeTemplateId: string | null;
};

export function useTemplatePreviewDrawer() {
  const [previewStore] = useState(() => new TemplatePreviewStore());

  const drawer = useInfoDrawer<TaskTemplatePublicSchema, string, HTMLDivElement>({
    getId: (template) => template.id,
    drawerId: DRAWER_IDS.templatePreview,
    onClose: () => previewStore.reset(),
  });

  const handleTemplateClick = useCallback(
    async (template: TaskTemplatePublicSchema) => {
      if (drawer.isOpened && drawer.openedId === template.id) {
        drawer.close();
        return;
      }

      const isSwitching = drawer.isOpened;

      if (isSwitching) {
        await drawer.open(template);
      }

      const loadFinished = await previewStore.load(template.id);
      if (!loadFinished) return;

      if (!isSwitching) {
        await drawer.open(template);
      }
    },
    [drawer, previewStore]
  );

  const templatesListProps = useMemo<TemplatePreviewListProps>(
    () => ({
      onTemplateClick: handleTemplateClick,
      activeTemplateId: drawer.activeRowId,
    }),
    [drawer.activeRowId, handleTemplateClick]
  );

  return {
    drawer,
    previewStore,
    openedTemplate: drawer.openedArg,
    templatesListProps,
  };
}
