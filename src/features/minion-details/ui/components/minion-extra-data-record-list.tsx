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

import type { ExtraDataRecord } from "saltbox-core/store";

import type { OnFilterButtonHandler } from "../../types/minion-details-props";

import { isPrimitive, toCopyValue } from "./extra-data-cell";
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
        const displayValue = toCopyValue(value);
        const canFilter =
          !!onFilterButton &&
          (isPrimitive(value) || (Array.isArray(value) && value.every(isPrimitive)));

        return {
          key: field,
          label: field,
          children:
            value == null ? (
              ""
            ) : (
              <Flex justify="space-between" gap="small">
                <Flex className={styles.value}>{displayValue}</Flex>
                <Flex gap={2} className={styles.actions}>
                  <CopyToClipboardButton text={displayValue} />
                  {canFilter && (
                    <FilterActionButton
                      title={t("minions.extra-data.apply-to-filters")}
                      onClick={() =>
                        onFilterButton({
                          name: `extra.${category.source}.${category.name}.${field}`,
                          value,
                          keepDrawerOpen: true,
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
