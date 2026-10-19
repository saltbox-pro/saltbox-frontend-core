import type {
  ExtraDataCategoryModel,
  ExtraDataImportMode,
  UnknownMinionPolicy,
} from "@saltbox/saltbox-core-api-client";
import {
  type AppError,
  Modal,
  MutationErrorAlert,
  notify,
  runMutation,
} from "@saltbox/saltbox-frontend-common";
import { Button, Form, Radio, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";

import { importExtraData } from "../api/import-extra-data";
import { getImportFormFile } from "../helpers/get-import-form-file";

import {
  ExtraDataImportCsvFormItem,
  type ExtraDataImportCsvFormValues,
} from "./extra-data-import-csv-form-item";

const FORM_ID = "extra-data-import-form";
const I18N_PREFIX = "minions.extra-data.import";

type ExtraDataImportFormValues = ExtraDataImportCsvFormValues & {
  mode: ExtraDataImportMode;
  onUnknownMinion: UnknownMinionPolicy;
};

type ExtraDataImportModalProps = {
  category: ExtraDataCategoryModel;
  collectionSlug: string;
  onClose: () => void;
  onSuccess?: () => void;
};

function getInitialValues(isModeLocked: boolean): ExtraDataImportFormValues {
  return {
    file: [],
    mode: isModeLocked ? "replace" : "append",
    onUnknownMinion: "error",
  };
}

export function ExtraDataImportModal({
  category,
  collectionSlug,
  onClose,
  onSuccess,
}: ExtraDataImportModalProps) {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm<ExtraDataImportFormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<AppError | null>(null);

  const categoryLabel = getExtraDataCategoryDisplayName(category, i18n.language);
  const isModeLocked = !!category.is_single_item;

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleFinish = async (values: ExtraDataImportFormValues) => {
    const file = getImportFormFile(values.file);
    if (!file) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const result = await runMutation({
        run: () =>
          importExtraData({
            file,
            collectionSlug,
            categorySource: category.source,
            categoryName: category.name,
            mode: isModeLocked ? "replace" : values.mode,
            onUnknownMinion: values.onUnknownMinion,
          }),
        onError: setApiError,
      });

      if (!result.ok) return;

      const {
        minions_count: minionsCount,
        items_count: itemsCount,
        skipped_rows: skippedRows,
      } = result.data;

      notify.success({
        title: t(`${I18N_PREFIX}.success-title`, { category: categoryLabel }),
        description:
          skippedRows.length > 0
            ? t(`${I18N_PREFIX}.success-description-with-skipped`, {
                minionsCount,
                itemsCount,
                skippedCount: skippedRows.length,
              })
            : t(`${I18N_PREFIX}.success-description`, {
                minionsCount,
                itemsCount,
              }),
      });

      onSuccess?.();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={t(`${I18N_PREFIX}.title`, { category: categoryLabel })}
      open
      onCancel={handleCancel}
      width={560}
      closable={!isSubmitting}
      maskClosable={!isSubmitting}
      keyboard={!isSubmitting}
      footer={
        <>
          <Button disabled={isSubmitting} onClick={handleCancel}>
            {t("common.cancel")}
          </Button>
          <Button type="primary" htmlType="submit" form={FORM_ID} loading={isSubmitting}>
            {t(`${I18N_PREFIX}.submit`)}
          </Button>
        </>
      }
    >
      <Form
        id={FORM_ID}
        form={form}
        layout="vertical"
        initialValues={getInitialValues(isModeLocked)}
        onFinish={handleFinish}
        onValuesChange={() => setApiError(null)}
        autoComplete="off"
      >
        <MutationErrorAlert
          error={apiError}
          fallback={t(`${I18N_PREFIX}.error`)}
          onClose={() => setApiError(null)}
        />

        <Typography.Paragraph type="secondary">{t(`${I18N_PREFIX}.hint`)}</Typography.Paragraph>

        <ExtraDataImportCsvFormItem disabled={isSubmitting} />

        <Form.Item
          name="mode"
          label={t(`${I18N_PREFIX}.mode-label`)}
          tooltip={isModeLocked ? t(`${I18N_PREFIX}.mode-single-item-tooltip`) : undefined}
          rules={[{ required: true, message: t(`${I18N_PREFIX}.mode-required`) }]}
        >
          <Radio.Group disabled={isSubmitting}>
            <Radio value="append" disabled={isModeLocked}>
              {t(`${I18N_PREFIX}.mode-append`)}
            </Radio>
            <Radio value="replace">{t(`${I18N_PREFIX}.mode-replace`)}</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="onUnknownMinion"
          label={t(`${I18N_PREFIX}.unknown-minion-label`)}
          rules={[{ required: true, message: t(`${I18N_PREFIX}.unknown-minion-required`) }]}
        >
          <Radio.Group disabled={isSubmitting}>
            <Radio value="error">{t(`${I18N_PREFIX}.unknown-minion-error`)}</Radio>
            <Radio value="skip">{t(`${I18N_PREFIX}.unknown-minion-skip`)}</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
}
