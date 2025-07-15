import { observer } from "mobx-react-lite";
import CollectionCreateModal from "saltbox-core/shared/components/collection-create-modal/collection-create-modal";
import { SaltBoxMinionValueEditor } from "saltbox-core/shared/components/query-builder-salt-box/salt-box-minion-value-editor";
import { SaltBoxMinionValueSelector } from "saltbox-core/shared/components/query-builder-salt-box/salt-box-minion-value-selector";
import { SaltBoxQueryBuilderContainer } from "saltbox-core/shared/components/query-builder-salt-box/salt-box-query-builder-container";
import { MinionFilterStore } from "saltbox-core/store";

export const MinionsQueryBuilder = observer(
  (props: { slug: string; filterStore: MinionFilterStore }) => {
    return (
      <SaltBoxQueryBuilderContainer
        filterStore={props.filterStore}
        additionalButtons={
          <CollectionCreateModal
            disable={props.filterStore.currentFilters.rules.length === 0}
            query={props.filterStore.searchMongoDBQuery as object}
            parentSlug={props.slug}
          />
        }
        controlElements={{
          valueEditor: SaltBoxMinionValueEditor(props.slug),
          valueSelector: SaltBoxMinionValueSelector,
        }}
      />
    );
  }
);
