import { Descriptions, DescriptionsProps } from "antd";

import styles from "./info-descriptions.module.css";

export type InfoDescriptionsProps = DescriptionsProps;

export function InfoDescriptions({
  bordered = true,
  size = "small",
  column = 1,
  rootClassName,
  ...restProps
}: InfoDescriptionsProps) {
  return (
    <Descriptions
      rootClassName={`${styles.infoDescription} ${rootClassName ?? ""}`}
      classNames={{ label: styles.infoDescriptionLabel, content: styles.infoDescriptionContent }}
      column={column}
      bordered={bordered}
      size={size}
      {...restProps}
    />
  );
}
