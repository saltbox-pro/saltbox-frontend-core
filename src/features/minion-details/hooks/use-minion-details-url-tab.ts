import { clearFileBrowserLocationQueryFromWindow } from "@saltbox/saltbox-frontend-common";
import { useCallback, useEffect, useMemo } from "react";
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

  useEffect(() => {
    return () => {
      clearFileBrowserLocationQueryFromWindow();
    };
  }, []);

  const onTabChange = useCallback(
    (key: MinionDetailsTabKey) => {
      // Toolkit FM parcel has its own BrowserRouter; read window so path/file
      // written by the parcel are not dropped when switching tabs.
      setSearchParams(() => {
        const newParams = new URLSearchParams(window.location.search);
        newParams.set("tab", key);
        if (key !== "file-manager") {
          newParams.delete("path");
          newParams.delete("file");
          newParams.delete("source");
        }
        return newParams;
      });
    },
    [setSearchParams]
  );

  return { tabKey, onTabChange };
}
