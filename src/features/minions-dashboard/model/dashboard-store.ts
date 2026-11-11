import { ensureUserSettingsLoaded } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, runInAction, toJS } from "mobx";

import {
  DASHBOARD_GRID_COLS,
  DASHBOARD_MAX_CARDS,
  getDefaultCardSize,
} from "../constants/dashboard-cards";

import {
  canRemoveDashboardTab,
  createDashboardCard,
  createDashboardTab,
  createDefaultTabCards,
  createUniqueTabName,
  DashboardCardConfig,
  DashboardFieldOption,
  DashboardLayoutItem,
  DashboardPreset,
  DashboardTab,
  DashboardTabNames,
  DashboardTabScope,
  getUpdatedDashboardCard,
  moveDashboardTab,
  normalizeDashboardStorage,
  normalizeGlobalDashboardTabs,
  normalizeTabName,
  TabNameError,
  validateTabName,
} from "./dashboard-model";
import {
  getDashboardSettings,
  getGlobalDashboardSettings,
  setDashboardSettings,
  setGlobalDashboardSettings,
} from "./dashboard-settings";

export class DashboardStore {
  private localTabs: DashboardTab[];
  private globalTabs: DashboardTab[];
  activeTabId: string;
  fullScreenCardId: string | null;
  isHydrated = false;
  private userId: string | null = null;
  private collectionSlug: string | null = null;
  private tabNames: DashboardTabNames | null = null;

  constructor() {
    makeAutoObservable(this);
    this.localTabs = [];
    this.globalTabs = [];
    this.activeTabId = "";
    this.fullScreenCardId = null;
  }

  init(userId: string) {
    if (this.userId === userId) {
      return;
    }
    this.userId = userId;
    this.reload();
  }

  setCollection(collectionSlug: string | null, tabNames: DashboardTabNames) {
    this.tabNames = tabNames;
    if (this.collectionSlug === collectionSlug) {
      this.syncDefaultTabName();
      return;
    }
    this.collectionSlug = collectionSlug;
    this.reload();
  }

  private syncDefaultTabName() {
    if (!this.tabNames) {
      return;
    }
    const tab = this.localTabs.find((item) => item.primary);
    if (!tab || tab.nameCustomized) {
      return;
    }
    const name = createUniqueTabName(this.tabNames.firstTab, this.localTabs, tab.id);
    if (name === tab.name) {
      return;
    }
    tab.name = name;
    this.saveLocal();
  }

  private reload() {
    this.isHydrated = false;
    this.localTabs = [];
    this.globalTabs = [];
    this.activeTabId = "";
    this.fullScreenCardId = null;

    if (!this.userId || !this.collectionSlug || !this.tabNames) {
      return;
    }

    const collectionSlug = this.collectionSlug;

    ensureUserSettingsLoaded()
      .catch((error: unknown) => {
        console.error("Failed to load dashboard settings", error);
      })
      .then(() => {
        if (this.collectionSlug !== collectionSlug) {
          return;
        }
        runInAction(() => {
          this.applySettings(collectionSlug);
        });
      });
  }

  private applySettings(collectionSlug: string) {
    if (!this.tabNames) {
      return;
    }

    const globalTabs = normalizeGlobalDashboardTabs(getGlobalDashboardSettings(), this.tabNames);
    const stored = normalizeDashboardStorage(
      getDashboardSettings(collectionSlug),
      this.tabNames,
      globalTabs
    );
    this.globalTabs = globalTabs.map((tab) => this.withDefaultLayout(tab));
    this.localTabs = stored.tabs.map((tab) => this.withDefaultLayout(tab));
    this.activeTabId = stored.activeTabId;
    this.fullScreenCardId = null;
    this.isHydrated = true;
    this.syncDefaultTabName();
  }

  private withDefaultLayout(tab: DashboardTab): DashboardTab {
    return {
      ...tab,
      layout: tab.layout.length > 0 ? tab.layout : this.buildDefaultLayout(tab.cards),
    };
  }

  private get groupedTabs(): DashboardTab[][] {
    return [
      this.localTabs.filter((tab) => tab.primary),
      this.globalTabs,
      this.localTabs.filter((tab) => !tab.primary),
    ];
  }

  get tabs(): DashboardTab[] {
    return this.groupedTabs.flat();
  }

  get tabGroups(): string[][] {
    return this.groupedTabs.map((group) => group.map((tab) => tab.id));
  }

  private get globalTabIds(): Set<string> {
    return new Set(this.globalTabs.map((tab) => tab.id));
  }

  isGlobalTab(tabId: string): boolean {
    return this.globalTabIds.has(tabId);
  }

  get primaryTabId(): string | undefined {
    return this.localTabs.find((tab) => tab.primary)?.id;
  }

  private getTabScope(tabId: string): DashboardTabScope {
    return this.isGlobalTab(tabId) ? "global" : "local";
  }

  private getScopeTabs(scope: DashboardTabScope): DashboardTab[] {
    return scope === "global" ? this.globalTabs : this.localTabs;
  }

  private setScopeTabs(scope: DashboardTabScope, tabs: DashboardTab[]) {
    if (scope === "global") {
      this.globalTabs = tabs;
    } else {
      this.localTabs = tabs;
    }
  }

  private get activeTabScope(): DashboardTabScope {
    return this.activeTab ? this.getTabScope(this.activeTab.id) : "local";
  }

  get isActiveTabGlobal(): boolean {
    return this.activeTabScope === "global";
  }

  private get reservedTabNames(): string[] {
    return this.tabNames?.firstTabAliases ?? [];
  }

  validateNewTabName(name: string, scope: DashboardTabScope): TabNameError | null {
    return validateTabName(name, this.getScopeTabs(scope), {
      reservedNames: this.reservedTabNames,
    });
  }

  get newTabName(): string {
    return this.tabNames ? createUniqueTabName(this.tabNames.newTab, this.tabs) : "";
  }

  get activeTab(): DashboardTab {
    return this.tabs.find((tab) => tab.id === this.activeTabId) ?? this.tabs[0];
  }

  get cards(): DashboardCardConfig[] {
    return this.activeTab?.cards ?? [];
  }

  get layout(): DashboardLayoutItem[] {
    return this.activeTab?.layout ?? [];
  }

  get isCardFullScreen(): boolean {
    return this.fullScreenCardId !== null;
  }

  setCardFullScreen(cardId: string | null) {
    this.fullScreenCardId = cardId;
  }

  get canAddCard(): boolean {
    return this.cards.length < DASHBOARD_MAX_CARDS;
  }

  private buildDefaultLayout(cards: DashboardCardConfig[]): DashboardLayoutItem[] {
    const layout: DashboardLayoutItem[] = [];

    for (const card of cards) {
      const size = getDefaultCardSize(card.preset);
      const { x, y } = this.findFirstAvailablePosition(layout, size.width, size.height);
      layout.push({
        id: card.id,
        x,
        y,
        width: size.width,
        height: size.height,
      });
    }

    return layout;
  }

  private saveLocal() {
    if (!this.isHydrated || !this.collectionSlug) {
      return;
    }
    setDashboardSettings(this.collectionSlug, {
      tabs: toJS(this.localTabs),
      activeTabId: this.activeTabId,
    });
  }

  private saveGlobal() {
    if (!this.isHydrated) {
      return;
    }
    setGlobalDashboardSettings({ tabs: toJS(this.globalTabs) });
  }

  private saveScope(scope: DashboardTabScope) {
    if (scope === "global") {
      this.saveGlobal();
    } else {
      this.saveLocal();
    }
  }

  private saveScopeWithActiveTab(scope: DashboardTabScope) {
    if (scope === "global") {
      this.saveGlobal();
    }
    this.saveLocal();
  }

  setActiveTab(tabId: string) {
    if (!this.tabs.some((tab) => tab.id === tabId)) {
      return;
    }
    this.activeTabId = tabId;
    this.fullScreenCardId = null;
    this.saveLocal();
  }

  addTab(name: string, scope: DashboardTabScope): boolean {
    if (!this.isHydrated || this.validateNewTabName(name, scope)) {
      return false;
    }
    const tab = createDashboardTab(normalizeTabName(name));
    this.setScopeTabs(scope, [...this.getScopeTabs(scope), tab]);
    this.activeTabId = tab.id;
    this.fullScreenCardId = null;
    this.saveScopeWithActiveTab(scope);
    return true;
  }

  removeTab(tabId: string) {
    const tabIndex = this.tabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1 || !canRemoveDashboardTab(this.tabs[tabIndex], this.tabs)) {
      return;
    }
    const scope = this.getTabScope(tabId);
    this.setScopeTabs(
      scope,
      this.getScopeTabs(scope).filter((tab) => tab.id !== tabId)
    );
    if (this.activeTabId === tabId) {
      this.activeTabId = this.tabs[Math.min(tabIndex, this.tabs.length - 1)].id;
    }
    this.fullScreenCardId = null;
    this.saveScopeWithActiveTab(scope);
  }

  moveTab(fromTabId: string, toTabId: string) {
    const group = this.tabGroups.find((tabIds) => tabIds.includes(fromTabId));
    if (!group?.includes(toTabId)) {
      return;
    }
    const scope = this.getTabScope(fromTabId);
    const source = this.getScopeTabs(scope);
    const tabs = moveDashboardTab(source, fromTabId, toTabId);
    if (tabs === source) {
      return;
    }
    this.setScopeTabs(scope, tabs);
    this.saveScope(scope);
  }

  renameTab(tabId: string, name: string): TabNameError | null {
    const tab = this.tabs.find((item) => item.id === tabId);
    if (!tab) {
      return null;
    }
    const normalized = normalizeTabName(name);
    if (normalized === tab.name) {
      return null;
    }
    const scope = this.getTabScope(tabId);
    const error = validateTabName(name, this.getScopeTabs(scope), {
      excludeTabId: tabId,
      reservedNames: tab.primary ? [] : this.reservedTabNames,
    });
    if (error) {
      return error;
    }
    tab.name = normalized;
    tab.nameCustomized = true;
    this.saveScope(scope);
    return null;
  }

  updateLayout(layout: DashboardLayoutItem[]) {
    if (!this.activeTab) {
      return;
    }
    this.activeTab.layout = layout;
    this.saveScope(this.activeTabScope);
  }

  addCard(fieldOption: DashboardFieldOption, preset: DashboardPreset) {
    if (!this.activeTab || !this.canAddCard) {
      return;
    }
    const card = createDashboardCard(fieldOption, preset);
    const size = getDefaultCardSize(preset);
    const { x, y } = this.findFirstAvailablePosition(this.layout, size.width, size.height);
    this.activeTab.cards.unshift(card);
    this.activeTab.layout = [
      {
        id: card.id,
        x,
        y,
        width: size.width,
        height: size.height,
      },
      ...this.layout,
    ];
    this.saveScope(this.activeTabScope);
  }

  private findFirstAvailablePosition(
    layout: DashboardLayoutItem[],
    width: number,
    height: number
  ): { x: number; y: number } {
    const maxY = layout.reduce((max, item) => Math.max(max, item.y + item.height), 0);
    for (let y = 0; y <= maxY; y++) {
      for (let x = 0; x <= DASHBOARD_GRID_COLS - width; x++) {
        const candidate: DashboardLayoutItem = { id: "", x, y, width, height };
        if (!layout.some((placed) => this.isCardsOverlap(candidate, placed))) {
          return { x, y };
        }
      }
    }
    return { x: 0, y: maxY };
  }

  updateCard(cardId: string, fieldOption: DashboardFieldOption, preset: DashboardPreset) {
    const cardIndex = this.cards.findIndex((item) => item.id === cardId);
    if (cardIndex === -1) {
      return;
    }
    this.activeTab.cards[cardIndex] = getUpdatedDashboardCard(
      this.cards[cardIndex],
      fieldOption,
      preset
    );
    const size = getDefaultCardSize(preset);
    this.activeTab.layout = this.compactCards(
      this.layout.map((item) => {
        if (item.id !== cardId) {
          return item;
        }
        return {
          ...item,
          width: size.width,
          height: size.height,
        };
      })
    );
    this.saveScope(this.activeTabScope);
  }

  removeCard(cardId: string) {
    if (!this.activeTab) {
      return;
    }
    this.activeTab.cards = this.cards.filter((card) => card.id !== cardId);
    const remaining = this.layout.filter((item) => item.id !== cardId);
    this.activeTab.layout = this.compactCards(remaining);
    this.saveScope(this.activeTabScope);
  }

  resetToDefault() {
    const tab = this.activeTab;
    if (!tab) {
      return;
    }
    tab.cards = tab.primary ? createDefaultTabCards(tab.id) : [];
    tab.layout = this.buildDefaultLayout(tab.cards);
    this.fullScreenCardId = null;
    this.saveScope(this.activeTabScope);
  }

  private isCardsOverlap(card: DashboardLayoutItem, placedCard: DashboardLayoutItem): boolean {
    return (
      card.x < placedCard.x + placedCard.width &&
      card.x + card.width > placedCard.x &&
      card.y < placedCard.y + placedCard.height &&
      card.y + card.height > placedCard.y
    );
  }

  private compactCards(layout: DashboardLayoutItem[]): DashboardLayoutItem[] {
    const sorted = [...layout].sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));
    const compacted: DashboardLayoutItem[] = [];
    for (const card of sorted) {
      const { x, y } = this.findFirstAvailablePosition(compacted, card.width, card.height);
      compacted.push({ ...card, x, y });
    }
    return compacted;
  }
}

export const dashboardStore = new DashboardStore();
