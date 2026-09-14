import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import {
  ExistingTemplateEditor,
  TemplateEditorStore,
} from "saltbox-core/features/task-template-editor";

import NotFound from "../not-found";

const EditTemplatePage = observer(() => {
  const { t } = useTranslation();
  const { sourceId, templateId } = useParams<{ sourceId: string; templateId: string }>();

  const [store] = useState(() =>
    sourceId && templateId ? new TemplateEditorStore({ mode: "edit", sourceId, templateId }) : null
  );

  if (!sourceId || !templateId || !store) {
    return <NotFound />;
  }

  return (
    <ExistingTemplateEditor
      store={store}
      title={t("task-template-editor.edit-title")}
      backPath={`/core/configuration-templates/${encodeURIComponent(sourceId)}`}
    />
  );
});

export default EditTemplatePage;
