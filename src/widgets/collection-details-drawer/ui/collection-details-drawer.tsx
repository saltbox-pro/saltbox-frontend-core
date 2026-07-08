import { EditOutlined } from "@ant-design/icons";
import {
  InfoDescriptions,
  type InfoDescriptionsProps,
  InfoDrawer,
} from "@saltbox/saltbox-frontend-common";
import { Button, Flex, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import CollectionEditModal from "saltbox-core/shared/components/collection-edit-modal/collection-edit-modal";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import { findNodeById } from "saltbox-core/shared/utils/tree-utils";
import { collectionsTreeStore, type CollectionStore } from "saltbox-core/store";

import type { CollectionDetailsDrawerOpenParams } from "../types";

import styles from "./collection-details-drawer.module.css";
import { CollectionFilterSection } from "./collection-filter-section";

const ROOT_SLUG = "root";

interface CollectionDetailsDrawerProps {
  drawer: {
    isOpened: boolean;
    openedArg: CollectionDetailsDrawerOpenParams | null;
    close: () => void;
  };
  collectionStore: CollectionStore;
}

export const CollectionDetailsDrawer = observer(
  ({ drawer, collectionStore }: CollectionDetailsDrawerProps) => {
    const { t } = useTranslation();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { isOpened, openedArg } = drawer;

    useEffect(() => {
      if (isOpened && openedArg) {
        collectionStore.setCollectionSlug(openedArg.slug);
      }
    }, [isOpened, openedArg, collectionStore]);

    const collection = collectionStore.collection;
    const currentSlug = collectionStore.collectionSlug ?? openedArg?.slug;
    const isRoot = currentSlug === ROOT_SLUG;

    const descriptionItems = useMemo<InfoDescriptionsProps["items"]>(() => {
      const items: NonNullable<InfoDescriptionsProps["items"]> = [
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

      if (!isRoot && collection?.parent_slug) {
        items.push({
          key: "parent",
          label: t("collection.parent-collection"),
          children: (
            <Link to={`/core/minions/${collection.parent_slug}`}>
              {collection.parent_title ?? collection.parent_slug}
            </Link>
          ),
        });
      }

      return items;
    }, [collection, isRoot, t]);

    const handleEditModalClose = (success: boolean) => {
      setIsEditModalOpen(false);
      // После переименования slug мог смениться — находим узел по стабильному id
      // и перечитываем деталь, чтобы шапка, ссылка и тело обновились.
      if (success && openedArg) {
        const node = findNodeById(collectionsTreeStore.treeNodes, openedArg.id);
        if (node?.slug && node.slug !== collectionStore.collectionSlug) {
          collectionStore.setCollectionSlug(node.slug);
        }
      }
    };

    return (
      <>
        <InfoDrawer
          drawerId={DRAWER_IDS.collectionDetails}
          open={isOpened}
          titleName={collection?.title}
          titleLabel={t("collection.collection")}
          linkTo={currentSlug ? `/core/minions/${currentSlug}` : undefined}
          linkTitle={t("collection.open-collection-page")}
          linkComponent={Link}
          loading={collectionStore.isLoading}
          hasData={!!collection}
          errorMessage={collectionStore.error ? t("collection.error-loading-collection") : null}
          transitionKey={collection?.slug}
          onClose={drawer.close}
        >
          <Flex vertical gap="large" className={styles.body}>
            <InfoDescriptions
              items={descriptionItems}
              extra={
                isRoot ? undefined : (
                  <Button icon={<EditOutlined />} onClick={() => setIsEditModalOpen(true)}>
                    {t("common.edit")}
                  </Button>
                )
              }
            />

            <section className={styles.section}>
              {isRoot ? (
                <Typography.Text type="secondary">
                  {t("minions.root-collection-info")}
                </Typography.Text>
              ) : (
                <CollectionFilterSection collectionStore={collectionStore} />
              )}
            </section>
          </Flex>
        </InfoDrawer>

        <CollectionEditModal
          slug={currentSlug ?? ""}
          title={collection?.title ?? ""}
          description={collection?.description}
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
        />
      </>
    );
  }
);
