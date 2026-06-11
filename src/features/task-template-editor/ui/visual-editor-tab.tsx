import {
  SchemaVisualEditor,
  type FormSchema,
  type JSONSchema,
  type UISchema,
} from "@saltbox/react-jsonschema-form-generator";
import { useCallback, useMemo } from "react";

import "@saltbox/react-jsonschema-form-generator/styles.css";

import { extractPillarFormSchema, wrapPillarFormSchema } from "../lib/pillar-schema";

import styles from "./visual-editor-tab.module.css";

interface VisualEditorTabProps {
  schema: FormSchema;
  onChange: (schema: FormSchema) => void;
}

export function VisualEditorTab({ schema, onChange }: VisualEditorTabProps) {
  const pillarFormSchema = useMemo(() => extractPillarFormSchema(schema), [schema]);

  const handleChange = useCallback(
    (edited: JSONSchema | FormSchema) => {
      onChange(wrapPillarFormSchema(schema.json_schema, schema.ui_schema as UISchema, edited));
    },
    [onChange, schema.json_schema, schema.ui_schema]
  );

  return (
    <div className={styles.container}>
      <SchemaVisualEditor schema={pillarFormSchema} onChange={handleChange} />
    </div>
  );
}
