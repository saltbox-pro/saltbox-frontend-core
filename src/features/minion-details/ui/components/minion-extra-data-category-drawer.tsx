import { DeleteOutlined } from "@ant-design/icons";
import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import {
  FastTable,
  ErrorZone,
  InfoDrawer,
  type InfoDrawerProps,
} from "@saltbox/saltbox-frontend-common";
import { Button, Skeleton } from "antd";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  AddExtraDataButton,
  ExtraDataItemModal,
  canAddExtraDataManually,
  useDeleteExtraDataItemConfirm,
} from "saltbox-core/features/minion-extra-data-editor";
import { ExtraDataSearchField } from "saltbox-core/shared/components/extra-data-search-field";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";
import {
  collectExtraDataFieldNamesFromRecords,
  getDeclaredExtraDataFieldNames,
} from "saltbox-core/shared/helpers/extra-data-value";
import { ExtraDataRecordsStore } from "saltbox-core/store";

import type { OnFilterButtonHandler } from "../../types/minion-details-props";

import styles from "./minion-extra-data-category-drawer.module.css";
import { MinionExtraDataRecordList } from "./minion-extra-data-record-list";
import { MinionExtraDataRecordTable } from "./minion-extra-data-record-table";

export type MinionExtraDataCategoryDrawerProps = Omit<
  InfoDrawerProps,
  "drawerId" | "titleName" | "titleLabel" | "children" | "hasData" | "errorMessage"
> & {
  category: ExtraDataCategoryModel | null;
  minionId: string;
  collectionSlug: string;
  onFilterButton?: OnFilterButtonHandler;
};

export const MinionExtraDataCategoryDrawer = observer<MinionExtraDataCategoryDrawerProps>(
  function MinionExtraDataCategoryDrawer({
    category,
    minionId,
    collectionSlug,
    open,
    onFilterButton,
    ...restProps
  }) {
    const { t } = useTranslation();
    const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);

    const categoryId = category?.id;
    const canAddItem = !!category && canAddExtraDataManually(category);

    const extraDataRecordsStore = useMemo(() => {
      if (!categoryId) {
        return null;
      }

      return new ExtraDataRecordsStore({
        minionId,
        categoryId,
        collectionSlug,
      });
    }, [categoryId, minionId, collectionSlug]);

    useEffect(() => {
      if (!extraDataRecordsStore) return;

      extraDataRecordsStore.loadRecords();

      return () => {
        extraDataRecordsStore.abortLoading();
      };
    }, [extraDataRecordsStore]);

    const handleItemDeleted = useCallback(() => {
      extraDataRecordsStore?.reloadAfterRecordDeleted();
    }, [extraDataRecordsStore]);

    const itemDeletion = useDeleteExtraDataItemConfirm({
      category,
      minionId,
      onDeleted: handleItemDeleted,
    });

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

    const recordsLoad = extraDataRecordsStore?.recordsLoad;
    const loadStatus = recordsLoad?.status;
    const isLoaded = !!recordsLoad && !recordsLoad.isInitialLoad;
    const showSkeleton = !!recordsLoad && recordsLoad.isInitialLoad && loadStatus !== "error";
    const singleRecord =
      isLoaded && extraDataRecordsStore?.isSingleRecord && records && records.length > 0
        ? toJS(records[0])
        : null;
    const canDeleteSingleRecord = !!singleRecord && itemDeletion.canDelete(singleRecord);

    return (
      <InfoDrawer
        open={open}
        drawerId={DRAWER_IDS.extraDataCategoryDetails}
        titleName={category ? getExtraDataCategoryDisplayName(t, category.name) : undefined}
        transitionKey={open ? (category?.id ?? "opened") : "closed"}
        {...restProps}
        titleCopyable={false}
      >
        {!!extraDataRecordsStore && (
          <ErrorZone level="block" loaders={[extraDataRecordsStore.recordsLoad]}>
            <FastTable.Provider>
              {isLoaded && (!singleRecord || canAddItem || canDeleteSingleRecord) && (
                <div className="page-actions-buttons">
                  {canAddItem && <AddExtraDataButton onClick={() => setIsCreateItemOpen(true)} />}
                  {canDeleteSingleRecord && (
                    <div className={styles.trailingActions}>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => itemDeletion.openConfirm(singleRecord)}
                      >
                        {t("minions.extra-data.delete-item.button")}
                      </Button>
                    </div>
                  )}
                  {!singleRecord && (
                    <>
                      <ExtraDataSearchField key={category?.name} onSearch={handleSearch} />
                      <FastTable.Toolbar />
                    </>
                  )}
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
                  canDeleteRecord={itemDeletion.canDelete}
                  onDeleteRecord={itemDeletion.openConfirm}
                />
              )}
            </FastTable.Provider>
          </ErrorZone>
        )}

        {itemDeletion.modalContextHolder}

        {canAddItem && (
          <ExtraDataItemModal
            open={isCreateItemOpen}
            minionId={minionId}
            category={category}
            onCancel={() => setIsCreateItemOpen(false)}
            onSuccess={() => extraDataRecordsStore?.loadRecords()}
          />
        )}
      </InfoDrawer>
    );
  }
);
