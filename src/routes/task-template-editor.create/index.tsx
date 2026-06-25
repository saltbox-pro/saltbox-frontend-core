import { loader } from "@monaco-editor/react";
import { observer } from "mobx-react-lite";
import * as monaco from "monaco-editor";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import { TemplateEditor, TemplateEditorStore } from "saltbox-core/features/task-template-editor";

import NotFound from "../not-found";

loader.config({ monaco });

const CreateTemplatePage = observer(() => {
  const { t } = useTranslation();
  const { sourceId } = useParams<{ sourceId: string }>();

  const [store] = useState(() =>
    sourceId ? new TemplateEditorStore({ mode: "create", sourceId }) : null
  );

  useEffect(() => {
    store?.loadSource();
  }, [store]);

  if (!sourceId || !store) {
    return <NotFound />;
  }

  return (
    <TemplateEditor
      store={store}
      title={t("task-template-editor.create-title")}
      backPath={`/core/configuration-templates/${encodeURIComponent(sourceId)}`}
    />
  );
});

export default CreateTemplatePage;
