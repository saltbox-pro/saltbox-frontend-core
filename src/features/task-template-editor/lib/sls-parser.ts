import type { FormSchema } from "@saltbox/react-jsonschema-form-generator";

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

export function parseSchemaFromSls(sls: string): FormSchema {
  const match = sls.match(SCHEMA_BLOCK_REGEX);

  if (!match) {
    throw new Error("Schema block not found");
  }

  try {
    return JSON.parse(match[1]) as FormSchema;
  } catch (error) {
    const contentStart = (match.index ?? 0) + match[0].indexOf(match[1]);
    throw new Error(describeJsonError(error, sls, contentStart));
  }
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
