import { CopyOutlined, PlusOutlined } from "@ant-design/icons";
import {
  type AppError,
  freeTextErrorI18nKey,
  InfoDescriptions,
  type InfoDescriptionsProps,
  InfoDrawer,
  MutationErrorAlert,
  notify,
  runMutation,
} from "@saltbox/saltbox-frontend-common";
import { Flex, Form, Input, type InputRef, TreeSelect, Typography } from "antd";
import { observer } from "mobx-react-lite";
import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
  COLLECTION_DESCRIPTION_MAX_LENGTH,
  ROOT_COLLECTION_SLUG,
} from "saltbox-core/shared/constants/collection";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import { asFormFieldsSetter } from "saltbox-core/shared/helpers/as-form-fields-setter";
import { localizeCollectionReferenceError } from "saltbox-core/shared/helpers/localize-collection-reference-error";
import { useMinionFilterSchemaLocalization } from "saltbox-core/shared/hooks/useMinionFilterSchemaLocalization";
import {
  type DrawerCloseGuard,
  useUnsavedChangesCloseGuard,
} from "saltbox-core/shared/hooks/useUnsavedChangesCloseGuard";
import { excludeSubtreeBySlug, findNodeBySlug } from "saltbox-core/shared/utils/tree-utils";
import {
  MinionFilterStore,
  MinionsStore,
  collectionsFlatListStore,
  collectionsTreeStore,
  type CollectionStore,
} from "saltbox-core/store";

import {
  COLLECTION_DETAILS_DRAWER_PUSH_DISTANCE,
  COLLECTION_DETAILS_DRAWER_WIDTH,
} from "../constants";
import { getFilterStateKey } from "../helpers/get-filter-state-key";
import { buildViewOpenParams } from "../helpers/open-params";
import { useCollectionCreate } from "../hooks/use-collection-create";
import { useCollectionCreateDraft } from "../hooks/use-collection-create-draft";
import { useDuplicateSource } from "../hooks/use-duplicate-source";
import type { CollectionDetailsDrawerOpenParams, CollectionEditFormType } from "../types";

import { CollectionClientsPreview } from "./collection-clients-preview";
import { CollectionCreateActions } from "./collection-create-actions";
import styles from "./collection-details-drawer.module.css";
import { CollectionEditActions } from "./collection-edit-actions";
import { CollectionFilterSection } from "./collection-filter-section";
import { CollectionHeaderActionButton } from "./collection-header-action-button";
import { ValidateFieldsOnMount } from "./validate-fields-on-mount";

const DUPLICATE_VALIDATED_FIELDS = ["title"] as const;

type CollectionDetailsDrawerProps = {
  drawer: {
    isOpened: boolean;
    openedArg: CollectionDetailsDrawerOpenParams | null;
    open: (arg: CollectionDetailsDrawerOpenParams) => void | Promise<void>;
    close: () => void | Promise<void>;
  };
  collectionStore: CollectionStore;
  closeGuardRef: RefObject<DrawerCloseGuard | null>;
  onCreateSubcollection?: (parentSlug: string) => void;
  onDuplicate?: (sourceSlug: string) => void;
};

export const CollectionDetailsDrawer = observer(
  ({
    drawer,
    collectionStore,
    closeGuardRef,
    onCreateSubcollection,
    onDuplicate,
  }: CollectionDetailsDrawerProps) => {
    const { t } = useTranslation();
    const { t: tCommon } = useTranslation("common");
    const [form] = Form.useForm<CollectionEditFormType>();
    const titleInputRef = useRef<InputRef>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<AppError | null>(null);
    const handleMutationError = useCallback(
      (error: AppError | null) =>
        setSaveError(
          error ? localizeCollectionReferenceError(error, t, collectionsFlatListStore.items) : null
        ),
      [t]
    );
    const [filtersBaselineKey, setFiltersBaselineKey] = useState("");
    const [filterStore] = useState(() => new MinionFilterStore());
    const [minionsStore] = useState(() => new MinionsStore(undefined, undefined));

    const { isOpened, openedArg } = drawer;
    const viewSlug = openedArg?.mode === "view" ? openedArg.slug : undefined;
    const duplicateArg = openedArg?.mode === "duplicate" ? openedArg : undefined;

    const { sourceCollection, sourceLoad } = useDuplicateSource(
      duplicateArg?.sourceSlug,
      duplicateArg?.preloadedSource
    );
    const {
      isCreateMode,
      isDuplicateMode,
      isCreateFormReady,
      createParentSlug,
      createDraft,
      createFiltersBaselineKey,
      draftVersion,
      resetCreateDraft,
    } = useCollectionCreateDraft({ form, filterStore, openedArg, sourceCollection });
    const activeCollectionLoad = isDuplicateMode ? sourceLoad : collectionStore.collectionLoad;

    useLayoutEffect(() => {
      if (isCreateMode) {
        collectionStore.reset();
      }
    }, [isCreateMode, collectionStore]);

    const watchedTitle = Form.useWatch("title", { form, preserve: true });
    const watchedDescription = Form.useWatch("description", { form, preserve: true });
    const watchedParentSlug = Form.useWatch("parent_slug", { form, preserve: true });

    useEffect(() => {
      if (isOpened && viewSlug) {
        collectionStore.setCollectionSlug(viewSlug);
      }
    }, [isOpened, openedArg, viewSlug, collectionStore]);

    useEffect(() => {
      setSaveError(null);
    }, [openedArg?.id]);

    const collection = isCreateMode ? undefined : collectionStore.collection;
    const currentSlug = isCreateMode ? undefined : (collectionStore.collectionSlug ?? viewSlug);
    const isRoot = currentSlug === ROOT_COLLECTION_SLUG;

    useMinionFilterSchemaLocalization(filterStore, { excludeCollectionSlug: currentSlug });

    const parentSlug = isCreateMode
      ? ((isCreateFormReady ? watchedParentSlug : createParentSlug) ?? "")
      : collection?.parent_slug || currentSlug || "";
    const clientsSlug = isCreateMode ? parentSlug : currentSlug;
    const searchQueryKey = JSON.stringify(filterStore.searchMongoDBQuery);
    const isInitialLoading = activeCollectionLoad.isLoading;
    const isCollectionLoaded = Boolean(collection) && !isInitialLoading;
    const isReady = isCreateMode ? isCreateFormReady : isCollectionLoaded;
    const isEditable = isReady && !isRoot;

    const syncFromCollection = useCallback(() => {
      const current = collectionStore.collection;
      if (!current) {
        return;
      }

      form.setFieldsValue({
        title: current.title,
        description: current.description,
        parent_slug: current.parent_slug ?? ROOT_COLLECTION_SLUG,
      });
      filterStore.resetInputMode();
      filterStore.initializeByQuery(current.query ?? {});
      setFiltersBaselineKey(getFilterStateKey(filterStore));
    }, [collectionStore, form, filterStore]);

    const focusTitleInput = useCallback(() => {
      requestAnimationFrame(() => titleInputRef.current?.focus({ preventScroll: true }));
    }, []);

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

    useEffect(() => {
      if (isOpened) {
        return;
      }

      filterStore.resetInputMode();
      filterStore.handleResetFiltersSilent();
    }, [isOpened, filterStore]);

    const applyMinionsPreview = useCallback(() => {
      if (!parentSlug || isRoot) {
        return;
      }
      minionsStore.syncAndLoad(parentSlug, filterStore.searchMongoDBQuery);
    }, [parentSlug, isRoot, filterStore, minionsStore]);

    useLayoutEffect(() => {
      if (!isOpened || !isReady || !parentSlug || isRoot) {
        return;
      }
      if (filterStore.activeFiltersCount > 0 && filterStore.isLoading) {
        return;
      }
      applyMinionsPreview();
    }, [
      isOpened,
      isReady,
      parentSlug,
      isRoot,
      searchQueryKey,
      filterStore.activeFiltersCount,
      filterStore.isLoading,
      applyMinionsPreview,
    ]);

    const parentTreeData = useMemo(() => {
      if (isCreateMode) {
        return collectionsTreeStore.treeNodes;
      }
      return currentSlug ? excludeSubtreeBySlug(collectionsTreeStore.treeNodes, currentSlug) : [];
    }, [collectionsTreeStore.treeNodes, currentSlug, isCreateMode]);

    const initialTitle = isCreateMode ? createDraft?.title : collection?.title;
    const initialDescription = isCreateMode ? createDraft?.description : collection?.description;
    const initialParentSlug = isCreateMode ? createDraft?.parent_slug : collection?.parent_slug;
    const initialFiltersKey = isCreateMode ? createFiltersBaselineKey : filtersBaselineKey;

    const isFormDirty =
      isEditable &&
      ((watchedTitle ?? "") !== (initialTitle ?? "") ||
        (watchedDescription ?? "").trim() !== (initialDescription ?? "").trim() ||
        (watchedParentSlug ?? ROOT_COLLECTION_SLUG) !==
          (initialParentSlug ?? ROOT_COLLECTION_SLUG));

    const isFiltersDirty =
      isEditable &&
      Boolean(initialFiltersKey) &&
      getFilterStateKey(filterStore) !== initialFiltersKey;

    const hasUnsavedChanges = isFormDirty || isFiltersDirty;
    const canCreateSubcollection = !!onCreateSubcollection && !!currentSlug;
    const canDuplicate = !!onDuplicate && isCollectionLoaded && !isRoot;

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
              <Input
                ref={titleInputRef}
                autoFocus={isCreateMode}
                placeholder={t("collection.enter-collection-name")}
              />
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
    }, [collection, isEditable, isCreateMode, parentTreeData, t]);

    const handleReset = () => {
      setSaveError(null);
      if (isCreateMode) {
        resetCreateDraft();
        return;
      }
      syncFromCollection();
      applyMinionsPreview();
    };

    const resolveQueryForSave = (): object | null => {
      const committed = filterStore.commitPendingInput();
      if (committed.ok === false) {
        notify.error(tCommon(freeTextErrorI18nKey(committed.reason)));
        return null;
      }
      filterStore.handleSearch();
      return filterStore.searchMongoDBQuery;
    };

    const { handleCreate, isCreating } = useCollectionCreate({
      form,
      resolveQuery: resolveQueryForSave,
      onError: handleMutationError,
      onCreated: (created) => drawer.open(buildViewOpenParams(created.id, created.slug)),
    });

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

      const currentParentSlug = collection?.parent_slug ?? ROOT_COLLECTION_SLUG;
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
        onError: handleMutationError,
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
        <CollectionHeaderActionButton
          icon={<PlusOutlined />}
          label={t("collection.create-subcollection")}
          blockedTooltip={t("collection.tooltip-create-subcollection-blocked")}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          onClick={() => onCreateSubcollection?.(currentSlug)}
        />
      ) : undefined;

    const duplicateButton =
      canDuplicate && currentSlug ? (
        <CollectionHeaderActionButton
          icon={<CopyOutlined />}
          label={t("collection.duplicate")}
          blockedTooltip={t("collection.tooltip-duplicate-blocked")}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          onClick={() => onDuplicate?.(currentSlug)}
        />
      ) : undefined;

    const headerActions =
      createSubcollectionButton || duplicateButton ? (
        <Flex gap="small" wrap>
          {createSubcollectionButton}
          {duplicateButton}
        </Flex>
      ) : undefined;

    const titleLabelKey = isDuplicateMode
      ? "collection.duplicate-drawer-title"
      : isCreateMode
        ? "collection-create-modal.dialog-title"
        : "collection.collection";

    return (
      <>
        {modalContextHolder}
        <InfoDrawer
          drawerId={DRAWER_IDS.collectionDetails}
          open={isOpened}
          width={`min(${COLLECTION_DETAILS_DRAWER_WIDTH}px, calc(100vw - ${COLLECTION_DETAILS_DRAWER_PUSH_DISTANCE}px))`}
          push={{ distance: COLLECTION_DETAILS_DRAWER_PUSH_DISTANCE }}
          fillHeight
          titleName={isDuplicateMode ? sourceCollection?.title : collection?.title}
          titleLabel={t(titleLabelKey)}
          linkTo={currentSlug ? `/core/minions/${currentSlug}` : undefined}
          linkTitle={t("collection.open-collection-page")}
          linkComponent={Link}
          loading={isInitialLoading}
          hasData={isCreateMode ? isCreateFormReady : !!collection}
          loaders={[activeCollectionLoad]}
          transitionKey={isCreateMode ? openedArg?.id : collection?.slug}
          afterOpenChange={(open) => {
            if (open && isCreateMode) {
              focusTitleInput();
            }
          }}
          onClose={drawer.close}
        >
          <Form form={form} component={false}>
            <Flex vertical gap="middle" className={styles.body}>
              <MutationErrorAlert
                error={saveError}
                fallback={t(
                  isCreateMode
                    ? "collection-create-modal.error"
                    : "collection.error-updating-collection"
                )}
                onClose={() => setSaveError(null)}
              />

              <InfoDescriptions
                title={headerActions}
                items={descriptionItems}
                extra={
                  isCreateMode ? (
                    <CollectionCreateActions
                      hasUnsavedChanges={hasUnsavedChanges}
                      isCreating={isCreating}
                      onReset={handleReset}
                      onCreate={handleCreate}
                    />
                  ) : isEditable ? (
                    <CollectionEditActions
                      hasUnsavedChanges={hasUnsavedChanges}
                      isSaving={isSaving}
                      onReset={handleReset}
                      onSave={handleSave}
                    />
                  ) : undefined
                }
              />
              {isDuplicateMode && (
                <ValidateFieldsOnMount
                  key={draftVersion}
                  form={form}
                  names={DUPLICATE_VALIDATED_FIELDS}
                />
              )}

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
                    {clientsSlug && (
                      <CollectionClientsPreview
                        slug={clientsSlug}
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
