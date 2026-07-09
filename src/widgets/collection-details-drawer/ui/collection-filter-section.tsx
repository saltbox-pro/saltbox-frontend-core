import {
  CopyToClipboardButton,
  JsonEditorField,
  SaltBoxReadonlyQueryBuilder,
  isMongoQueryEmpty,
} from "@saltbox/saltbox-frontend-common";
import { Flex, Form, type FormInstance, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { CollectionPopoverFilterStore, type CollectionStore } from "saltbox-core/store";

import styles from "./collection-details-drawer.module.css";

interface CollectionFilterSectionProps {
  collectionStore: CollectionStore;
  isEditing: boolean;
  form: FormInstance;
}

export const CollectionFilterSection = observer(
  ({ collectionStore, isEditing, form }: CollectionFilterSectionProps) => {
    const { t } = useTranslation();
    const [filterStore] = useState(() => new CollectionPopoverFilterStore());

    const query = collectionStore.collection?.query;
    const isEmptyQuery = !query || isMongoQueryEmpty(query);

    useEffect(() => {
      filterStore.loadFiltersScheme();
    }, [filterStore]);

    useEffect(() => {
      if (query) {
        filterStore.initializeByQuery(query);
      }
    }, [query, filterStore]);

    return (
      <div className={styles.filterSection}>
        <Flex justify="space-between" align="center" gap="small">
          <Flex align="center" gap="small">
            <Typography.Text strong className={styles.filterHeading}>
              {t("minions.collection-query")}
            </Typography.Text>
            {!isEmptyQuery && <CopyToClipboardButton text={JSON.stringify(query ?? {}, null, 2)} />}
          </Flex>
        </Flex>

        {isEditing ? (
          <Form.Item name="query" noStyle>
            <JsonEditorField form={form} fieldName="query" height={300} />
          </Form.Item>
        ) : (
          <SaltBoxReadonlyQueryBuilder filterStore={filterStore} />
        )}
      </div>
    );
  }
);
