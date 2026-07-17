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

const DESCRIPTION_LANGUAGES_RU = ["ru", "en"];
const DESCRIPTION_LANGUAGES_EN = ["en", "ru"];

interface VisualEditorTabProps {
  schema: FormSchema;
  onChange: (schema: FormSchema) => void;
}

export function VisualEditorTab({ schema, onChange }: VisualEditorTabProps) {
  const { i18n } = useTranslation();
  const pillarFormSchema = useMemo(() => extractPillarFormSchema(schema), [schema]);

  const isRussian = i18n.language?.startsWith("ru") ?? false;
  const translation = useMemo(() => (isRussian ? ru : en), [isRussian]);
  // The interface language goes first so its tab is the one selected on open
  const descriptionLanguages = isRussian ? DESCRIPTION_LANGUAGES_RU : DESCRIPTION_LANGUAGES_EN;

  const handleChange = useCallback(
    (edited: JSONSchema | FormSchema) => {
      onChange(wrapPillarFormSchema(schema.json_schema, schema.ui_schema as UISchema, edited));
    },
    [onChange, schema.json_schema, schema.ui_schema]
  );

  return (
    <div className={styles.container}>
      <TranslationContext.Provider value={translation}>
        <SchemaVisualEditor
          schema={pillarFormSchema}
          onChange={handleChange}
          descriptionLanguages={descriptionLanguages}
        />
      </TranslationContext.Provider>
    </div>
  );
}
