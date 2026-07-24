import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import {
  createNotFoundError,
  createResourceLoadError,
  type ResourceLoadError,
} from "@saltbox/saltbox-frontend-common";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiCoreStore } from "saltbox-core/store";

import type { MinionDetailsDrawerOpenParams } from "../types";

export type UseMinionDetailsDrawerResult = {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  loadError: ResourceLoadError | null;
  hasData: boolean;
  slug: string | null;
  resolvedDisplayId: string;
  resolvedInnerId: string;
  reload: () => void;
};

export type UseMinionDetailsDrawerArgs = {
  isOpened: boolean;
  openedArg: MinionDetailsDrawerOpenParams | null;
};

const isAbortError = (err: unknown): boolean => {
  if (!err || typeof err !== "object") return false;
  const error = err as { name?: string; cause?: { name?: string; code?: number } };
  return (
    error.name === "AbortError" ||
    error.cause?.name === "AbortError" ||
    error.cause?.code === DOMException.ABORT_ERR
  );
};

export function useMinionDetailsDrawer({
  isOpened,
  openedArg,
}: UseMinionDetailsDrawerArgs): UseMinionDetailsDrawerResult {
  const { t } = useTranslation();

  const [minion, setMinion] = useState<MinionDetailSchema | null>(null);
  const [isMinionLoading, setIsMinionLoading] = useState(false);
  const [loadError, setLoadError] = useState<ResourceLoadError | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);

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

  const hasData = Boolean(minion?.id) && !loadError;

  const reload = () => {
    setReloadToken((token) => token + 1);
  };

  useEffect(() => {
    if (!isOpened) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setMinion(null);
      setIsMinionLoading(false);
      setLoadError(null);
      return;
    }

    const params = openedArg;
    if (!params) return;

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoadError(null);
    setMinion(null);
    setIsMinionLoading(true);

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

          if (abortControllerRef.current !== abortController) return;
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

        if (abortControllerRef.current !== abortController) return;

        if (loadedMinion?.id) {
          setMinion(loadedMinion);
        } else {
          setLoadError(createNotFoundError(t("minions.minion-not-found")));
        }
      } catch (err) {
        if (isAbortError(err)) {
          return;
        }

        console.error("Error fetching minion:", err);

        if (abortControllerRef.current !== abortController) return;
        setLoadError(createResourceLoadError(err));
      } finally {
        if (abortControllerRef.current === abortController) {
          setIsMinionLoading(false);
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [isOpened, openedArg, reloadToken, t]);

  return {
    minion,
    isMinionLoading,
    loadError,
    hasData,
    slug,
    resolvedDisplayId,
    resolvedInnerId,
    reload,
  };
}
