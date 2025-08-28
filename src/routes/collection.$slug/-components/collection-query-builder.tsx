import { SaltBoxQueryBuilderContainer } from "saltbox-core/shared/components/query-builder-salt-box/salt-box-query-builder-container";
import { SaltBoxMinionValueEditor } from "saltbox-core/shared/components/query-builder-salt-box/salt-box-minion-value-editor";
import { SaltBoxMinionValueSelector } from "saltbox-core/shared/components/query-builder-salt-box/salt-box-minion-value-selector";
import { CollectionFilterStore } from "saltbox-core/store";

type CollectionQueryBuilderProps = {
    slug: string;
    filterStore: CollectionFilterStore;
};

export const CollectionQueryBuilder = (props: CollectionQueryBuilderProps) => {
    return (
        <SaltBoxQueryBuilderContainer
            filterStore={props.filterStore}
            hideButtons={true}
            controlElements={{
                valueEditor: SaltBoxMinionValueEditor(props.slug),
                valueSelector: SaltBoxMinionValueSelector,
            }}
        />
    );
};
