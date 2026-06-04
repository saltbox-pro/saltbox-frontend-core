import { Empty } from "antd";

import styles from "./collapse-section.module.css";

type TemplateSourceSectionEmptyProps = {
  description: string;
};

export function TemplateSourceSectionEmpty({ description }: TemplateSourceSectionEmptyProps) {
  return (
    <Empty
      className={styles.sectionEmpty}
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      imageStyle={{ height: 32 }}
      styles={{ description: { fontSize: 12 } }}
      description={description}
    />
  );
}
