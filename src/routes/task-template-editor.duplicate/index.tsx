import { loader } from "@monaco-editor/react";
import { observer } from "mobx-react-lite";
import * as monaco from "monaco-editor";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import {
  ExistingTemplateEditor,
  TemplateEditorStore,
} from "saltbox-core/features/task-template-editor";

import NotFound from "../not-found";

loader.config({ monaco });

const DuplicateTemplatePage = observer(() => {
  const { t } = useTranslation();
  const { sourceId, templateId } = useParams<{ sourceId: string; templateId: string }>();

  const [store] = useState(() =>
    sourceId && templateId
      ? new TemplateEditorStore({ mode: "duplicate", sourceId, templateId })
      : null
  );

  if (!sourceId || !templateId || !store) {
    return <NotFound />;
  }

  return (
    <ExistingTemplateEditor
      store={store}
      title={t("task-template-editor.duplicate-title")}
      backPath={`/core/configuration-templates/${encodeURIComponent(sourceId)}`}
    />
  );
});

export default DuplicateTemplatePage;
