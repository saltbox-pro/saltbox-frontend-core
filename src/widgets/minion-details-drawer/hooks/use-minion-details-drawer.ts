import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiCoreStore } from "saltbox-core/store";

import type { MinionDetailsDrawerOpenParams } from "../types";

export type UseMinionDetailsDrawerResult = {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
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
  const [error, setError] = useState<string | null>(null);

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

  const hasData = Boolean(minion?.id) && !error;

  useEffect(() => {
    if (!isOpened) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setMinion(null);
      setIsMinionLoading(false);
      setError(null);
      return;
    }

    const params = openedArg;
    if (!params) return;

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setError(null);
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
          setError(t("minions.minion-not-found"));
        }
      } catch (err) {
        const isAbortError =
          err?.name === "AbortError" ||
          err?.cause?.name === "AbortError" ||
          err?.cause?.code === DOMException.ABORT_ERR;

        if (isAbortError) {
          return;
        }

        console.error("Error fetching minion:", err);

        let errorMessage: string | null = null;
        const status = err?.response?.status;

        if (status === 404) {
          errorMessage = t("minions.minion-not-found");
        } else if (status === 403) {
          errorMessage = t("errors.access-denied");
        }

        if (abortControllerRef.current !== abortController) return;
        setError(errorMessage);
      } finally {
        if (abortControllerRef.current === abortController) {
          setIsMinionLoading(false);
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [isOpened, openedArg, t]);

  return {
    minion,
    isMinionLoading,
    error,
    hasData,
    slug,
    resolvedDisplayId,
    resolvedInnerId,
  };
}
