import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { Modal, MutationErrorAlert, notify } from "@saltbox/saltbox-frontend-common";
import { Button, Flex, Form, Result, Spin, Typography, type UploadFile } from "antd";
import type { RcFile } from "antd/es/upload";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { SourceActionsPort } from "../../shared/types/source-action";
import {
  ArchiveFileFormItem,
  type ArchiveFileFormValues,
  getArchiveFormFile,
} from "../../upload/ui/archive-file-form-item";
import { getContentUpdateFailureError } from "../helpers/resolve-content-update-failure";
import { SourceContentUpdateStore } from "../store/source-content-update-store";
import type { ContentUpdatableSourceType } from "../types/content-update";

import { ContentUpdateReview } from "./content-update-review";
import styles from "./update-source-content-modal.module.css";

const ARCHIVE_FORM_ID = "source-content-update-archive-form";
const I18N_PREFIX = "configuration-templates.source-update";
const MODAL_WIDTH = 720;

const toUploadFile = (file: File): UploadFile => ({
  uid: "source-content-update-archive",
  name: file.name,
  size: file.size,
  type: file.type,
  status: "done",
  originFileObj: file as RcFile,
});

type ArchiveStepProps = {
  initialFile: File | null;
  onSubmit: (file: File) => void;
};

function ArchiveStep({ initialFile, onSubmit }: ArchiveStepProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<ArchiveFileFormValues>();

  const handleFinish = (values: ArchiveFileFormValues) => {
    const file = getArchiveFormFile(values.file);
    if (file) onSubmit(file);
  };

  return (
    <Form
      id={ARCHIVE_FORM_ID}
      form={form}
      layout="vertical"
      autoComplete="off"
      initialValues={{ file: initialFile ? [toUploadFile(initialFile)] : [] }}
      onFinish={handleFinish}
    >
      <ArchiveFileFormItem label={t(`${I18N_PREFIX}.archive-file`)} />
    </Form>
  );
}

export type UpdateSourceContentModalProps = {
  open: boolean;
  source: Pick<TemplateSourcePublicSchema, "id" | "name">;
  sourceType: ContentUpdatableSourceType;
  actions: SourceActionsPort;
  onClose: () => void;
};

export const UpdateSourceContentModal = observer(function UpdateSourceContentModal({
  open,
  source,
  sourceType,
  actions,
  onClose,
}: UpdateSourceContentModalProps) {
  const { t } = useTranslation();
  const [store] = useState(() => new SourceContentUpdateStore(source.id, sourceType, actions));
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;

    if (justOpened) {
      store.start();
    }
  }, [open, store]);

  useEffect(() => () => store.cancel(), [store]);

  const isApplying = store.step === "applying";

  const handleCancel = useCallback(() => {
    if (isApplying) return;

    store.cancel();
    onClose();
  }, [isApplying, onClose, store]);

  const handleApply = useCallback(async () => {
    const result = await store.apply();
    if (!result) return;

    const stoppedCount = result.stopped_tasks.length;
    notify.success(
      stoppedCount > 0
        ? t(`${I18N_PREFIX}.apply-success-stopped`, { name: source.name, count: stoppedCount })
        : t(`${I18N_PREFIX}.apply-success`, { name: source.name })
    );
    onClose();
  }, [onClose, source.name, store, t]);

  const failureAlert = store.failure ? (
    <MutationErrorAlert
      error={getContentUpdateFailureError(store.failure, t)}
      fallback={t(
        store.failure.phase === "check"
          ? `${I18N_PREFIX}.check-error`
          : `${I18N_PREFIX}.apply-error`
      )}
      onClose={isApplying ? undefined : store.clearFailure}
    />
  ) : null;

  const cancelButton = (
    <Button disabled={isApplying} onClick={handleCancel}>
      {t("common.cancel")}
    </Button>
  );

  let body: ReactNode = null;
  let footer: ReactNode = cancelButton;

  switch (store.step) {
    case "upload":
      body = (
        <>
          {failureAlert}
          <ArchiveStep initialFile={store.archiveFile} onSubmit={store.checkArchive} />
        </>
      );
      footer = (
        <>
          {cancelButton}
          <Button type="primary" htmlType="submit" form={ARCHIVE_FORM_ID}>
            {t(`${I18N_PREFIX}.check`)}
          </Button>
        </>
      );
      break;

    case "checking":
      body = (
        <Flex vertical align="center" gap="small" className={styles.checking}>
          <Spin />
          <Typography.Text type="secondary">{t(`${I18N_PREFIX}.checking`)}</Typography.Text>
        </Flex>
      );
      break;

    case "check_failed":
      body = failureAlert;
      footer = (
        <>
          {cancelButton}
          <Button type="primary" onClick={store.recheck}>
            {t(`${I18N_PREFIX}.check-retry`)}
          </Button>
        </>
      );
      break;

    case "up_to_date":
      body = (
        <Result
          className={styles.upToDate}
          status="success"
          title={t(`${I18N_PREFIX}.up-to-date-title`)}
          subTitle={t(`${I18N_PREFIX}.up-to-date-description`)}
        />
      );
      footer = <Button onClick={handleCancel}>{t(`${I18N_PREFIX}.close`)}</Button>;
      break;

    case "review":
    case "applying":
      body = store.checkResult && (
        <>
          {failureAlert}
          <ContentUpdateReview
            result={store.checkResult}
            stopDependents={store.stopDependents}
            disabled={isApplying}
            onStopDependentsChange={store.setStopDependents}
          />
        </>
      );
      footer = (
        <>
          {cancelButton}
          {store.needsRecheck ? (
            <Button type="primary" onClick={store.recheck}>
              {t(`${I18N_PREFIX}.recheck`)}
            </Button>
          ) : (
            <Button type="primary" loading={isApplying} onClick={handleApply}>
              {t(`${I18N_PREFIX}.apply`)}
            </Button>
          )}
        </>
      );
      break;
  }

  return (
    <Modal
      title={t(`${I18N_PREFIX}.title`, { name: source.name })}
      open={open}
      width={MODAL_WIDTH}
      closable={!isApplying}
      maskClosable={!isApplying}
      keyboard={!isApplying}
      onCancel={handleCancel}
      destroyOnHidden
      footer={footer}
    >
      {body}
    </Modal>
  );
});
