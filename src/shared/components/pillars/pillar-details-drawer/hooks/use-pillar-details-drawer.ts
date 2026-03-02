import { useCallback, useState } from "react";

interface UsePillarDetailsDrawerReturn {
  openedPillarId: string | null;
  isOpened: boolean;
  open: (id: string) => void;
  close: () => void;
  clearData: () => void;
}

export function usePillarDetailsDrawer(): UsePillarDetailsDrawerReturn {
  const [openedPillarId, setOpenedPillarId] = useState<string | null>(null);
  const [isOpened, setIsOpened] = useState(false);

  const open = useCallback((id: string) => {
    setOpenedPillarId(id);
    setIsOpened(true);
  }, []);

  const close = useCallback(() => {
    setIsOpened(false);
  }, []);

  const clearData = useCallback(() => {
    setOpenedPillarId(null);
  }, []);

  return {
    openedPillarId,
    isOpened,
    open,
    close,
    clearData,
  };
}
