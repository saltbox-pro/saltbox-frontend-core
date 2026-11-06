import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import {
  FilterActionButton,
  InfoDescriptions,
  type InfoDescriptionsItem,
} from "@saltbox/saltbox-frontend-common";
import { useMemo } from "react";

import {
  buildExtraDataFilterField,
  toExtraDataCopyValue,
} from "saltbox-core/shared/helpers/extra-data-value";
import type { ExtraDataRecord } from "saltbox-core/store";

import type { OnFilterButtonHandler } from "../../types/minion-details-props";

export interface MinionExtraDataRecordListProps {
  record: ExtraDataRecord;
  fields: string[];
  category: ExtraDataCategoryModel;
  onFilterButton?: OnFilterButtonHandler;
}

export function MinionExtraDataRecordList({
  record,
  fields,
  category,
  onFilterButton,
}: MinionExtraDataRecordListProps) {
  const items = useMemo<InfoDescriptionsItem[]>(
    () =>
      fields.map((field) => {
        const value = record[field];
        const displayValue = toExtraDataCopyValue(value);
        if (!displayValue) {
          return { key: field, label: field, children: undefined };
        }

        const filterFieldName = buildExtraDataFilterField(category.source, category.name, field);

        return {
          key: field,
          label: field,
          children: displayValue,
          copyText: displayValue,
          actions: onFilterButton?.canApply(filterFieldName, value) && (
            <FilterActionButton
              active={onFilterButton.isActive(filterFieldName, value)}
              onClick={() => onFilterButton({ name: filterFieldName, value })}
            />
          ),
        };
      }),
    [fields, record, category, onFilterButton]
  );

  return <InfoDescriptions items={items} />;
}
