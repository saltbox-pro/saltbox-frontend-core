import { LoadingOutlined, SyncOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";

import type { PluginActionIconName } from "./types";

export function getPluginActionIcon(
  icon?: PluginActionIconName,
  options?: { spin?: boolean }
): ReactNode | undefined {
  if (icon !== "sync") {
    return undefined;
  }

  if (options?.spin) {
    return <LoadingOutlined spin />;
  }

  return <SyncOutlined />;
}
