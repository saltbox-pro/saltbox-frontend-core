import { FastTable } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";

import { MinionsTableWithDetailsDrawer } from "saltbox-core/shared/components/minions-table-with-details-drawer";
import type { MinionFilterStore, MinionsStore } from "saltbox-core/store";

import styles from "./collection-details-drawer.module.css";

interface CollectionClientsPreviewProps {
  slug: string;
  filterStore: MinionFilterStore;
  minionsStore: MinionsStore;
  onFiltersApplied: () => void;
}

export const CollectionClientsPreview = observer(
  ({ slug, filterStore, minionsStore, onFiltersApplied }: CollectionClientsPreviewProps) => {
    const reloadMinions = useCallback(() => {
      if (minionsStore.collectionSlug) {
        minionsStore.loadMinions(minionsStore.collectionSlug);
      }
    }, [minionsStore]);

    return (
      <section className={styles.clientsSection}>
        <MinionsTableWithDetailsDrawer
          slug={slug}
          minionsStore={minionsStore}
          filterStore={filterStore}
          onFiltersApplied={onFiltersApplied}
          onRefresh={reloadMinions}
          toolbar={
            <div className={styles.clientsToolbar}>
              <FastTable.Toolbar />
            </div>
          }
        />
      </section>
    );
  }
);
