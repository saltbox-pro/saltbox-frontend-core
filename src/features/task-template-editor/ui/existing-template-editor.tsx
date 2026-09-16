import { ErrorZone, PageHeader } from "@saltbox/saltbox-frontend-common";
import { Skeleton } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useNavigate } from "react-router";

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
    const navigate = useNavigate();

    useEffect(() => {
      store.loadTemplate();
      store.loadSource();
      if (store.isDuplicate) {
        store.loadTargetSources();
      }
    }, [store]);

    if (store.isLoadingTemplate) {
      return (
        <div className={styles.page}>
          <PageHeader title={title} customParentPathGenerator={() => backPath} />
          <Skeleton active />
        </div>
      );
    }

    if (store.templateLoad.error) {
      return (
        <div className={styles.page}>
          <PageHeader title={title} customParentPathGenerator={() => backPath} />
          <ErrorZone
            level="page"
            loaders={[store.templateLoad]}
            onNavigateHome={() => navigate(backPath)}
          >
            {null}
          </ErrorZone>
        </div>
      );
    }

    return <TemplateEditor store={store} title={title} backPath={backPath} />;
  }
);
