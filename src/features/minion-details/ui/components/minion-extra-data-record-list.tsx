import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import {
  CopyToClipboardButton,
  FilterActionButton,
  InfoDescriptions,
  type InfoDescriptionsProps,
} from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getClientFilterActionTitle } from "saltbox-core/shared/helpers/client-filter-rule";
import {
  buildExtraDataFilterField,
  toExtraDataCopyValue,
} from "saltbox-core/shared/helpers/extra-data-value";
import type { ExtraDataRecord } from "saltbox-core/store";

import type { OnFilterButtonHandler } from "../../types/minion-details-props";

import styles from "./minion-extra-data-record-list.module.css";

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
  const { t } = useTranslation();

  const items = useMemo<InfoDescriptionsProps["items"]>(
    () =>
      fields.map((field) => {
        const value = record[field];
        const displayValue = toExtraDataCopyValue(value);
        const filterFieldName = buildExtraDataFilterField(category.source, category.name, field);
        const canFilter = !!onFilterButton && onFilterButton.canApply(filterFieldName, value);
        const isActive = !!onFilterButton && onFilterButton.isActive(filterFieldName, value);

        return {
          key: field,
          label: field,
          children: !displayValue ? undefined : (
            <Flex justify="space-between" gap="small">
              <Flex className={styles.value}>{displayValue}</Flex>
              <Flex gap={2} className={styles.actions}>
                <CopyToClipboardButton text={displayValue} />
                {canFilter && onFilterButton && (
                  <FilterActionButton
                    active={isActive}
                    title={getClientFilterActionTitle(isActive, t)}
                    onClick={() =>
                      onFilterButton({
                        name: filterFieldName,
                        value,
                      })
                    }
                  />
                )}
              </Flex>
            </Flex>
          ),
        };
      }),
    [fields, record, category, onFilterButton, t]
  );

  return <InfoDescriptions items={items} />;
}
