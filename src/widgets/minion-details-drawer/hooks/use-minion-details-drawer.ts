import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { createLoader, type LoadSource } from "@saltbox/saltbox-frontend-common";
import { useEffect, useMemo, useRef, useState } from "react";

import { useOnMinionDataRefreshed } from "saltbox-core/features/minion-details/hooks/use-on-minion-data-refreshed";
import { isAbortError } from "saltbox-core/shared/helpers/is-abort-error";
import { apiCoreStore } from "saltbox-core/store";

import type { MinionDetailsDrawerOpenParams } from "../types";

export type UseMinionDetailsDrawerResult = {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  isMinionRefreshing: boolean;
  minionLoad: LoadSource;
  hasData: boolean;
  slug: string | null;
  resolvedDisplayId: string;
  resolvedInnerId: string;
};

export type UseMinionDetailsDrawerArgs = {
  isOpened: boolean;
  openedArg: MinionDetailsDrawerOpenParams | null;
};

const fetchMinion = (params: MinionDetailsDrawerOpenParams, signal: AbortSignal) =>
  "slug" in params
    ? apiCoreStore.minionsApi?.minionGet(
        { collection_slug: params.slug, mid: params.innerId },
        { signal }
      )
    : apiCoreStore.minionsApi?.minionGetByMasterAndId(
        { master_id: params.masterId, minion_id: params.minionId },
        { signal }
      );

export function useMinionDetailsDrawer({
  isOpened,
  openedArg,
}: UseMinionDetailsDrawerArgs): UseMinionDetailsDrawerResult {
  const [minion, setMinion] = useState<MinionDetailSchema | null>(null);
  const [isMinionRefreshing, setIsMinionRefreshing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshAbortControllerRef = useRef<AbortController | null>(null);

  const [minionLoad] = useState(() =>
    createLoader({
      run: (params: MinionDetailsDrawerOpenParams, signal: AbortSignal) =>
        fetchMinion(params, signal),
      onSuccess: (loadedMinion) => setMinion(loadedMinion ?? null),
    })
  );

  const { resolvedDisplayId, resolvedInnerId, slug } = useMemo(() => {
    const params = openedArg;
    if (!params) {
      return { resolvedDisplayId: "", resolvedInnerId: "", slug: null as string | null };
    }

    if ("slug" in params) {
      return {
        resolvedDisplayId: params.minionId ?? "",
        resolvedInnerId: params.innerId ?? "",
        slug: params.slug ?? null,
      };
    }

    return {
      resolvedDisplayId: params.minionId ?? "",
      resolvedInnerId: minion?.id ?? "",
      slug: "root",
    };
  }, [minion?.id, openedArg]);

  const hasData = Boolean(minion?.id) && !minionLoad.error;

  useEffect(() => {
    if (!isOpened) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      refreshAbortControllerRef.current?.abort();
      refreshAbortControllerRef.current = null;
      setMinion(null);
      setIsMinionRefreshing(false);
      return;
    }

    const params = openedArg;
    if (!params) return;

    refreshAbortControllerRef.current?.abort();
    refreshAbortControllerRef.current = null;
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setMinion(null);
    setIsMinionRefreshing(false);

    minionLoad.run(params, abortController.signal).catch(() => undefined);

    return () => {
      abortController.abort();
    };
  }, [isOpened, minionLoad, openedArg]);

  // Refresh grains и другие действия toolkit доступны из drawer; здесь soft-sync данных.
  useOnMinionDataRefreshed(isOpened ? openedArg?.minionId : null, () => {
    if (!openedArg || !apiCoreStore.minionsApi) {
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    refreshAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    refreshAbortControllerRef.current = abortController;
    setIsMinionRefreshing(true);

    (async () => {
      try {
        const loadedMinion = await fetchMinion(openedArg, abortController.signal);
        if (refreshAbortControllerRef.current !== abortController || !loadedMinion) {
          return;
        }
        setMinion(loadedMinion);
      } catch (error) {
        if (!isAbortError(error)) {
          console.error("Error refreshing minion grains:", error);
        }
      } finally {
        if (refreshAbortControllerRef.current === abortController) {
          setIsMinionRefreshing(false);
        }
      }
    })();
  });

  useEffect(() => {
    return () => {
      refreshAbortControllerRef.current?.abort();
    };
  }, [isOpened, openedArg]);

  return {
    minion,
    isMinionLoading: minionLoad.isLoading,
    isMinionRefreshing,
    minionLoad,
    hasData,
    slug,
    resolvedDisplayId,
    resolvedInnerId,
  };
}
