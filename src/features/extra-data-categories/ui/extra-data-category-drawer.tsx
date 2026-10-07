import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { InfoDrawer, type InfoDrawerProps } from "@saltbox/saltbox-frontend-common";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";

import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";
import type { ExtraDataCategoryUpdatePatch } from "saltbox-core/shared/helpers/merge-extra-data-category-update";
import type { DrawerCloseGuard } from "saltbox-core/shared/hooks/useUnsavedChangesCloseGuard";

import { ExtraDataCategoryActionsMenu } from "./extra-data-category-actions-menu";
import { ExtraDataCategoryEditor } from "./extra-data-category-editor";

type ExtraDataCategoryDrawerProps = Omit<
  InfoDrawerProps,
  "drawerId" | "titleName" | "titleLabel" | "extra" | "children" | "hasData"
> & {
  category: ExtraDataCategoryModel | null;
  closeGuardRef?: RefObject<DrawerCloseGuard | null>;
  onCategoryUpdated?: (
    category: ExtraDataCategoryModel,
    patch: ExtraDataCategoryUpdatePatch
  ) => void;
  onCategoryDeleted?: (category: ExtraDataCategoryModel) => void;
};

export function ExtraDataCategoryDrawer({
  open,
  category,
  closeGuardRef,
  onCategoryUpdated,
  onCategoryDeleted,
  ...restProps
}: ExtraDataCategoryDrawerProps) {
  const { i18n } = useTranslation();

  const displayName = category
    ? getExtraDataCategoryDisplayName(category, i18n.language)
    : undefined;

  return (
    <InfoDrawer
      open={open}
      drawerId={DRAWER_IDS.extraDataCategorySettings}
      titleName={category?.name}
      hasData={!!category}
      transitionKey={open ? (category?.id ?? "opened") : "closed"}
      extra={
        <ExtraDataCategoryActionsMenu
          category={category}
          displayName={displayName}
          onDeleted={onCategoryDeleted}
        />
      }
      {...restProps}
    >
      {!!category && (
        <ExtraDataCategoryEditor
          key={category.id}
          category={category}
          readOnly={category.is_system}
          closeGuardRef={closeGuardRef}
          onSuccess={onCategoryUpdated}
        />
      )}
    </InfoDrawer>
  );
}
