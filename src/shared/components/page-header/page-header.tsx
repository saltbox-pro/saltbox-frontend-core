import { Breadcrumb, BreadcrumbProps } from "antd";
import styles from "./page-header.module.css";

export function PageHeader({
  title,
  breadcrumbItems,
}: {
  title: string;
  breadcrumbItems?: BreadcrumbProps["items"];
}) {
  return (
    <div className={styles.pageHeader}>
      <h1 className={styles.pageHeaderTitle}>{title}</h1>
      {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}
    </div>
  );
}
