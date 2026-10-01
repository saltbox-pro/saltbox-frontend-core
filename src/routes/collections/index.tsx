import { PlusCircleOutlined } from "@ant-design/icons";
import { PageLayout, useInfoDrawer } from "@saltbox/saltbox-frontend-common";
import { Button, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import { findNodeBySlug } from "saltbox-core/shared/utils/tree-utils";
import { CollectionStore, collectionsTreeStore } from "saltbox-core/store";
import {
  CollectionDetailsDrawer,
  type CollectionDetailsDrawerCloseGuard,
  type CollectionDetailsDrawerOpenParams,
} from "saltbox-core/widgets/collection-details-drawer";
import { CollectionsTree } from "saltbox-core/widgets/minions/tree-menu";

import styles from "./index.module.css";

const CollectionsPage = observer(() => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [collectionStore] = useState(() => new CollectionStore());
  const [isStructureEditMode, setIsStructureEditMode] = useState(false);
  const deepLinkHandledRef = useRef<string | null>(null);
  const closeGuardRef = useRef<CollectionDetailsDrawerCloseGuard | null>(null);

  const drawer = useInfoDrawer<CollectionDetailsDrawerOpenParams, string, HTMLDivElement>({
    getId: (params) => params.id,
    drawerId: DRAWER_IDS.collectionDetails,
    outsideClickIgnoreSelectors: [
      `#sbx-drawer-${DRAWER_IDS.minionDetails}`,
      `#sbx-drawer-${DRAWER_IDS.extraDataCategoryDetails}`,
    ],
    onBeforeClose: () => closeGuardRef.current?.() ?? true,
  });
  const { open: openDrawer } = drawer;

  useEffect(() => {
    collectionsTreeStore.loadTree();
  }, []);

  useEffect(() => {
    const slug = searchParams.get("slug");
    if (!slug || slug === "root" || !collectionsTreeStore.isTreeLoaded) {
      return;
    }

    if (deepLinkHandledRef.current === slug) {
      return;
    }

    const node = findNodeBySlug(collectionsTreeStore.treeNodes, slug);
    if (!node?.id) {
      return;
    }

    deepLinkHandledRef.current = slug;
    openDrawer({
      id: String(node.id),
      slug,
    });

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("edit");
        next.delete("slug");
        return next;
      },
      { replace: true }
    );
  }, [
    searchParams,
    collectionsTreeStore.isTreeLoaded,
    collectionsTreeStore.treeNodes,
    openDrawer,
    setSearchParams,
  ]);

  const toggleStructureEditMode = () => {
    setIsStructureEditMode((prev) => {
      const next = !prev;
      if (next && drawer.isOpened) drawer.close();
      return next;
    });
  };

  const openCreateDrawer = (parentSlug: string) => {
    const id = `create:${parentSlug}`;
    if (drawer.openedId === id) {
      return;
    }

    deepLinkHandledRef.current = null;
    drawer.toggle({ id, slug: parentSlug, isCreate: true });
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
              deepLinkHandledRef.current = null;
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
                      icon={<PlusCircleOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreateDrawer(node.slug);
                      }}
                    />
                  </Tooltip>
                )
          }
          showDescription
          className={styles.collectionsTree}
          selectedSlug={
            !isStructureEditMode && drawer.isOpened && !drawer.openedArg?.isCreate
              ? (collectionStore.collectionSlug ?? drawer.openedArg?.slug ?? null)
              : null
          }
        />
      </div>

      <CollectionDetailsDrawer
        drawer={drawer}
        collectionStore={collectionStore}
        closeGuardRef={closeGuardRef}
        onCreateSubcollection={openCreateDrawer}
      />
    </PageLayout>
  );
});

export default CollectionsPage;
