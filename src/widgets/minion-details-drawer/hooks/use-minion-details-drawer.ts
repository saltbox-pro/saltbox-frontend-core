import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { createLoader, type LoadSource } from "@saltbox/saltbox-frontend-common";
import { useEffect, useMemo, useRef, useState } from "react";

import { useOnMinionDataRefreshed } from "saltbox-core/features/minion-details/hooks/use-on-minion-data-refreshed";
import { isAbortError } from "saltbox-core/shared/helpers/is-abort-error";
import { isApiNotFoundError } from "saltbox-core/shared/helpers/is-api-not-found-error";
import { apiCoreStore } from "saltbox-core/store";

import type { MinionDetailsDrawerOpenParams } from "../types";

export type UseMinionDetailsDrawerResult = {
  minion: MinionDetailSchema | null;
  isMinionMissing: boolean;
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
  allowMissingMinion?: boolean;
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
  allowMissingMinion = false,
}: UseMinionDetailsDrawerArgs): UseMinionDetailsDrawerResult {
  const [minion, setMinion] = useState<MinionDetailSchema | null>(null);
  const [isMinionMissing, setIsMinionMissing] = useState(false);
  const [isMinionRefreshing, setIsMinionRefreshing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshAbortControllerRef = useRef<AbortController | null>(null);

  const [minionLoad] = useState(() =>
    createLoader({
      run: (params: MinionDetailsDrawerOpenParams, signal: AbortSignal, allowMissing: boolean) =>
        fetchMinion(params, signal)?.catch((error: unknown) => {
          if (allowMissing && isApiNotFoundError(error)) {
            return null;
          }
          throw error;
        }),
      onSuccess: (loadedMinion) => {
        setMinion(loadedMinion ?? null);
        setIsMinionMissing(loadedMinion === null);
      },
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

  const hasData = Boolean(minion?.id) || isMinionMissing;

  useEffect(() => {
    if (!isOpened) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      refreshAbortControllerRef.current?.abort();
      refreshAbortControllerRef.current = null;
      setMinion(null);
      setIsMinionMissing(false);
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
    setIsMinionMissing(false);
    setIsMinionRefreshing(false);

    minionLoad.resetInitial();
    minionLoad.run(params, abortController.signal, allowMissingMinion).catch(() => undefined);

    return () => {
      abortController.abort();
    };
  }, [allowMissingMinion, isOpened, minionLoad, openedArg]);

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
        setIsMinionMissing(false);
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
    isMinionMissing,
    isMinionLoading: minionLoad.isLoading,
    isMinionRefreshing,
    minionLoad,
    hasData,
    slug,
    resolvedDisplayId,
    resolvedInnerId,
  };
}
