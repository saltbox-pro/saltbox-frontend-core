import type { RJSFSchema } from "@rjsf/utils";
import type { TaskTemplateModel } from "@saltbox/saltbox-core-api-client";
import { Flex } from "antd";

import styles from "./template-params-placeholder.module.css";

export type TemplateParamsPlaceholderProps = {
  jsonSchema: RJSFSchema | undefined;
  uiSchema: TaskTemplateModel["ui_schema"] | undefined;
};

const asText = (value: unknown) => (typeof value === "string" ? value : undefined);

export function TemplateParamsPlaceholder({
  jsonSchema,
  uiSchema,
}: TemplateParamsPlaceholderProps) {
  if (!jsonSchema || typeof jsonSchema === "boolean") {
    return null;
  }

  const title = asText(uiSchema?.["ui:title"] ?? jsonSchema.title);
  const description = asText(uiSchema?.["ui:description"] ?? jsonSchema.description);

  if (!title && !description) {
    return null;
  }

  return (
    <Flex vertical gap="small">
      {title ? <div className={styles.label}>{title}</div> : null}
      {description ? <div className={styles.description}>{description}</div> : null}
    </Flex>
  );
}
