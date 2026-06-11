import type { FormSchema } from "@saltbox/react-jsonschema-form-generator";

const SCHEMA_BLOCK_REGEX = /{#start_schema\s*([\s\S]*?)\s*end_schema#}/;
const SCHEMA_BLOCK_WITH_TAIL_REGEX = /{#start_schema\s*[\s\S]*?\s*end_schema#}\s*/;

export function parseSchemaFromSls(sls: string): FormSchema {
  const match = sls.match(SCHEMA_BLOCK_REGEX);

  if (!match) {
    throw new Error("Schema block not found");
  }

  return JSON.parse(match[1]) as FormSchema;
}

export function extractSlsBody(sls: string): string {
  return sls.replace(SCHEMA_BLOCK_WITH_TAIL_REGEX, "").trim();
}

export function combineSchemaAndBody(schema: FormSchema, body: string): string {
  const schemaJson = JSON.stringify(schema, null, 2);
  const schemaBlock = `{#start_schema\n${schemaJson}\nend_schema#}`;

  return `${schemaBlock}\n\n${body}`;
}

export function getEmptySchema(): FormSchema {
  return {
    json_schema: {
      type: "object",
      title: "",
      additionalProperties: false,
      required: ["kwargs"],
      properties: {
        kwargs: {
          type: "object",
          additionalProperties: false,
          required: ["pillar"],
          properties: {
            pillar: {
              type: "object",
              required: [],
              properties: {},
            },
          },
        },
      },
    },
    ui_schema: {
      kwargs: {
        "ui:title": "",
        pillar: {
          "ui:title": "",
        },
      },
    },
  };
}

export function getEmptySlsBody(): string {
  return "";
}
