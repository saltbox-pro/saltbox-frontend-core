import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

import { type MinionDetailsTabKey, parseMinionDetailsTabKey } from "../model/tabs";

export function useMinionDetailsUrlTab() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabKey = useMemo(
    () => parseMinionDetailsTabKey(searchParams.get("tab"), false),
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
