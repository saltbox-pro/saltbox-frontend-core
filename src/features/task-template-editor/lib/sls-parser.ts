import type { DescriptionValue, FormSchema } from "@saltbox/react-jsonschema-form-generator";

import type { TemplateI18nDictionary } from "saltbox-core/shared/utils/template-ui-schema-i18n";

/**
 * The schema block of an SLS template. The template description lives in the
 * block root — next to `json_schema`, never inside it: that is where the
 * backend reads it from to fill `TaskTemplateModel.description`.
 */
export interface TemplateFormSchema extends FormSchema {
  description?: DescriptionValue;
  i18n?: TemplateI18nDictionary;
}

const SCHEMA_BLOCK_REGEX = /{#start_schema\s*([\s\S]*?)\s*end_schema#}/;
const SCHEMA_BLOCK_WITH_TAIL_REGEX = /{#start_schema\s*[\s\S]*?\s*end_schema#}\s*/;

function offsetToLineColumn(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lastNewline = -1;
  const limit = Math.min(offset, text.length);

  for (let i = 0; i < limit; i++) {
    if (text[i] === "\n") {
      line++;
      lastNewline = i;
    }
  }

  return { line, column: offset - lastNewline };
}

function describeJsonError(error: unknown, sls: string, contentStart: number): string {
  const message = error instanceof Error ? error.message : String(error);
  const positionMatch = message.match(/position (\d+)/);

  if (!positionMatch) {
    return message;
  }

  const relativePosition = Number(positionMatch[1]);
  const { line, column } = offsetToLineColumn(sls, contentStart + relativePosition);

  return `${message} (line ${line}, column ${column})`;
}

export function parseSchemaFromSls(sls: string): TemplateFormSchema {
  const match = sls.match(SCHEMA_BLOCK_REGEX);

  if (!match) {
    throw new Error("Schema block not found");
  }

  try {
    return JSON.parse(match[1]) as TemplateFormSchema;
  } catch (error) {
    const contentStart = (match.index ?? 0) + match[0].indexOf(match[1]);
    throw new Error(describeJsonError(error, sls, contentStart));
  }
}

export function extractSlsBody(sls: string): string {
  return sls.replace(SCHEMA_BLOCK_WITH_TAIL_REGEX, "").trim();
}

export type TemplateMeta = Record<string, unknown>;

export function isTemplateMeta(meta: unknown): meta is TemplateMeta {
  return typeof meta === "object" && meta !== null && "json_schema" in meta;
}

export function metaToSchema(meta: TemplateMeta): TemplateFormSchema {
  return meta as unknown as TemplateFormSchema;
}

export function combineSchemaAndBody(schema: TemplateFormSchema, body: string): string {
  // Keep `description` first, the way hand-written templates are laid out,
  // so re-saving a template does not reshuffle its schema block
  const { description, json_schema, ui_schema, ...rest } = schema;
  const orderedSchema = {
    ...(description === undefined ? {} : { description }),
    json_schema,
    ui_schema,
    ...rest,
  };
  const schemaJson = JSON.stringify(orderedSchema, null, 2);
  const schemaBlock = `{#start_schema\n${schemaJson}\nend_schema#}`;

  return `${schemaBlock}\n\n${body}`;
}

export function getEmptySchema(): TemplateFormSchema {
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

export const stripSlsExtension = (fileName: string): string =>
  fileName.trim().replace(/\.sls$/i, "");
