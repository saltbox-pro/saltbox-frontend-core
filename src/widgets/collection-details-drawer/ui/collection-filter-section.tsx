import { EditOutlined } from "@ant-design/icons";
import {
  CopyToClipboardButton,
  JsonEditorField,
  SaltBoxReadonlyQueryBuilder,
  isGlobalServerError,
  isMongoQueryEmpty,
} from "@saltbox/saltbox-frontend-common";
import { Button, Flex, Form, message, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { CollectionPopoverFilterStore, type CollectionStore } from "saltbox-core/store";

import styles from "./collection-details-drawer.module.css";

interface CollectionFilterSectionProps {
  collectionStore: CollectionStore;
}

export const CollectionFilterSection = observer(
  ({ collectionStore }: CollectionFilterSectionProps) => {
    const { t } = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();
    const [filterStore] = useState(() => new CollectionPopoverFilterStore());
    const [form] = Form.useForm();

    const [mode, setMode] = useState<"view" | "edit">("view");
    const [draft, setDraft] = useState("");
    const [isSaving, setIsSaving] = useState(false);

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

    useEffect(() => {
      setMode("view");
    }, [collectionStore.collectionSlug]);

    const handleEdit = () => {
      setDraft(JSON.stringify(query ?? {}, null, 2));
      setMode("edit");
    };

    const handleSave = async () => {
      let parsed: object;
      try {
        parsed = JSON.parse(draft);
      } catch {
        messageApi.error(t("collection.invalid-filter-json"));
        return;
      }

      setIsSaving(true);
      try {
        await collectionStore.updateCollection({ query: parsed });
        messageApi.success(t("collection.filter-updated-successfully"));
        setMode("view");
      } catch (error) {
        if (!isGlobalServerError(error)) {
          messageApi.error(t("collection.error-updating-filter"));
        }
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div className={styles.filterSection}>
        {contextHolder}

        <Flex justify="space-between" align="center" gap="small">
          <Flex align="center" gap="small">
            <Typography.Text strong className={styles.filterHeading}>
              {t("minions.collection-query")}
            </Typography.Text>
            {!isEmptyQuery && <CopyToClipboardButton text={JSON.stringify(query ?? {}, null, 2)} />}
          </Flex>
          {mode === "view" && (
            <Button icon={<EditOutlined />} onClick={handleEdit}>
              {t("common.edit")}
            </Button>
          )}
        </Flex>

        {mode === "view" ? (
          isEmptyQuery ? (
            <Typography.Text type="secondary" italic>
              {t("collection.no-filter")}
            </Typography.Text>
          ) : (
            <SaltBoxReadonlyQueryBuilder filterStore={filterStore} />
          )
        ) : (
          <Flex vertical gap="small">
            <Form form={form} component={false}>
              <JsonEditorField form={form} value={draft} onChange={setDraft} height={300} />
            </Form>
            <Flex gap="small" justify="end">
              <Button onClick={() => setMode("view")} disabled={isSaving}>
                {t("common.cancel")}
              </Button>
              <Button type="primary" onClick={handleSave} loading={isSaving}>
                {t("common.save")}
              </Button>
            </Flex>
          </Flex>
        )}
      </div>
    );
  }
);
