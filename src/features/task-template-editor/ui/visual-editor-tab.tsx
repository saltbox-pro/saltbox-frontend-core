import {
  SchemaVisualEditor,
  TranslationContext,
  en,
  ru,
  type FormSchema,
  type JSONSchema,
  type UISchema,
} from "@saltbox/react-jsonschema-form-generator";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import "@saltbox/react-jsonschema-form-generator/styles.css";

import { extractPillarFormSchema, wrapPillarFormSchema } from "../lib/pillar-schema";

import styles from "./visual-editor-tab.module.css";

interface VisualEditorTabProps {
  schema: FormSchema;
  onChange: (schema: FormSchema) => void;
}

export function VisualEditorTab({ schema, onChange }: VisualEditorTabProps) {
  const { i18n } = useTranslation();
  const pillarFormSchema = useMemo(() => extractPillarFormSchema(schema), [schema]);

  const translation = useMemo(() => (i18n.language.startsWith("ru") ? ru : en), [i18n.language]);

  const handleChange = useCallback(
    (edited: JSONSchema | FormSchema) => {
      onChange(wrapPillarFormSchema(schema.json_schema, schema.ui_schema as UISchema, edited));
    },
    [onChange, schema.json_schema, schema.ui_schema]
  );

  return (
    <div className={styles.container}>
      <TranslationContext.Provider value={translation}>
        <SchemaVisualEditor schema={pillarFormSchema} onChange={handleChange} />
      </TranslationContext.Provider>
    </div>
  );
}
