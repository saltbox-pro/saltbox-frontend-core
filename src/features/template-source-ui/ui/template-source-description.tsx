import { SearchHighlightText } from "@saltbox/saltbox-frontend-common";
import { Typography } from "antd";

import styles from "./template-source-dimmed.module.css";

const { Paragraph } = Typography;

export type TemplateSourceDescriptionProps = {
  description: string;
  searchQuery?: string;
  dimmed?: boolean;
};

export function TemplateSourceDescription({
  description,
  searchQuery,
  dimmed = false,
}: TemplateSourceDescriptionProps) {
  return (
    <Paragraph
      type="secondary"
      className={dimmed ? styles.dimmed : undefined}
      style={{ margin: 0 }}
    >
      <SearchHighlightText text={description} query={searchQuery} />
    </Paragraph>
  );
}
