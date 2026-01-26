import { CopyOutlined, ExportOutlined, MoreOutlined } from "@ant-design/icons";
import { Button, message } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import styles from "./minion-id-cell.module.css";

export type MinionIdCellProps = {
  /** Client ID to display */
  minionId: string;
  /** Internal ID for navigation (if different from minionId) */
  innerId?: string;
  /** Collection slug for URL formation */
  collectionSlug?: string;
  /** Master ID for alternative URL formation */
  masterId?: string;
  /** Callback on menu icon click */
  onMenuClick?: () => void;
  /** Whether to show menu icon (default: true) */
  showMenu?: boolean;
  /** Whether to show navigation icon (default: true) */
  showNavigation?: boolean;
};

export const MinionIdCell = ({
  minionId,
  innerId,
  collectionSlug,
  masterId,
  onMenuClick,
  showMenu = true,
  showNavigation = true,
}: MinionIdCellProps) => {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const navigationId = innerId ?? minionId;

  const getNavigationUrl = () => {
    if (collectionSlug) {
      return `/minion/${collectionSlug}/${navigationId}`;
    }
    if (masterId) {
      return `/master/${masterId}/minion/${minionId}`;
    }
    return "#";
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(minionId);
    messageApi.success(t("minions.copied"));
  };

  return (
    <span className={styles.container}>
      {contextHolder}
      <span className={styles.minionId}>{minionId}</span>
      <span className={styles.actions}>
        {showMenu && onMenuClick && (
          <Button
            color="default"
            variant="outlined"
            size="small"
            icon={<MoreOutlined />}
            onClick={onMenuClick}
            title={t("minions.show-details")}
            className={styles.actionButton}
          />
        )}
        <Button
          color="default"
          variant="outlined"
          size="small"
          icon={<CopyOutlined />}
          onClick={handleCopy}
          title={t("minions.copy-minion-id")}
          className={styles.actionButton}
        />
        {showNavigation && (collectionSlug || masterId) && (
          <Link to={getNavigationUrl()} className={styles.actionButton}>
            <Button
              color="default"
              variant="outlined"
              size="small"
              icon={<ExportOutlined />}
              title={t("minions.open-in-new-tab")}
              className={styles.actionButton}
            />
          </Link>
        )}
      </span>
    </span>
  );
};
