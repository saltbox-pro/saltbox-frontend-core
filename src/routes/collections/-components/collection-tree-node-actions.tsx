import { CopyOutlined, PlusOutlined } from "@ant-design/icons";
import { BaseActionButton } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import { ROOT_COLLECTION_SLUG } from "saltbox-core/shared/constants/collection";

interface CollectionTreeNodeActionsProps {
  slug: string;
  onCreateSubcollection: (parentSlug: string) => void;
  onDuplicate: (sourceSlug: string) => void;
}

export function CollectionTreeNodeActions({
  slug,
  onCreateSubcollection,
  onDuplicate,
}: CollectionTreeNodeActionsProps) {
  const { t } = useTranslation();

  const handleAction = (action: () => void) => (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    action();
  };

  return (
    <Flex align="center" gap={4}>
      <BaseActionButton
        icon={<PlusOutlined />}
        title={t("collection.create-subcollection")}
        onClick={handleAction(() => onCreateSubcollection(slug))}
      />
      {slug !== ROOT_COLLECTION_SLUG && (
        <BaseActionButton
          icon={<CopyOutlined />}
          title={t("collection.duplicate")}
          onClick={handleAction(() => onDuplicate(slug))}
        />
      )}
    </Flex>
  );
}
