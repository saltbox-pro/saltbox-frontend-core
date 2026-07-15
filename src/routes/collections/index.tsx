import { PlusOutlined } from "@ant-design/icons";
import { PageLayout, useInfoDrawer } from "@saltbox/saltbox-frontend-common";
import { Button, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CollectionCreateModal from "saltbox-core/shared/components/collection-create-modal/collection-create-modal";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import { CollectionStore } from "saltbox-core/store";
import {
  CollectionDetailsDrawer,
  type CollectionDetailsDrawerOpenParams,
} from "saltbox-core/widgets/collection-details-drawer";
import { CollectionsTree } from "saltbox-core/widgets/minions/tree-menu";

import styles from "./index.module.css";

const CollectionsPage = observer(() => {
  const { t } = useTranslation();
  const [collectionStore] = useState(() => new CollectionStore());
  const [createParentSlug, setCreateParentSlug] = useState<string | null>(null);
  const [isStructureEditMode, setIsStructureEditMode] = useState(false);

  const drawer = useInfoDrawer<CollectionDetailsDrawerOpenParams, string, HTMLDivElement>({
    getId: (params) => params.id,
    drawerId: DRAWER_IDS.collectionDetails,
  });

  const toggleStructureEditMode = () => {
    setIsStructureEditMode((prev) => {
      const next = !prev;
      if (next && drawer.isOpened) drawer.close();
      return next;
    });
  };

  return (
    <PageLayout title={t("collection.collections")} className={styles.pageLayout}>
      <div className={styles.treeWrapper}>
        <CollectionsTree
          contentRef={drawer.mainContentRef}
          structureEditable={isStructureEditMode}
          onToggleStructureEdit={toggleStructureEditMode}
          onSelectNode={(node) => {
            if (node.slug) {
              drawer.toggle({ id: String(node.key), slug: node.slug });
            }
          }}
          renderActions={
            isStructureEditMode
              ? undefined
              : (node) => (
                  <Tooltip title={t("collection.create-subcollection")}>
                    <Button
                      type="text"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCreateParentSlug(node.slug);
                      }}
                    />
                  </Tooltip>
                )
          }
          showDescription
          className={styles.collectionsTree}
          selectedSlug={
            !isStructureEditMode && drawer.isOpened
              ? (collectionStore.collectionSlug ?? drawer.openedArg?.slug ?? null)
              : null
          }
        />
      </div>

      <CollectionDetailsDrawer
        drawer={drawer}
        collectionStore={collectionStore}
        onCreateSubcollection={setCreateParentSlug}
      />

      <CollectionCreateModal
        isOpen={createParentSlug !== null}
        parentSlug={createParentSlug ?? ""}
        query={{}}
        editableFilter
        navigateAfterCreate={false}
        onClose={() => setCreateParentSlug(null)}
      />
    </PageLayout>
  );
});

export default CollectionsPage;
