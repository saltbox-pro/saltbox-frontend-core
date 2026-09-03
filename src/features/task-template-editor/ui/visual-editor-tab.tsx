import {
  SchemaVisualEditor,
  TranslationContext,
  en,
  ru,
} from "@saltbox/react-jsonschema-form-generator";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import "@saltbox/react-jsonschema-form-generator/styles.css";

import type { TemplateEditorStore } from "../model/template-editor-store";

import styles from "./visual-editor-tab.module.css";

interface VisualEditorTabProps {
  store: TemplateEditorStore;
}

export const VisualEditorTab = observer(({ store }: VisualEditorTabProps) => {
  const { i18n } = useTranslation();

  const isRussian = i18n.language?.startsWith("ru") ?? false;
  const translation = useMemo(() => (isRussian ? ru : en), [isRussian]);

  const formSchema = store.paramsFormSchema;
  if (!formSchema) return null;

  return (
    <div className={styles.container}>
      <TranslationContext.Provider value={translation}>
        <SchemaVisualEditor
          schema={formSchema}
          onChange={store.setParamsFormSchema}
          // Название и описание шаблона живут в шапке редактора
          hideRootFields
          secretNames={store.secretNames}
          onSecretNamesChange={store.setSecretNames}
        />
      </TranslationContext.Provider>
    </div>
  );
});
