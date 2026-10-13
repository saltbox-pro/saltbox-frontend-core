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
  getUpdatedDashboardCard,
  moveDashboardTab,
  normalizeDashboardStorage,
  normalizeTabName,
  TabNameError,
  validateTabName,
} from "./dashboard-model";
import { getDashboardSettings, setDashboardSettings } from "./dashboard-settings";

export class DashboardStore {
  tabs: DashboardTab[];
  activeTabId: string;
  fullScreenCardId: string | null;
  private userId: string | null = null;
  private collectionSlug: string | null = null;
  private tabNames: DashboardTabNames | null = null;

  constructor() {
    makeAutoObservable(this);
    this.tabs = [];
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
    const tab = this.tabs.find((item) => item.primary);
    if (!tab || tab.nameCustomized) {
      return;
    }
    const name = createUniqueTabName(this.tabNames.firstTab, this.tabs, tab.id);
    if (name === tab.name) {
      return;
    }
    tab.name = name;
    this.saveSettings();
  }

  private reload() {
    this.tabs = [];
    this.activeTabId = "";
    this.fullScreenCardId = null;

    if (!this.userId || !this.collectionSlug || !this.tabNames) {
      return;
    }

    const collectionSlug = this.collectionSlug;

    ensureUserSettingsLoaded().then(() => {
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

    const stored = normalizeDashboardStorage(getDashboardSettings(collectionSlug), this.tabNames);
    this.tabs = stored.tabs.map((tab) => ({
      ...tab,
      layout: tab.layout.length > 0 ? tab.layout : this.buildDefaultLayout(tab.cards),
    }));
    this.activeTabId = stored.activeTabId;
    this.fullScreenCardId = null;
    this.syncDefaultTabName();
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

  private saveSettings() {
    if (!this.collectionSlug) {
      return;
    }

    setDashboardSettings(this.collectionSlug, {
      tabs: toJS(this.tabs),
      activeTabId: this.activeTabId,
    });
  }

  setActiveTab(tabId: string) {
    if (!this.tabs.some((tab) => tab.id === tabId)) {
      return;
    }
    this.activeTabId = tabId;
    this.fullScreenCardId = null;
    this.saveSettings();
  }

  addTab(): string | null {
    if (!this.tabNames) {
      return null;
    }
    const tab = createDashboardTab(createUniqueTabName(this.tabNames.newTab, this.tabs));
    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.fullScreenCardId = null;
    this.saveSettings();
    return tab.id;
  }

  removeTab(tabId: string) {
    const tabIndex = this.tabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1 || !canRemoveDashboardTab(this.tabs[tabIndex], this.tabs)) {
      return;
    }
    this.tabs.splice(tabIndex, 1);
    if (this.activeTabId === tabId) {
      this.activeTabId = this.tabs[Math.min(tabIndex, this.tabs.length - 1)].id;
    }
    this.fullScreenCardId = null;
    this.saveSettings();
  }

  moveTab(fromTabId: string, toTabId: string) {
    const tabs = moveDashboardTab(this.tabs, fromTabId, toTabId);
    if (tabs === this.tabs) {
      return;
    }
    this.tabs = tabs;
    this.saveSettings();
  }

  renameTab(tabId: string, name: string): TabNameError | null {
    const tab = this.tabs.find((item) => item.id === tabId);
    if (!tab) {
      return null;
    }
    const error = validateTabName(name, this.tabs, tabId);
    if (error) {
      return error;
    }
    const normalized = normalizeTabName(name);
    if (normalized === tab.name) {
      return null;
    }
    tab.name = normalized;
    tab.nameCustomized = true;
    this.saveSettings();
    return null;
  }

  updateLayout(layout: DashboardLayoutItem[]) {
    if (!this.activeTab) {
      return;
    }
    this.activeTab.layout = layout;
    this.saveSettings();
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
    this.saveSettings();
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
    this.saveSettings();
  }

  removeCard(cardId: string) {
    if (!this.activeTab) {
      return;
    }
    this.activeTab.cards = this.cards.filter((card) => card.id !== cardId);
    const remaining = this.layout.filter((item) => item.id !== cardId);
    this.activeTab.layout = this.compactCards(remaining);
    this.saveSettings();
  }

  resetToDefault() {
    const tab = this.activeTab;
    if (!tab) {
      return;
    }
    tab.cards = tab.primary ? createDefaultTabCards(tab.id) : [];
    tab.layout = this.buildDefaultLayout(tab.cards);
    this.fullScreenCardId = null;
    this.saveSettings();
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
