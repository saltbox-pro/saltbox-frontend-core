import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { useInfoDrawer } from "@saltbox/saltbox-frontend-common";
import { type RefObject, useState } from "react";
import { useTranslation } from "react-i18next";

import { apiCoreStore } from "saltbox-core/store";

type OpenDrawerParams =
  | { slug: string; minionId: string; innerId: string; drawerId?: string }
  | { masterId: string; minionId: string; drawerId?: string };

interface UseMinionDrawerReturn {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  error: string | null;
  openedMinionId: string | null;
  openedInnerId: string | null;
  isOpened: boolean;
  activeRowId: string | null;
  mainContentRef: RefObject<HTMLTableSectionElement | null>;
  slug: string | null;
  open: (params: OpenDrawerParams) => Promise<void>;
  close: () => void;
  toggle: (params: OpenDrawerParams) => Promise<void>;
  clearData: () => void;
}

export function useMinionDetailsDrawer(): UseMinionDrawerReturn {
  const { t } = useTranslation();

  const [minion, setMinion] = useState<MinionDetailSchema | null>(null);
  const [isMinionLoading, setIsMinionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [openedMinionId, setOpenedMinionId] = useState<string | null>(null);
  const [openedInnerId, setOpenedInnerId] = useState<string | null>(null);

  const drawer = useInfoDrawer<OpenDrawerParams, string, HTMLTableSectionElement>({
    getId: (params) => params.drawerId ?? params.minionId,
    onOpen: async (params) => {
      setError(null);
      setMinion(null);
      setIsMinionLoading(true);
      setOpenedMinionId(params.minionId || null);
      setOpenedInnerId(null);

      try {
        if ("slug" in params) {
          setSlug(params.slug);
          setOpenedInnerId(params.innerId);

          const loadedMinion = await apiCoreStore.minionsApi?.minionGet({
            collection_slug: params.slug,
            mid: params.innerId,
          });

          setMinion(loadedMinion ?? null);
          return;
        }

        if (!params.minionId) {
          setError(t("minions.minion-id-not-specified"));
          return;
        }

        const defaultSlug = "root";
        setSlug(defaultSlug);

        const loadedMinion = await apiCoreStore.minionsApi?.minionGetByMasterAndId({
          master_id: params.masterId,
          minion_id: params.minionId,
        });

        if (loadedMinion?.id) {
          setOpenedInnerId(loadedMinion.id);
          setMinion(loadedMinion);
        } else {
          setError(t("minions.minion-not-found"));
        }
      } catch (err) {
        console.error("Error fetching minion:", err);

        let errorMessage: string | null = null;
        const status = err?.response?.status;

        if (status === 404) {
          errorMessage = t("minions.minion-not-found");
        } else if (status === 403) {
          errorMessage = t("errors.access-denied");
        }

        setError(errorMessage);
      } finally {
        setIsMinionLoading(false);
      }
    },
    onClear: () => {
      setMinion(null);
      setIsMinionLoading(false);
      setError(null);
      setSlug(null);
      setOpenedMinionId(null);
      setOpenedInnerId(null);
    },
  });

  return {
    minion,
    isMinionLoading,
    error,
    isOpened: drawer.isOpened,
    openedMinionId,
    openedInnerId,
    activeRowId: drawer.activeRowId,
    mainContentRef: drawer.mainContentRef,
    slug,
    open: drawer.open,
    close: drawer.close,
    toggle: drawer.toggle,
    clearData: drawer.clearData,
  };
}
