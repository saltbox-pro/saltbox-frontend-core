import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

import { appStore } from "saltbox-core/store";

import { type MinionDetailsTabKey, parseMinionDetailsTabKey } from "../model/tabs";

function getDetailPluginKeys(): string[] {
  const plugins =
    appStore.pluginsStore?.plugins?.["minion.detail.tabs"] ??
    appStore.pluginsStore?.plugins?.["minion.tabs"] ??
    [];
  return (plugins as { key?: string }[]).map((plugin) => plugin.key).filter(Boolean) as string[];
}

export function useMinionDetailsUrlTab() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabKey = useMemo(
    () => parseMinionDetailsTabKey(searchParams.get("tab"), false, getDetailPluginKeys()),
    [searchParams]
  );

  const onTabChange = useCallback(
    (key: MinionDetailsTabKey) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("tab", key);
        return newParams;
      });
    },
    [setSearchParams]
  );

  return { tabKey, onTabChange };
}
