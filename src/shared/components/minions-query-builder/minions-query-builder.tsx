import { SaltBoxQueryBuilderContainer } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo, type ComponentProps } from "react";
import type { Path, RuleGroupType, RuleGroupTypeAny, RuleType } from "react-querybuilder";

import { CoreMinionCombinatorSelector } from "saltbox-core/shared/components/query-builder-salt-box/core-minion-combinator-selector";
import { CoreMinionValueEditor } from "saltbox-core/shared/components/query-builder-salt-box/core-minion-value-editor";
import { CoreMinionValueSelector } from "saltbox-core/shared/components/query-builder-salt-box/core-minion-value-selector";
import {
  normalizeItemGroupFields,
  resolveItemGroupDefaultField,
} from "saltbox-core/shared/helpers/filter-fields-for-item-group";
import {
  flattenMinionFilterSchemaFields,
  getDefaultMinionFilterField,
  MINION_SCHEMA_FIELDS_CONTEXT_KEY,
} from "saltbox-core/shared/helpers/minion-field-cascader";
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

    const schemaFields = useMemo(
      () => flattenMinionFilterSchemaFields(props.filterStore.filterSchema),
      [props.filterStore.filterSchema]
    );

    const handleAddRule = useCallback(
      (rule: RuleType, parentPath: Path, query: RuleGroupTypeAny) =>
        resolveItemGroupDefaultField(rule, parentPath, query, schemaFields),
      [schemaFields]
    );

    const prepareQueryChange = useCallback(
      (query: RuleGroupType) => normalizeItemGroupFields(query, schemaFields),
      [schemaFields]
    );

    const controlElements = useMemo(
      () =>
        ({
          valueEditor: CoreMinionValueEditor(props.slug),
          valueSelector: minionValueSelector,
          combinatorSelector: CoreMinionCombinatorSelector,
        }) as QueryBuilderControlElements,
      [props.slug]
    );

    const queryBuilderContext = useMemo(
      () => ({
        [MINION_SCHEMA_FIELDS_CONTEXT_KEY]: schemaFields,
      }),
      [schemaFields]
    );

    return (
      <SaltBoxQueryBuilderContainer
        className={styles.clientFilters}
        filterStore={props.filterStore}
        onSearchButtonClick={props.onSearch}
        onResetButtonClick={props.onReset}
        showCopyFilterButton
        enableFreeTextMode
        enableItemCombinators
        controlElements={controlElements}
        getDefaultField={getDefaultField}
        onAddRule={handleAddRule}
        prepareQueryChange={prepareQueryChange}
        queryBuilderContext={queryBuilderContext}
      />
    );
  }
);
