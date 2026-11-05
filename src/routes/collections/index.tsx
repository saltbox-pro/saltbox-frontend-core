import { PageLayout, useInfoDrawer } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { ROOT_COLLECTION_SLUG } from "saltbox-core/shared/constants/collection";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import type { DrawerCloseGuard } from "saltbox-core/shared/hooks/useUnsavedChangesCloseGuard";
import { findNodeBySlug } from "saltbox-core/shared/utils/tree-utils";
import { CollectionStore, collectionsTreeStore } from "saltbox-core/store";
import {
  buildCreateOpenParams,
  buildDuplicateOpenParams,
  buildViewOpenParams,
  CollectionDetailsDrawer,
  type CollectionDetailsDrawerOpenParams,
} from "saltbox-core/widgets/collection-details-drawer";
import { CollectionsTree } from "saltbox-core/widgets/minions/tree-menu";

import { CollectionTreeNodeActions } from "./-components/collection-tree-node-actions";
import styles from "./index.module.css";

const CollectionsPage = observer(() => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [collectionStore] = useState(() => new CollectionStore());
  const [isStructureEditMode, setIsStructureEditMode] = useState(false);
  const deepLinkHandledRef = useRef<string | null>(null);
  const closeGuardRef = useRef<DrawerCloseGuard | null>(null);

  const drawer = useInfoDrawer<CollectionDetailsDrawerOpenParams, string, HTMLDivElement>({
    getId: (params) => params.id,
    drawerId: DRAWER_IDS.collectionDetails,
    onBeforeClose: () => closeGuardRef.current?.() ?? true,
  });
  const { open: openDrawer } = drawer;

  useEffect(() => {
    collectionsTreeStore.loadTree();
  }, []);

  useEffect(() => {
    const slug = searchParams.get("slug");
    if (!slug || slug === ROOT_COLLECTION_SLUG || !collectionsTreeStore.isTreeLoaded) {
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
    openDrawer(buildViewOpenParams(String(node.id), slug));

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

  const openDraftDrawer = (params: CollectionDetailsDrawerOpenParams) => {
    if (drawer.openedId === params.id) {
      return;
    }

    deepLinkHandledRef.current = null;
    drawer.toggle(params);
  };

  const openCreateDrawer = (parentSlug: string) =>
    openDraftDrawer(buildCreateOpenParams(parentSlug));

  const openDuplicateDrawer = (sourceSlug: string) =>
    openDraftDrawer(
      buildDuplicateOpenParams(sourceSlug, collectionStore.getSettledCollection(sourceSlug))
    );

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
              drawer.toggle(buildViewOpenParams(String(node.key), node.slug));
            }
          }}
          renderActions={
            isStructureEditMode
              ? undefined
              : (node) => (
                  <CollectionTreeNodeActions
                    slug={node.slug}
                    onCreateSubcollection={openCreateDrawer}
                    onDuplicate={openDuplicateDrawer}
                  />
                )
          }
          showDescription
          className={styles.collectionsTree}
          selectedSlug={
            !isStructureEditMode && drawer.isOpened && drawer.openedArg?.mode === "view"
              ? (collectionStore.collectionSlug ?? drawer.openedArg.slug)
              : null
          }
        />
      </div>

      <CollectionDetailsDrawer
        drawer={drawer}
        collectionStore={collectionStore}
        closeGuardRef={closeGuardRef}
        onCreateSubcollection={openCreateDrawer}
        onDuplicate={openDuplicateDrawer}
      />
    </PageLayout>
  );
});

export default CollectionsPage;
