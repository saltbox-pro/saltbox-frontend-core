import { RefreshButton } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { collectionsTreeStore } from "saltbox-core/store/collections-tree-store";

import styles from "./minions-tree-refresh-button.module.css";

export const MinionsTreeRefreshButton = observer(function MinionsTreeRefreshButton() {
  const { t } = useTranslation();

  return (
    <RefreshButton
      className={styles.refreshButton}
      size="small"
      title={t("collection.refresh-tree")}
      loading={collectionsTreeStore.fetchTreeStatus === "in-process"}
      onClick={() => collectionsTreeStore.loadTree(true)}
    />
  );
});
