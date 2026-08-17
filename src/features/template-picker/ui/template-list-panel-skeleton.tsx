import { Flex, Skeleton } from "antd";

import styles from "./template-list-panel-skeleton.module.css";

export function TemplateListPanelSkeleton() {
  return (
    <Flex vertical gap={5} className={styles.templateSkeletonList}>
      <Flex vertical gap={4} className={styles.templateSkeletonItem}>
        <Skeleton
          active
          title={{ width: "70%" }}
          paragraph={false}
          className={styles.templateSkeletonTitle}
        />

        <Skeleton
          active
          title={false}
          paragraph={{ rows: 1, width: "90%" }}
          className={styles.templateSkeletonDescription}
        />

        <Flex
          align="center"
          justify="flex-end"
          gap={8}
          wrap="wrap"
          className={styles.templateSkeletonFooter}
        >
          <Flex gap={8} wrap="wrap">
            <Skeleton.Button active size="small" />
            <Skeleton.Button active size="small" />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
