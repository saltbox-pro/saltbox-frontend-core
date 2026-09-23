import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import {
  FastTable,
  ErrorZone,
  InfoDrawer,
  RefreshButton,
  type InfoDrawerProps,
} from "@saltbox/saltbox-frontend-common";
import { Skeleton } from "antd";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ExtraDataSearchField } from "saltbox-core/shared/components/extra-data-search-field";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import {
  collectExtraDataFieldNamesFromRecords,
  getDeclaredExtraDataFieldNames,
} from "saltbox-core/shared/helpers/extra-data-value";
import { ExtraDataRecordsStore } from "saltbox-core/store";

import type { OnFilterButtonHandler } from "../../types/minion-details-props";

import { MinionExtraDataRecordList } from "./minion-extra-data-record-list";
import { MinionExtraDataRecordTable } from "./minion-extra-data-record-table";

export type MinionExtraDataCategoryDrawerProps = Omit<
  InfoDrawerProps,
  "drawerId" | "titleName" | "titleLabel" | "children" | "hasData" | "errorMessage"
> & {
  category: ExtraDataCategoryModel | null;
  minionId: string;
  onFilterButton?: OnFilterButtonHandler;
};

export const MinionExtraDataCategoryDrawer = observer<MinionExtraDataCategoryDrawerProps>(
  function MinionExtraDataCategoryDrawer({
    category,
    minionId,
    open,
    onFilterButton,
    ...restProps
  }) {
    const { t } = useTranslation();

    const categoryId = category?.id;

    const extraDataRecordsStore = useMemo(() => {
      if (!categoryId) {
        return null;
      }

      return new ExtraDataRecordsStore({
        minionId,
        categoryId,
      });
    }, [categoryId, minionId]);

    useEffect(() => {
      if (!extraDataRecordsStore) return;

      extraDataRecordsStore.loadRecords();

      return () => {
        extraDataRecordsStore.reset();
      };
    }, [extraDataRecordsStore]);

    const records = extraDataRecordsStore?.records;

    const declaredFields = useMemo(
      () => (category ? getDeclaredExtraDataFieldNames(category) : []),
      [category]
    );

    const fields = useMemo(() => {
      if (declaredFields.length > 0) {
        return declaredFields;
      }

      return collectExtraDataFieldNamesFromRecords(records ?? []);
    }, [declaredFields, records]);

    const handleSearch = (value: string) => {
      extraDataRecordsStore?.setSearch(value);
    };

    const loadStatus = extraDataRecordsStore?.recordsLoad.status;
    const isLoaded = loadStatus === "success";
    const showSkeleton = !!extraDataRecordsStore && !isLoaded && loadStatus !== "error";
    const singleRecord =
      isLoaded && extraDataRecordsStore?.isSingleRecord && records && records.length > 0
        ? toJS(records[0])
        : null;

    return (
      <InfoDrawer
        open={open}
        drawerId={DRAWER_IDS.extraDataCategoryDetails}
        titleName={
          category
            ? t(`minions.extra-data.categories.${category.name}`, {
                defaultValue: category.name,
              })
            : undefined
        }
        transitionKey={open ? (category?.id ?? "opened") : "closed"}
        {...restProps}
        titleCopyable={false}
      >
        {!!extraDataRecordsStore && (
          <ErrorZone level="block" loaders={[extraDataRecordsStore.recordsLoad]}>
            <FastTable.Provider>
              {isLoaded && !singleRecord && (
                <div className="page-actions-buttons">
                  <div className="page-actions-buttons-right">
                    <ExtraDataSearchField key={category?.name} onSearch={handleSearch} />
                    <RefreshButton
                      loading={extraDataRecordsStore.isLoading}
                      disabled={extraDataRecordsStore.isLoading}
                      onClick={() => extraDataRecordsStore.loadRecords()}
                    />
                    <FastTable.Toolbar />
                  </div>
                </div>
              )}

              {showSkeleton && <Skeleton active />}

              {isLoaded && singleRecord && category && (
                <MinionExtraDataRecordList
                  record={singleRecord}
                  fields={fields}
                  category={category}
                  onFilterButton={onFilterButton}
                />
              )}

              {isLoaded && !singleRecord && category && (
                <MinionExtraDataRecordTable
                  store={extraDataRecordsStore}
                  fields={fields}
                  category={category}
                  onFilterButton={onFilterButton}
                />
              )}
            </FastTable.Provider>
          </ErrorZone>
        )}
      </InfoDrawer>
    );
  }
);
