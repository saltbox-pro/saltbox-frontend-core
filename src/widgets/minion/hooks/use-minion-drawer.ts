import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { apiCoreStore, MinionStore } from "saltbox-core/store";

export type OpenDrawerParams =
  | { slug: string; innerId: string }
  | { masterId: string; minionId: string | null | undefined };

export interface UseMinionDrawerReturn {
  minionStore: MinionStore | null;
  error: string | null;
  openedId: string | null;
  isOpened: boolean;
  slug: string | null;
  openDrawer: (params: OpenDrawerParams) => Promise<void>;
  closeDrawer: () => void;
  clearData: () => void;
}

export function useMinionDrawer(): UseMinionDrawerReturn {
  const { t } = useTranslation();

  const [minionStore, setMinionStore] = useState<MinionStore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  const openDrawer = useCallback(
    async (params: OpenDrawerParams) => {
      setError(null);
      setIsOpened(true);

      const defaultSlug = "root";

      if ("innerId" in params) {
        setSlug(params.slug);
        setMinionStore(new MinionStore(params.slug, params.innerId));
        setOpenedId(params.innerId);
        return;
      }

      if (!params.minionId) {
        setError(t("minions.minion-id-not-specified"));
        setMinionStore(null);
        return;
      }

      setSlug(defaultSlug);
      setOpenedId(params?.minionId);

      try {
        const minion = await apiCoreStore.minionsApi?.minionGetByMasterAndId({
          master_id: params.masterId,
          minion_id: params.minionId,
        });

        if (minion?.id) {
          setMinionStore(new MinionStore(defaultSlug, minion.id));
        } else {
          setError(t("minions.minion-not-found"));
          setMinionStore(null);
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
        setMinionStore(null);
      }
    },
    [t]
  );

  const closeDrawer = useCallback(() => {
    setIsOpened(false);
  }, []);

  const clearData = useCallback(() => {
    setOpenedId(null);
    setMinionStore(null);
    setError(null);
    setSlug(null);
  }, []);

  return {
    minionStore,
    error,
    isOpened,
    openedId,
    slug,
    openDrawer,
    closeDrawer,
    clearData,
  };
}
