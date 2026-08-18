import { SearchHighlightText } from "@saltbox/saltbox-frontend-common";
import { Tag } from "antd";

import { isFunctionTemplate } from "../helpers/template-kind";
import type { TaskTemplatePickerItem } from "../type/types";

import { FunctionTemplateInfoIcon } from "./function-template-info-icon";
import styles from "./template-picker-modal.module.css";

export type TemplateItemTagsProps = {
  template: TaskTemplatePickerItem;
  searchQuery?: string;
};

export function TemplateItemTags({ template, searchQuery }: TemplateItemTagsProps) {
  const { fun, name } = template;

  if (isFunctionTemplate(template)) {
    return (
      <span className={styles.commandBadge}>
        <Tag color="processing" title={fun} className={styles.commandTag}>
          <SearchHighlightText text={fun} query={searchQuery} />
        </Tag>

        <FunctionTemplateInfoIcon template={template} />
      </span>
    );
  }

  return (
    <>
      <Tag title={fun}>
        <SearchHighlightText text={fun} query={searchQuery} />
      </Tag>

      <Tag title={name}>
        <SearchHighlightText text={name} query={searchQuery} />
      </Tag>
    </>
  );
}
