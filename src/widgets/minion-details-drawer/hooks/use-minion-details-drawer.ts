import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { apiCoreStore, MinionStore } from "saltbox-core/store";

type OpenDrawerParams =
  | { slug: string; minionId: string; innerId: string }
  | { masterId: string; minionId: string };

interface UseMinionDrawerReturn {
  minionStore: MinionStore | null;
  error: string | null;
  openedId: string | null | undefined;
  isOpened: boolean;
  slug: string | null;
  open: (params: OpenDrawerParams) => Promise<void>;
  close: () => void;
  clearData: () => void;
}

export function useMinionDetailsDrawer(): UseMinionDrawerReturn {
  const { t } = useTranslation();

  const [minionStore, setMinionStore] = useState<MinionStore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  const open = useCallback(
    async (params: OpenDrawerParams) => {
      setError(null);
      setIsOpened(true);
      setOpenedId(params.minionId);

      if ("slug" in params) {
        setSlug(params.slug);
        setMinionStore(new MinionStore(params.slug, params.innerId));

        return;
      }

      if (!params.minionId) {
        setError(t("minions.minion-id-not-specified"));
        setMinionStore(null);
        return;
      }

      const defaultSlug = "root";

      setSlug(defaultSlug);

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

  const close = useCallback(() => {
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
    open,
    close,
    clearData,
  };
}
