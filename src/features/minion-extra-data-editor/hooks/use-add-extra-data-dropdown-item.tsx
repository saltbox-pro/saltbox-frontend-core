import { PlusOutlined } from "@ant-design/icons";
import type { ActionDropdownItem } from "@saltbox/saltbox-frontend-common";
import { type ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { SelectedMinionsExtraDataItemModal } from "../ui/selected-minions-extra-data-item-modal";

type UseAddExtraDataDropdownItemParams = {
  minionIds: readonly string[];
};

type UseAddExtraDataDropdownItemResult = {
  item: ActionDropdownItem | null;
  modal: ReactNode;
};

export function useAddExtraDataDropdownItem({
  minionIds,
}: UseAddExtraDataDropdownItemParams): UseAddExtraDataDropdownItemResult {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const hasMinions = minionIds.length > 0;

  const item = useMemo<ActionDropdownItem | null>(() => {
    if (!hasMinions) return null;

    return {
      key: "add-extra-data",
      label: t("minions.extra-data.add-data"),
      icon: <PlusOutlined />,
      onClick: () => setIsOpen(true),
    };
  }, [hasMinions, t]);

  const modal = (
    <SelectedMinionsExtraDataItemModal
      open={isOpen}
      minionIds={minionIds}
      onCancel={() => setIsOpen(false)}
    />
  );

  return { item, modal };
}
