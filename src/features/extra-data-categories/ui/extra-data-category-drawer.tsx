import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { InfoDrawer, type InfoDrawerProps } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";

import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";
import type { DrawerCloseGuard } from "saltbox-core/shared/hooks/useUnsavedChangesCloseGuard";

import { ExtraDataCategoryActionsMenu } from "./extra-data-category-actions-menu";
import { ExtraDataCategoryDetails } from "./extra-data-category-details";
import { ExtraDataCategoryFieldsEditor } from "./extra-data-category-fields-editor";

type ExtraDataCategoryDrawerProps = Omit<
  InfoDrawerProps,
  "drawerId" | "titleName" | "titleLabel" | "extra" | "children" | "hasData"
> & {
  category: ExtraDataCategoryModel | null;
  closeGuardRef?: RefObject<DrawerCloseGuard | null>;
  onCategoryUpdated?: (category: ExtraDataCategoryModel) => void;
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
  const { t } = useTranslation();

  const titleName = category ? getExtraDataCategoryDisplayName(t, category.name) : undefined;

  return (
    <InfoDrawer
      open={open}
      drawerId={DRAWER_IDS.extraDataCategorySettings}
      titleName={titleName}
      hasData={!!category}
      transitionKey={open ? (category?.id ?? "opened") : "closed"}
      extra={
        <ExtraDataCategoryActionsMenu
          category={category}
          displayName={titleName}
          onDeleted={onCategoryDeleted}
        />
      }
      {...restProps}
    >
      {!!category && (
        <Flex vertical gap="large">
          <ExtraDataCategoryDetails category={category} />
          <ExtraDataCategoryFieldsEditor
            key={category.id}
            category={category}
            readOnly={category.is_system}
            readOnlyTooltip={
              category.is_system ? t("extra-data-categories.system-category-readonly") : undefined
            }
            closeGuardRef={closeGuardRef}
            onSuccess={onCategoryUpdated}
          />
        </Flex>
      )}
    </InfoDrawer>
  );
}
