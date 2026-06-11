import { PageHeader } from "@saltbox/saltbox-frontend-common";
import { Alert, Skeleton } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type { TemplateEditorStore } from "../model/template-editor-store";

import { TemplateEditor } from "./template-editor";
import styles from "./template-editor.module.css";

interface ExistingTemplateEditorProps {
  store: TemplateEditorStore;
  title: string;
  /** Путь возврата (страница источника). */
  backPath: string;
}

export const ExistingTemplateEditor = observer(
  ({ store, title, backPath }: ExistingTemplateEditorProps) => {
    const { t } = useTranslation();

    useEffect(() => {
      store.loadTemplate();
      store.loadSource();
    }, [store]);

    if (store.isLoadingTemplate) {
      return (
        <div className={styles.page}>
          <PageHeader title={title} customParentPathGenerator={() => backPath} />
          <Skeleton active />
        </div>
      );
    }

    if (store.hasLoadError) {
      return (
        <div className={styles.page}>
          <PageHeader title={title} customParentPathGenerator={() => backPath} />
          <Alert type="error" showIcon message={t("task-template-editor.load-error")} />
        </div>
      );
    }

    return <TemplateEditor store={store} title={title} backPath={backPath} />;
  }
);
