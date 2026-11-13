import {
  type AuthStoreWithAccessToken,
  type SidebarLayout,
  ensureUserSettingsLoaded,
  flushUserSettings,
  getSidebarLayout,
  revertSidebarLayout,
  setSidebarLayout,
  subscribeUserSettings,
} from "@saltbox/saltbox-frontend-common";
import { reaction } from "mobx";

export type MenuLayoutPort = {
  setLayoutPersister: (
    persist: ((layout: SidebarLayout | undefined) => Promise<void>) | null
  ) => void;
  applyStoredLayout: (layout: SidebarLayout | undefined) => void;
  setLayoutLoader?: (load: (() => void) | null) => void;
  failLayoutLoad?: () => void;
};

const toLayoutKey = (layout: SidebarLayout | undefined): string => JSON.stringify(layout ?? null);

export function bindSidebarSettings(
  authStore: AuthStoreWithAccessToken,
  menuLayout: MenuLayoutPort
): () => void {
  let isCancelled = false;
  let isLoaded = false;
  let isPersisting = false;
  let appliedLayoutKey: string | null = null;

  const applyStoredLayout = () => {
    if (isCancelled || !isLoaded || isPersisting) return;

    const layout = getSidebarLayout();
    const layoutKey = toLayoutKey(layout);
    if (layoutKey === appliedLayoutKey) return;

    appliedLayoutKey = layoutKey;
    menuLayout.applyStoredLayout(layout);
  };

  const persistLayout = async (layout: SidebarLayout | undefined): Promise<void> => {
    const previousLayout = getSidebarLayout();
    isPersisting = true;
    setSidebarLayout(layout);

    try {
      await flushUserSettings({ notifyOnError: false });
      appliedLayoutKey = toLayoutKey(layout);
    } catch (error) {
      revertSidebarLayout(previousLayout);
      throw error;
    } finally {
      isPersisting = false;
      applyStoredLayout();
    }
  };

  const loadStoredLayout = async (): Promise<void> => {
    try {
      await ensureUserSettingsLoaded();
      isLoaded = true;
      applyStoredLayout();
    } catch (error) {
      console.error("Failed to load the sidebar layout from user settings", error);
      if (!isCancelled) menuLayout.failLayoutLoad?.();
    }
  };

  menuLayout.setLayoutLoader?.(() => {
    loadStoredLayout();
  });
  menuLayout.setLayoutPersister(persistLayout);
  const unsubscribe = subscribeUserSettings(applyStoredLayout);

  const disposer = reaction(
    () => authStore.user?.access_token ?? null,
    (accessToken) => {
      if (accessToken) loadStoredLayout();
    },
    { fireImmediately: true }
  );

  return () => {
    isCancelled = true;
    disposer();
    unsubscribe();
    menuLayout.setLayoutPersister(null);
    menuLayout.setLayoutLoader?.(null);
  };
}
