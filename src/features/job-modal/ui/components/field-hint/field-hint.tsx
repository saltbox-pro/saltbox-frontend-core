import { QuestionCircleOutlined } from "@ant-design/icons";
import { Popover } from "@saltbox/saltbox-frontend-common";
import { Typography } from "antd";
import type { FC, ReactNode } from "react";

import styles from "./field-hint.module.css";

type FieldHintProps = {
  label: ReactNode;
  hint: string;
};

export const FieldHint: FC<FieldHintProps> = ({ label, hint }) => (
  <>
    {label}
    <Popover
      content={<Typography.Text className={styles.hintContent}>{hint}</Typography.Text>}
      trigger="hover"
      placement="right"
      overlayInnerStyle={{ color: "#000", backgroundColor: "#fff" }}
    >
      <QuestionCircleOutlined className={styles.helpIcon} />
    </Popover>
  </>
);
