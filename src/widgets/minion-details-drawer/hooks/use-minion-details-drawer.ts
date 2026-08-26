import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useOnMinionDataRefreshed } from "saltbox-core/features/minion-details/hooks/use-on-minion-data-refreshed";
import { isAbortError } from "saltbox-core/shared/helpers/is-abort-error";
import { apiCoreStore } from "saltbox-core/store";

import type { MinionDetailsDrawerOpenParams } from "../types";

export type UseMinionDetailsDrawerResult = {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  isMinionRefreshing: boolean;
  error: string | null;
  hasData: boolean;
  slug: string | null;
  resolvedDisplayId: string;
  resolvedInnerId: string;
};

export type UseMinionDetailsDrawerArgs = {
  isOpened: boolean;
  openedArg: MinionDetailsDrawerOpenParams | null;
};

export function useMinionDetailsDrawer({
  isOpened,
  openedArg,
}: UseMinionDetailsDrawerArgs): UseMinionDetailsDrawerResult {
  const { t } = useTranslation();

  const [minion, setMinion] = useState<MinionDetailSchema | null>(null);
  const [isMinionLoading, setIsMinionLoading] = useState(false);
  const [isMinionRefreshing, setIsMinionRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshAbortControllerRef = useRef<AbortController | null>(null);
  const loadGenerationRef = useRef(0);

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

  const hasData = Boolean(minion?.id) && !error;

  useEffect(() => {
    if (!isOpened) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      refreshAbortControllerRef.current?.abort();
      refreshAbortControllerRef.current = null;
      loadGenerationRef.current += 1;
      setMinion(null);
      setIsMinionLoading(false);
      setIsMinionRefreshing(false);
      setError(null);
      return;
    }

    const params = openedArg;
    if (!params) return;

    refreshAbortControllerRef.current?.abort();
    refreshAbortControllerRef.current = null;
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const generation = ++loadGenerationRef.current;

    setError(null);
    setMinion(null);
    setIsMinionLoading(true);
    setIsMinionRefreshing(false);

    (async () => {
      try {
        if ("slug" in params) {
          const loadedMinion = await apiCoreStore.minionsApi?.minionGet(
            {
              collection_slug: params.slug,
              mid: params.innerId,
            },
            { signal: abortController.signal }
          );

          if (generation !== loadGenerationRef.current) return;
          setMinion(loadedMinion ?? null);
          return;
        }

        const loadedMinion = await apiCoreStore.minionsApi?.minionGetByMasterAndId(
          {
            master_id: params.masterId,
            minion_id: params.minionId,
          },
          { signal: abortController.signal }
        );

        if (generation !== loadGenerationRef.current) return;

        if (loadedMinion?.id) {
          setMinion(loadedMinion);
        } else {
          setError(t("minions.minion-not-found"));
        }
      } catch (err) {
        if (isAbortError(err)) {
          return;
        }

        console.error("Error fetching minion:", err);

        let errorMessage: string | null = null;
        const status = (err as { response?: { status?: number } })?.response?.status;

        if (status === 404) {
          errorMessage = t("minions.minion-not-found");
        } else if (status === 403) {
          errorMessage = t("errors.access-denied");
        }

        if (generation !== loadGenerationRef.current) return;
        setError(errorMessage);
      } finally {
        if (generation === loadGenerationRef.current) {
          setIsMinionLoading(false);
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [isOpened, openedArg, t]);

  // Refresh grains и другие действия toolkit доступны из drawer; здесь soft-sync данных.
  useOnMinionDataRefreshed(isOpened ? openedArg?.minionId : null, () => {
    if (!openedArg) {
      return;
    }

    const minionsApi = apiCoreStore.minionsApi;
    if (!minionsApi) {
      return;
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    refreshAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    refreshAbortControllerRef.current = abortController;
    const generation = ++loadGenerationRef.current;
    setIsMinionLoading(false);
    setIsMinionRefreshing(true);

    (async () => {
      try {
        const loadedMinion =
          "slug" in openedArg
            ? await minionsApi.minionGet(
                {
                  collection_slug: openedArg.slug,
                  mid: openedArg.innerId,
                },
                { signal: abortController.signal }
              )
            : await minionsApi.minionGetByMasterAndId(
                {
                  master_id: openedArg.masterId,
                  minion_id: openedArg.minionId,
                },
                { signal: abortController.signal }
              );

        if (generation !== loadGenerationRef.current || !loadedMinion) {
          return;
        }
        setMinion(loadedMinion);
        setError(null);
      } catch (error) {
        if (!isAbortError(error)) {
          console.error("Error refreshing minion grains:", error);
        }
      } finally {
        if (generation === loadGenerationRef.current) {
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
    isMinionLoading,
    isMinionRefreshing,
    error,
    hasData,
    slug,
    resolvedDisplayId,
    resolvedInnerId,
  };
}
