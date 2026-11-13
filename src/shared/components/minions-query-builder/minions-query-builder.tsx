import { SaltBoxQueryBuilderContainer } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useCallback, type ComponentProps } from "react";

import { CoreMinionValueEditor } from "saltbox-core/shared/components/query-builder-salt-box/core-minion-value-editor";
import { CoreMinionValueSelector } from "saltbox-core/shared/components/query-builder-salt-box/core-minion-value-selector";
import { getDefaultMinionFilterField } from "saltbox-core/shared/helpers/minion-field-cascader";
import { useFilterLabelComparator } from "saltbox-core/shared/hooks/useFilterLabelComparator";
import { MinionFilterStore } from "saltbox-core/store";

import styles from "./minions-query-builder.module.css";

type QueryBuilderControlElements = NonNullable<
  ComponentProps<typeof SaltBoxQueryBuilderContainer>["controlElements"]
>;

const minionValueSelector = CoreMinionValueSelector as unknown as NonNullable<
  QueryBuilderControlElements["valueSelector"]
>;

export const MinionsQueryBuilder = observer(
  (props: {
    slug: string;
    filterStore: MinionFilterStore;
    onSearch?: () => void;
    onReset?: () => void;
  }) => {
    const compareLabels = useFilterLabelComparator();

    const getDefaultField = useCallback(
      (fields: ReadonlyArray<unknown>) => getDefaultMinionFilterField(fields, compareLabels),
      [compareLabels]
    );

    return (
      <SaltBoxQueryBuilderContainer
        className={styles.clientFilters}
        filterStore={props.filterStore}
        onSearchButtonClick={props.onSearch}
        onResetButtonClick={props.onReset}
        showCopyFilterButton
        enableFreeTextMode
        controlElements={{
          valueEditor: CoreMinionValueEditor(props.slug),
          valueSelector: minionValueSelector,
        }}
        getDefaultField={getDefaultField}
      />
    );
  }
);
