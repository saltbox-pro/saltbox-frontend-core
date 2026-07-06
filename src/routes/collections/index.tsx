import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { PageLayout, isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Button, Flex, message, Modal } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import CollectionEditModal from "saltbox-core/shared/components/collection-edit-modal/collection-edit-modal";
import { findNodeBySlug } from "saltbox-core/shared/utils/tree-utils";
import { collectionsTreeStore } from "saltbox-core/store";
import { CollectionsTree } from "saltbox-core/widgets/minions/tree-menu";
import type { CollectionTreeAntdNode } from "saltbox-core/widgets/minions/tree-menu/types/node";

import styles from "./index.module.css";

type CollectionTarget = { slug: string; title: string; description?: string };

const ROOT_SLUG = "root";

const CollectionsPage = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [renameTarget, setRenameTarget] = useState<CollectionTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CollectionTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const ok = await collectionsTreeStore.deleteCollection(deleteTarget.slug);
    setIsDeleting(false);

    if (ok) {
      messageApi.success(t("collection.collection-deleted-successfully"));
      setDeleteTarget(null);
      return;
    }

    if (isGlobalServerError(collectionsTreeStore.actionErrorRaw)) return;
    messageApi.error(t("collection.error-deleting-collection"));
  };

  const renderActions = (node: CollectionTreeAntdNode) => {
    if (node.slug === ROOT_SLUG) {
      return null;
    }

    const storeNode = findNodeBySlug(collectionsTreeStore.treeNodes, node.slug);
    const title = storeNode?.title ?? node.slug;
    return (
      <Flex gap={4} align="center">
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          title={t("collection.edit-collection")}
          onClick={(e) => {
            e.stopPropagation();
            setRenameTarget({ slug: node.slug, title, description: storeNode?.description });
          }}
        />
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          title={t("collection.delete-collection")}
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget({ slug: node.slug, title });
          }}
        />
      </Flex>
    );
  };

  return (
    <PageLayout title={t("collection.collections")} className={styles.pageLayout}>
      {contextHolder}

      <CollectionsTree
        onSelectNode={(node) => {
          if (node.slug) navigate(`/core/minions/${node.slug}`);
        }}
        renderActions={renderActions}
        showDescription
        className={styles.collectionsTree}
      />

      <CollectionEditModal
        slug={renameTarget?.slug ?? ""}
        title={renameTarget?.title ?? ""}
        description={renameTarget?.description}
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
      />

      <Modal
        title={t("collection.delete-collection")}
        open={!!deleteTarget}
        onOk={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        okText={t("common.delete")}
        cancelText={t("common.cancel")}
        okButtonProps={{ danger: true, loading: isDeleting }}
        cancelButtonProps={{ disabled: isDeleting }}
      >
        <p>
          {t("collection.are-you-sure-you-want-to-delete-collection", {
            name: deleteTarget?.title,
          })}
        </p>
      </Modal>
    </PageLayout>
  );
});

export default CollectionsPage;
