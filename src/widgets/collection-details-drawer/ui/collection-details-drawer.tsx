import {
  type AppError,
  InfoDescriptions,
  type InfoDescriptionsProps,
  InfoDrawer,
  MutationErrorAlert,
  notify,
  runMutation,
} from "@saltbox/saltbox-frontend-common";
import { Flex, Form, Input, TreeSelect, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { type RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { COLLECTION_DESCRIPTION_MAX_LENGTH } from "saltbox-core/shared/constants/collection";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import { asFormFieldsSetter } from "saltbox-core/shared/helpers/as-form-fields-setter";
import {
  type DrawerCloseGuard,
  useUnsavedChangesCloseGuard,
} from "saltbox-core/shared/hooks/useUnsavedChangesCloseGuard";
import { excludeSubtreeBySlug, findNodeBySlug } from "saltbox-core/shared/utils/tree-utils";
import {
  MinionFilterStore,
  MinionsStore,
  collectionsTreeStore,
  type CollectionStore,
} from "saltbox-core/store";

import { COLLECTION_DETAILS_DRAWER_WIDTH, ROOT_SLUG } from "../constants";
import { getFilterStateKey } from "../helpers/get-filter-state-key";
import type { CollectionDetailsDrawerOpenParams, CollectionEditFormType } from "../types";

import { CollectionClientsPreview } from "./collection-clients-preview";
import { CollectionCreateSubcollectionButton } from "./collection-create-subcollection-button";
import styles from "./collection-details-drawer.module.css";
import { CollectionEditActions } from "./collection-edit-actions";
import { CollectionFilterSection } from "./collection-filter-section";

type CollectionDetailsDrawerProps = {
  drawer: {
    isOpened: boolean;
    openedArg: CollectionDetailsDrawerOpenParams | null;
    close: () => void | Promise<void>;
  };
  collectionStore: CollectionStore;
  closeGuardRef: RefObject<DrawerCloseGuard | null>;
  onCreateSubcollection?: (parentSlug: string) => void;
};

export const CollectionDetailsDrawer = observer(
  ({
    drawer,
    collectionStore,
    closeGuardRef,
    onCreateSubcollection,
  }: CollectionDetailsDrawerProps) => {
    const { t } = useTranslation();
    const [form] = Form.useForm<CollectionEditFormType>();
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<AppError | null>(null);
    const [filtersBaselineKey, setFiltersBaselineKey] = useState("");
    const [filterStore] = useState(() => new MinionFilterStore());
    const [minionsStore] = useState(() => new MinionsStore(undefined, undefined));

    const { isOpened, openedArg } = drawer;

    const watchedTitle = Form.useWatch("title", form);
    const watchedDescription = Form.useWatch("description", form);
    const watchedParentSlug = Form.useWatch("parent_slug", form);

    useEffect(() => {
      if (isOpened && openedArg) {
        collectionStore.setCollectionSlug(openedArg.slug);
      }
    }, [isOpened, openedArg, collectionStore]);

    const collection = collectionStore.collection;
    const currentSlug = collectionStore.collectionSlug ?? openedArg?.slug;
    const isRoot = currentSlug === ROOT_SLUG;
    const parentSlug = collection?.parent_slug || currentSlug || "";
    const searchQueryKey = JSON.stringify(filterStore.searchMongoDBQuery);
    const isInitialLoading = collectionStore.collectionLoad.isLoading;
    const isCollectionLoaded = Boolean(collection) && !isInitialLoading;
    const isEditable = isCollectionLoaded && !isRoot;

    const syncFromCollection = useCallback(() => {
      const current = collectionStore.collection;
      if (!current) {
        return;
      }

      form.setFieldsValue({
        title: current.title,
        description: current.description,
        parent_slug: current.parent_slug ?? ROOT_SLUG,
      });
      filterStore.resetInputMode();
      filterStore.initializeByQuery(current.query ?? {});
      setFiltersBaselineKey(getFilterStateKey(filterStore));
    }, [collectionStore, form, filterStore]);

    useEffect(() => {
      setSaveError(null);
      setFiltersBaselineKey("");
      filterStore.resetInputMode();
    }, [collectionStore.collectionSlug, filterStore]);

    useEffect(() => {
      filterStore.loadFiltersScheme();
    }, [filterStore]);

    useLayoutEffect(() => {
      if (!isOpened || !isCollectionLoaded) {
        return;
      }

      syncFromCollection();
      if (!isRoot) {
        collectionsTreeStore.loadTree();
      }
    }, [isOpened, isCollectionLoaded, currentSlug, isRoot, syncFromCollection]);

    const applyMinionsPreview = useCallback(() => {
      if (!parentSlug || isRoot) {
        return;
      }
      minionsStore.syncAndLoad(parentSlug, filterStore.searchMongoDBQuery);
    }, [parentSlug, isRoot, filterStore, minionsStore]);

    useLayoutEffect(() => {
      if (!isCollectionLoaded || !parentSlug || isRoot) {
        return;
      }
      if (filterStore.activeFiltersCount > 0 && filterStore.isLoading) {
        return;
      }
      applyMinionsPreview();
    }, [
      isCollectionLoaded,
      parentSlug,
      isRoot,
      searchQueryKey,
      filterStore.activeFiltersCount,
      filterStore.isLoading,
      applyMinionsPreview,
    ]);

    const parentTreeData = useMemo(
      () => (currentSlug ? excludeSubtreeBySlug(collectionsTreeStore.treeNodes, currentSlug) : []),
      [collectionsTreeStore.treeNodes, currentSlug]
    );

    const isFormDirty =
      isEditable &&
      ((watchedTitle ?? "") !== (collection?.title ?? "") ||
        (watchedDescription ?? "").trim() !== (collection?.description ?? "").trim() ||
        (watchedParentSlug ?? ROOT_SLUG) !== (collection?.parent_slug ?? ROOT_SLUG));

    const isFiltersDirty =
      isEditable &&
      Boolean(filtersBaselineKey) &&
      getFilterStateKey(filterStore) !== filtersBaselineKey;

    const hasUnsavedChanges = isFormDirty || isFiltersDirty;
    const canCreateSubcollection = !!onCreateSubcollection && !!currentSlug;

    const modalContextHolder = useUnsavedChangesCloseGuard({
      closeGuardRef,
      hasUnsavedChanges,
      onDiscard: syncFromCollection,
    });

    const descriptionItems = useMemo<InfoDescriptionsProps["items"]>(() => {
      if (!isEditable) {
        return [
          {
            key: "title",
            label: t("collection.edit-collection-name"),
            children: collection?.title,
          },
          {
            key: "description",
            label: t("collection.description"),
            children: collection?.description ? (
              collection.description
            ) : (
              <Typography.Text type="secondary" italic>
                {t("collection.no-description")}
              </Typography.Text>
            ),
          },
        ];
      }

      const items: NonNullable<InfoDescriptionsProps["items"]> = [
        {
          key: "title",
          label: t("collection.edit-collection-name"),
          children: (
            <Form.Item<CollectionEditFormType>
              name="title"
              className={styles.noMargin}
              rules={[
                {
                  required: true,
                  message: t("collection-create-modal.form-title-error-required"),
                },
                {
                  max: 50,
                  message: t("collection-create-modal.form-title-error-max"),
                },
              ]}
            >
              <Input placeholder={t("collection.enter-collection-name")} />
            </Form.Item>
          ),
        },
        {
          key: "description",
          label: t("collection.description"),
          children: (
            <Form.Item<CollectionEditFormType>
              name="description"
              className={styles.noMargin}
              rules={[
                {
                  max: COLLECTION_DESCRIPTION_MAX_LENGTH,
                  message: t("collection.description-max", {
                    max: COLLECTION_DESCRIPTION_MAX_LENGTH,
                  }),
                },
              ]}
            >
              <Input.TextArea rows={2} placeholder={t("collection.description-placeholder")} />
            </Form.Item>
          ),
        },
        {
          key: "parent",
          label: t("collection.parent-collection"),
          children: (
            <Form.Item<CollectionEditFormType>
              name="parent_slug"
              className={styles.noMargin}
              rules={[
                {
                  required: true,
                  message: t("collection.parent-collection-required"),
                },
              ]}
            >
              <TreeSelect
                showSearch
                treeNodeFilterProp="title"
                treeDefaultExpandAll
                fieldNames={{ label: "title", value: "slug" }}
                treeData={parentTreeData}
                placeholder={t("collection.select-parent-collection")}
                style={{ width: "100%" }}
              />
            </Form.Item>
          ),
        },
      ];

      return items;
    }, [collection, isEditable, parentTreeData, t]);

    const handleReset = () => {
      setSaveError(null);
      syncFromCollection();
      applyMinionsPreview();
    };

    const resolveQueryForSave = (): object | null => {
      if (!filterStore.commitPendingInput()) {
        notify.error(t("collection.invalid-filter-json"));
        return null;
      }
      filterStore.handleSearch();
      return filterStore.searchMongoDBQuery;
    };

    const handleSave = async () => {
      let values: CollectionEditFormType;
      try {
        values = await form.validateFields(["title", "description", "parent_slug"]);
      } catch {
        return;
      }

      const parsedQuery = resolveQueryForSave();
      if (!parsedQuery) {
        return;
      }

      const currentParentSlug = collection?.parent_slug ?? ROOT_SLUG;
      const parentChanged = values.parent_slug !== currentParentSlug;
      const newParent = parentChanged
        ? findNodeBySlug(collectionsTreeStore.treeNodes, values.parent_slug)
        : null;

      if (parentChanged) {
        const hasDuplicateTitle = newParent?.children?.some(
          (child) => child.title === values.title && child.slug !== currentSlug
        );
        if (hasDuplicateTitle) {
          notify.warning(t("collection.duplicate-title-on-move"));
          return;
        }
      }

      setIsSaving(true);
      setSaveError(null);

      const result = await runMutation({
        run: async () => {
          await collectionStore.updateCollection({
            title: values.title,
            description: values.description?.trim() ?? "",
            query: parsedQuery,
          });

          if (newParent && collection) {
            await collectionsTreeStore.moveCollection(
              collection.id,
              newParent.id,
              newParent.children?.[0]?.id ?? null
            );
            collectionStore.loadCollection();
          }
        },
        onError: setSaveError,
        form: asFormFieldsSetter(form),
      });

      setIsSaving(false);
      if (!result.ok) return;

      notify.success(t("collection.collection-has-been-changed"));
      filterStore.resetInputMode();
      setFiltersBaselineKey(getFilterStateKey(filterStore));
    };

    const createSubcollectionButton =
      canCreateSubcollection && currentSlug ? (
        <CollectionCreateSubcollectionButton
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          onClick={() => onCreateSubcollection?.(currentSlug)}
        />
      ) : undefined;

    return (
      <>
        {modalContextHolder}
        <InfoDrawer
          drawerId={DRAWER_IDS.collectionDetails}
          open={isOpened}
          width={COLLECTION_DETAILS_DRAWER_WIDTH}
          fillHeight
          titleName={collection?.title}
          titleLabel={t("collection.collection")}
          linkTo={currentSlug ? `/core/minions/${currentSlug}` : undefined}
          linkTitle={t("collection.open-collection-page")}
          linkComponent={Link}
          loading={isInitialLoading}
          hasData={!!collection}
          loaders={[collectionStore.collectionLoad]}
          transitionKey={collection?.slug}
          onClose={drawer.close}
        >
          <Form form={form} component={false}>
            <Flex vertical gap="middle" className={styles.body}>
              <MutationErrorAlert
                error={saveError}
                fallback={t("collection.error-updating-collection")}
                onClose={() => setSaveError(null)}
              />

              <InfoDescriptions
                title={createSubcollectionButton}
                items={descriptionItems}
                extra={
                  isEditable ? (
                    <CollectionEditActions
                      hasUnsavedChanges={hasUnsavedChanges}
                      isSaving={isSaving}
                      onReset={handleReset}
                      onSave={handleSave}
                    />
                  ) : undefined
                }
              />

              <section className={styles.section}>
                {isRoot ? (
                  <Typography.Text type="secondary">
                    {t("minions.root-collection-info")}
                  </Typography.Text>
                ) : (
                  <>
                    <CollectionFilterSection
                      filterStore={filterStore}
                      parentSlug={parentSlug}
                      onFiltersApplied={applyMinionsPreview}
                    />
                    {currentSlug && (
                      <CollectionClientsPreview
                        slug={currentSlug}
                        filterStore={filterStore}
                        minionsStore={minionsStore}
                        onFiltersApplied={applyMinionsPreview}
                      />
                    )}
                  </>
                )}
              </section>
            </Flex>
          </Form>
        </InfoDrawer>
      </>
    );
  }
);
