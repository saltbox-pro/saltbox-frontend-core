import {
  SaltBoxMinionValueSelector,
  SaltBoxQueryBuilderContainer,
} from "@saltbox/saltbox-frontend-common";
import { useMemo } from "react";

import { CoreMinionValueEditor } from "saltbox-core/shared/components/query-builder-salt-box/core-minion-value-editor";
import { MinionFilterStore } from "saltbox-core/store";

type CollectionQueryBuilderProps = {
  slug: string;
  filterStore: MinionFilterStore;
  onSearch?: () => void;
  onReset?: () => void;
};

export const CollectionQueryBuilder = (props: CollectionQueryBuilderProps) => {
  const valueEditor = useMemo(() => CoreMinionValueEditor(props.slug), [props.slug]);

  return (
    <SaltBoxQueryBuilderContainer
      filterStore={props.filterStore}
      hideButtons={false}
      onSearchButtonClick={props.onSearch}
      onResetButtonClick={props.onReset}
      controlElements={{
        valueEditor,
        valueSelector: SaltBoxMinionValueSelector,
      }}
    />
  );
};
