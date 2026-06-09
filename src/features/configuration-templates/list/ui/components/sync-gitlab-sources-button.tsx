import { Button, type ButtonProps } from "antd";
import { useTranslation } from "react-i18next";

type SyncGitlabSourcesButtonProps = Pick<ButtonProps, "size" | "type" | "style" | "className"> & {
  isSyncing: boolean;
  onSync: () => void;
};

export function SyncGitlabSourcesButton({
  isSyncing,
  onSync,
  size = "middle",
  type = "primary",
  style,
  className,
}: SyncGitlabSourcesButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      size={size}
      type={type}
      className={className}
      style={style}
      loading={isSyncing}
      onClick={onSync}
    >
      {t("configuration-templates.actions.sync-gitlab-sources")}
    </Button>
  );
}
