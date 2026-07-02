import { Flex, Skeleton } from "antd";

import styles from "./template-list-panel-skeleton.module.css";

export function TemplateListPanelSkeleton() {
  return (
    <Flex vertical gap={5} className={styles.templateSkeletonList}>
      <Flex
        align="flex-start"
        justify="space-between"
        gap={40}
        className={styles.templateSkeletonItem}
      >
        <Skeleton
          active
          title={{ width: "55%" }}
          paragraph={{ rows: 1, width: "80%" }}
          className={styles.templateSkeletonContent}
        />

        <Flex gap={8} wrap="wrap" justify="flex-end" className={styles.templateSkeletonTags}>
          <Skeleton.Button active size="small" />
          <Skeleton.Button active size="small" />
        </Flex>
      </Flex>
    </Flex>
  );
}
