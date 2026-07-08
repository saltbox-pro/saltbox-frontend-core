import { PageLayout, useInfoDrawer } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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

  const drawer = useInfoDrawer<CollectionDetailsDrawerOpenParams, string, HTMLDivElement>({
    getId: (params) => params.id,
    drawerId: DRAWER_IDS.collectionDetails,
  });

  return (
    <PageLayout title={t("collection.collections")} className={styles.pageLayout}>
      <div ref={drawer.mainContentRef} className={styles.treeWrapper}>
        <CollectionsTree
          onSelectNode={(node) => {
            if (node.slug) {
              drawer.toggle({ id: String(node.key), slug: node.slug });
            }
          }}
          showDescription
          className={styles.collectionsTree}
          selectedSlug={
            drawer.isOpened
              ? (collectionStore.collectionSlug ?? drawer.openedArg?.slug ?? null)
              : null
          }
        />
      </div>

      <CollectionDetailsDrawer drawer={drawer} collectionStore={collectionStore} />
    </PageLayout>
  );
});

export default CollectionsPage;
