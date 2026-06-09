import { Empty } from "antd";

import styles from "./template-source-section-empty.module.css";

type TemplateSourceSectionEmptyProps = {
  description: string;
};

export function TemplateSourceSectionEmpty({ description }: TemplateSourceSectionEmptyProps) {
  return (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      classNames={{
        root: styles.root,
        image: styles.image,
        description: styles.description,
      }}
      description={description}
    />
  );
}
