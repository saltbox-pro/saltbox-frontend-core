import { makeAutoObservable } from "mobx";

import {
  DASHBOARD_GRID_COLS,
  DASHBOARD_MAX_CARDS,
  getDefaultCardSize,
} from "../constants/dashboard-cards";
import { DASHBOARD_STORAGE_KEY } from "../constants/dashboard-storage";

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
  normalizeDashboardStorage,
  normalizeTabName,
  TabNameError,
  validateTabName,
} from "./dashboard-model";

export class DashboardStore {
  tabs: DashboardTab[];
  activeTabId: string;
  fullScreenCardId: string | null;
  private storageKey: string | null = null;
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
      return;
    }
    this.collectionSlug = collectionSlug;
    this.reload();
  }

  get isReady(): boolean {
    return this.storageKey !== null && this.tabs.length > 0;
  }

  private reload() {
    if (!this.userId || !this.collectionSlug || !this.tabNames) {
      this.storageKey = null;
      this.tabs = [];
      this.activeTabId = "";
      this.fullScreenCardId = null;
      return;
    }

    this.storageKey = `${DASHBOARD_STORAGE_KEY}:${this.userId}:${this.collectionSlug}`;
    const stored = normalizeDashboardStorage(localStorage.getItem(this.storageKey), this.tabNames);
    this.tabs = stored.tabs.map((tab) => ({
      ...tab,
      layout: tab.layout.length > 0 ? tab.layout : this.buildDefaultLayout(tab.cards),
    }));
    this.activeTabId = stored.activeTabId;
    this.fullScreenCardId = null;
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

  saveToLocalStorage() {
    if (!this.storageKey) {
      return;
    }
    localStorage.setItem(
      this.storageKey,
      JSON.stringify({ tabs: this.tabs, activeTabId: this.activeTabId })
    );
  }

  setActiveTab(tabId: string) {
    if (!this.tabs.some((tab) => tab.id === tabId)) {
      return;
    }
    this.activeTabId = tabId;
    this.fullScreenCardId = null;
    this.saveToLocalStorage();
  }

  addTab(): string | null {
    if (!this.tabNames) {
      return null;
    }
    const tab = createDashboardTab(createUniqueTabName(this.tabNames.newTab, this.tabs));
    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.fullScreenCardId = null;
    this.saveToLocalStorage();
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
    this.saveToLocalStorage();
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
    tab.name = normalizeTabName(name);
    this.saveToLocalStorage();
    return null;
  }

  updateLayout(layout: DashboardLayoutItem[]) {
    if (!this.activeTab) {
      return;
    }
    this.activeTab.layout = layout;
    this.saveToLocalStorage();
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
    this.saveToLocalStorage();
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
    this.saveToLocalStorage();
  }

  removeCard(cardId: string) {
    if (!this.activeTab) {
      return;
    }
    this.activeTab.cards = this.cards.filter((card) => card.id !== cardId);
    const remaining = this.layout.filter((item) => item.id !== cardId);
    this.activeTab.layout = this.compactCards(remaining);
    this.saveToLocalStorage();
  }

  resetToDefault() {
    const tab = this.activeTab;
    if (!tab) {
      return;
    }
    tab.cards = createDefaultTabCards(tab.id);
    tab.layout = this.buildDefaultLayout(tab.cards);
    this.fullScreenCardId = null;
    this.saveToLocalStorage();
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
