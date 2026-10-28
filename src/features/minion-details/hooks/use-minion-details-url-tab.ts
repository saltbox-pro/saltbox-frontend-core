import { clearFileBrowserLocationQueryFromWindow } from "@saltbox/saltbox-frontend-common";
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";

import type { MinionActivityFlags } from "saltbox-core/shared/helpers/minion-activity";
import { appStore } from "saltbox-core/store";

import { type MinionDetailsTabKey, parseMinionDetailsTabKey } from "../model/tabs";

import { useResolvedMinionDetailsTab } from "./use-resolved-minion-details-tab";

function getDetailPluginKeys(): string[] {
  const plugins = appStore.pluginsStore?.plugins?.["minion.detail.tabs"] ?? [];
  return plugins.map((plugin) => plugin.key).filter(Boolean);
}

export function useMinionDetailsUrlTab(minion: MinionActivityFlags | null | undefined) {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlTabKey = useMemo(
    () => parseMinionDetailsTabKey(searchParams.get("tab"), false, getDetailPluginKeys()),
    [searchParams]
  );

  useEffect(() => {
    return () => {
      clearFileBrowserLocationQueryFromWindow();
    };
  }, []);

  const setUrlTab = useCallback(
    (key: MinionDetailsTabKey, replace: boolean) => {
      // Toolkit FM parcel has its own BrowserRouter; read window so path/file
      // written by the parcel are not dropped when switching tabs.
      setSearchParams(
        () => {
          const newParams = new URLSearchParams(window.location.search);
          newParams.set("tab", key);
          if (key !== "file-manager") {
            newParams.delete("path");
            newParams.delete("file");
            newParams.delete("source");
          }
          return newParams;
        },
        { replace }
      );
    },
    [setSearchParams]
  );

  const onTabChange = useCallback((key: MinionDetailsTabKey) => setUrlTab(key, false), [setUrlTab]);
  const replaceTab = useCallback((key: MinionDetailsTabKey) => setUrlTab(key, true), [setUrlTab]);

  const tabKey = useResolvedMinionDetailsTab(urlTabKey, minion, replaceTab);

  return { tabKey, onTabChange };
}
