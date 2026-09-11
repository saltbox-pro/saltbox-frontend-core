import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import {
  ExistingTemplateEditor,
  TemplateEditorStore,
} from "saltbox-core/features/task-template-editor";

import NotFound from "../not-found";

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
