import { CopyToClipboardButton } from "@saltbox/saltbox-frontend-common";
import { Flex } from "antd";
import { FC } from "react";

import styles from "./code-block.module.css";

type CodeBlockProps = {
  canCopy?: boolean;
  content: string;
};

export const CodeBlock: FC<CodeBlockProps> = ({ content, canCopy }) => {
  if (!content) return null;

  return (
    <Flex justify="space-between" className={styles.root}>
      {content}
      {canCopy && <CopyToClipboardButton text={content} />}
    </Flex>
  );
};
