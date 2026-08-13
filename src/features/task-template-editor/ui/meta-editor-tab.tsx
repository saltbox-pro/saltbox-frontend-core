import { useMonaco } from "@monaco-editor/react";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

import {
  TEMPLATE_META_JSON_SCHEMA,
  TEMPLATE_META_MODEL_PATH,
  TEMPLATE_META_SCHEMA_URI,
} from "../lib/meta-json-schema";
import type { TemplateEditorStore } from "../model/template-editor-store";

import { FullTemplateEditor } from "./full-template-editor";

interface MetaEditorTabProps {
  store: TemplateEditorStore;
}

export const MetaEditorTab = observer(({ store }: MetaEditorTabProps) => {
  const monaco = useMonaco();

  useEffect(() => {
    if (!monaco) return;

    // Дописываем свою схему к уже зарегистрированным, чтобы не сломать
    // подсказки в других JSON-редакторах приложения
    const current = monaco.json.jsonDefaults.diagnosticsOptions;
    const otherSchemas = (current.schemas ?? []).filter(
      (schema) => schema.uri !== TEMPLATE_META_SCHEMA_URI
    );

    monaco.json.jsonDefaults.setDiagnosticsOptions({
      ...current,
      validate: true,
      schemas: [
        ...otherSchemas,
        {
          uri: TEMPLATE_META_SCHEMA_URI,
          fileMatch: [TEMPLATE_META_MODEL_PATH],
          schema: TEMPLATE_META_JSON_SCHEMA,
        },
      ],
    });
  }, [monaco]);

  return (
    <FullTemplateEditor
      language="json"
      path={TEMPLATE_META_MODEL_PATH}
      value={store.metaText}
      onChange={store.setMetaText}
    />
  );
});
