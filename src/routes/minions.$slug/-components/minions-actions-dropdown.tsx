import type { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";
import { ActionDropdown, UiEvent } from "@saltbox/saltbox-frontend-common";
import { message } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { OptionList } from "react-querybuilder";

import { useAddExtraDataDropdownItem } from "saltbox-core/features/minion-extra-data-editor";
import { useRemoveMinionsDropdownItem } from "saltbox-core/features/minions/remove-minions";
import { MinionsExportDropdownContribution } from "saltbox-core/features/minions-export";
import {
  buildMinionsActionPluginItems,
  useActionPluginClickGuard,
  usePluginActionsTick,
} from "saltbox-core/features/plugins";

import { buildMinionsActionItems } from "./helpers/build-minions-action-items";

type SelectedMinion = TaskTargetMinion & { mid: string };

export type MinionsActionsDropdownProps = {
  slug: string;
  collectionTitle?: string;
  filterSchema?: OptionList;
  query: Record<string, unknown>;
  selectedMinions: SelectedMinion[];
  clearSelection: () => void;
  reloadMinions: () => void;
};

export function MinionsActionsDropdown({
  slug,
  collectionTitle,
  selectedMinions,
  filterSchema,
  query,
  clearSelection,
  reloadMinions,
}: MinionsActionsDropdownProps) {
  const { t } = useTranslation();
  const [messageApi, messageContextHolder] = message.useMessage();
  const actionPluginClickGuard = useActionPluginClickGuard(messageApi);
  usePluginActionsTick(UiEvent.MinionsActionsChanged);

  const selectedMinionMongoIds = useMemo(
    () => selectedMinions.map((minion) => minion.mid),
    [selectedMinions]
  );

  const addExtraDataAction = useAddExtraDataDropdownItem({ minionIds: selectedMinionMongoIds });

  const removeAction = useRemoveMinionsDropdownItem({
    collectionSlug: slug,
    minionMongoIds: selectedMinionMongoIds,
    onDeleted: () => {
      reloadMinions();
      clearSelection();
    },
  });

  const pluginActionContext = useMemo(
    () => ({
      collectionSlug: slug,
      collectionTitle,
      query,
      selectedMinions: selectedMinions.map(({ minion_id, salt_master }) => ({
        minion_id,
        salt_master,
      })),
    }),
    [slug, collectionTitle, query, selectedMinions]
  );

  const pluginItems = buildMinionsActionPluginItems(pluginActionContext, actionPluginClickGuard);

  return (
    <MinionsExportDropdownContribution
      enabled={selectedMinions.length > 0}
      slug={slug}
      filterSchema={filterSchema}
      selectedMinions={selectedMinions}
    >
      {({ item: exportItem, modalContextHolder: exportModalContextHolder }) => {
        const items = buildMinionsActionItems({
          pluginItems,
          addExtraDataItem: addExtraDataAction.item,
          exportItem,
          deleteItem: selectedMinions.length > 0 ? removeAction.item : null,
        });
        const hasActions = items.some((item) => !!item && item.type !== "divider");

        return (
          <>
            {messageContextHolder}
            {removeAction.modalContextHolder}
            {exportModalContextHolder}
            {addExtraDataAction.modal}

            <ActionDropdown
              menu={{ items }}
              disabled={!hasActions}
              disabledTooltip={t("minions.actions-select-items")}
            />
          </>
        );
      }}
    </MinionsExportDropdownContribution>
  );
}
