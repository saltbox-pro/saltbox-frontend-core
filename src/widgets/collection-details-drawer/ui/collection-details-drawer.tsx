import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  InfoDescriptions,
  type InfoDescriptionsProps,
  InfoDrawer,
  isGlobalServerError,
} from "@saltbox/saltbox-frontend-common";
import { Button, Flex, Form, Input, message, TreeSelect, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { COLLECTION_DESCRIPTION_MAX_LENGTH } from "saltbox-core/shared/constants/collection";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import { excludeSubtreeBySlug, findNodeBySlug } from "saltbox-core/shared/utils/tree-utils";
import { type CollectionStore, collectionsTreeStore } from "saltbox-core/store";

import type { CollectionDetailsDrawerOpenParams } from "../types";

import styles from "./collection-details-drawer.module.css";
import { CollectionFilterSection } from "./collection-filter-section";

const ROOT_SLUG = "root";

interface CollectionEditFormType {
  title: string;
  description?: string;
  query: string;
  parent_slug: string;
}

interface CollectionDetailsDrawerProps {
  drawer: {
    isOpened: boolean;
    openedArg: CollectionDetailsDrawerOpenParams | null;
    close: () => void;
  };
  collectionStore: CollectionStore;
  onCreateSubcollection?: (parentSlug: string) => void;
}

export const CollectionDetailsDrawer = observer(
  ({ drawer, collectionStore, onCreateSubcollection }: CollectionDetailsDrawerProps) => {
    const { t } = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();
    const [form] = Form.useForm<CollectionEditFormType>();

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { isOpened, openedArg } = drawer;

    useEffect(() => {
      if (isOpened && openedArg) {
        collectionStore.setCollectionSlug(openedArg.slug);
      }
    }, [isOpened, openedArg, collectionStore]);

    const collection = collectionStore.collection;
    const currentSlug = collectionStore.collectionSlug ?? openedArg?.slug;
    const isRoot = currentSlug === ROOT_SLUG;

    useEffect(() => {
      setIsEditing(false);
    }, [collectionStore.collectionSlug]);

    const parentTreeData = useMemo(
      () => (currentSlug ? excludeSubtreeBySlug(collectionsTreeStore.treeNodes, currentSlug) : []),
      [collectionsTreeStore.treeNodes, currentSlug]
    );

    const descriptionItems = useMemo<InfoDescriptionsProps["items"]>(() => {
      const items: NonNullable<InfoDescriptionsProps["items"]> = [
        {
          key: "title",
          label: t("collection.edit-collection-name"),
          children: isEditing ? (
            <Form.Item<CollectionEditFormType>
              name="title"
              style={{ marginBottom: 0 }}
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
          ) : (
            collection?.title
          ),
        },
        {
          key: "description",
          label: t("collection.description"),
          children: isEditing ? (
            <Form.Item<CollectionEditFormType>
              name="description"
              style={{ marginBottom: 0 }}
              rules={[
                {
                  max: COLLECTION_DESCRIPTION_MAX_LENGTH,
                  message: t("collection.description-max", {
                    max: COLLECTION_DESCRIPTION_MAX_LENGTH,
                  }),
                },
              ]}
            >
              <Input.TextArea rows={3} placeholder={t("collection.description-placeholder")} />
            </Form.Item>
          ) : collection?.description ? (
            collection.description
          ) : (
            <Typography.Text type="secondary" italic>
              {t("collection.no-description")}
            </Typography.Text>
          ),
        },
      ];

      if (!isRoot && (isEditing || collection?.parent_slug)) {
        items.push({
          key: "parent",
          label: t("collection.parent-collection"),
          children: isEditing ? (
            <Form.Item<CollectionEditFormType>
              name="parent_slug"
              style={{ marginBottom: 0 }}
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
          ) : (
            <Link to={`/core/minions/${collection!.parent_slug}`}>
              {collection!.parent_title ?? collection!.parent_slug}
            </Link>
          ),
        });
      }

      return items;
    }, [collection, isRoot, isEditing, parentTreeData, t]);

    const handleEdit = () => {
      collectionsTreeStore.loadTree();
      form.setFieldsValue({
        title: collection?.title,
        description: collection?.description,
        query: JSON.stringify(collection?.query ?? {}, null, 2),
        parent_slug: collection?.parent_slug ?? ROOT_SLUG,
      });
      setIsEditing(true);
    };

    const handleCancel = () => {
      setIsEditing(false);
    };

    const handleSave = async () => {
      let values: CollectionEditFormType;
      try {
        values = await form.validateFields();
      } catch {
        return;
      }

      let parsedQuery: object;
      try {
        parsedQuery = JSON.parse(values.query);
      } catch {
        messageApi.error(t("collection.invalid-filter-json"));
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
          messageApi.warning(t("collection.duplicate-title-on-move"));
          return;
        }
      }

      setIsSaving(true);
      try {
        await collectionStore.updateCollection({
          title: values.title,
          description: values.description?.trim() ?? "",
          query: parsedQuery,
        });

        if (newParent && collection) {
          const moved = await collectionsTreeStore.moveCollection(
            collection.id,
            newParent.id,
            newParent.children?.[0]?.id ?? null
          );
          if (!moved) {
            messageApi.error(t("collection.error-moving-collection"));
            return;
          }
          collectionStore.loadCollection();
        }

        messageApi.success(t("collection.collection-has-been-changed"));
        setIsEditing(false);
      } catch (error) {
        if (!isGlobalServerError(error)) {
          messageApi.error(t("collection.error-updating-collection"));
        }
      } finally {
        setIsSaving(false);
      }
    };

    const canCreateSubcollection = !!onCreateSubcollection && !!currentSlug;
    const extra =
      canCreateSubcollection || !isRoot ? (
        <Flex gap="small">
          {onCreateSubcollection && currentSlug && (
            <Button
              icon={<PlusOutlined />}
              onClick={() => onCreateSubcollection(currentSlug)}
              disabled={isEditing}
            >
              {t("collection.create-subcollection")}
            </Button>
          )}
          {!isRoot && (
            <Button icon={<EditOutlined />} onClick={handleEdit} disabled={isEditing}>
              {t("common.edit")}
            </Button>
          )}
        </Flex>
      ) : undefined;

    return (
      <>
        {contextHolder}
        <InfoDrawer
          drawerId={DRAWER_IDS.collectionDetails}
          open={isOpened}
          titleName={collection?.title}
          titleLabel={t("collection.collection")}
          linkTo={currentSlug ? `/core/minions/${currentSlug}` : undefined}
          linkTitle={t("collection.open-collection-page")}
          linkComponent={Link}
          loading={collectionStore.isLoading}
          hasData={!!collection && !isSaving}
          errorMessage={collectionStore.error ? t("collection.error-loading-collection") : null}
          transitionKey={collection?.slug}
          onClose={drawer.close}
        >
          <Form form={form} component={false}>
            <Flex vertical gap="large" className={styles.body}>
              <InfoDescriptions items={descriptionItems} extra={extra} />

              <section className={styles.section}>
                {isRoot ? (
                  <Typography.Text type="secondary">
                    {t("minions.root-collection-info")}
                  </Typography.Text>
                ) : (
                  <CollectionFilterSection
                    collectionStore={collectionStore}
                    isEditing={isEditing}
                    form={form}
                  />
                )}
              </section>

              {isEditing && (
                <Flex gap="small" justify="end">
                  <Button onClick={handleCancel} disabled={isSaving}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="primary" onClick={handleSave} loading={isSaving}>
                    {t("common.save")}
                  </Button>
                </Flex>
              )}
            </Flex>
          </Form>
        </InfoDrawer>
      </>
    );
  }
);
