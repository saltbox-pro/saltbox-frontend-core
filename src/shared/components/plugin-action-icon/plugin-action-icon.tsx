import { LoadingOutlined, PoweroffOutlined, ReloadOutlined, SyncOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";

const ICONS: Record<string, ReactNode> = {
  sync: <SyncOutlined />,
  reboot: <ReloadOutlined />,
  poweroff: <PoweroffOutlined />,
};

export function getPluginActionIcon(
  icon?: string,
  options?: { spin?: boolean }
): ReactNode | undefined {
  if (icon == null || !(icon in ICONS)) {
    return undefined;
  }

  if (options?.spin) {
    return <LoadingOutlined spin />;
  }

  return ICONS[icon];
}
