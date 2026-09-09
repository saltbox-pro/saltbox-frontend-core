import { makeAutoObservable } from "mobx";

import {
  DASHBOARD_GRID_COLS,
  DASHBOARD_MAX_CARDS,
  getDefaultCardSize,
} from "../constants/dashboard-cards";
import { DASHBOARD_STORAGE_KEY } from "../constants/dashboard-storage";

import {
  createDashboardCard,
  createDashboardTab,
  createDefaultTabCards,
  DashboardCardConfig,
  DashboardFieldOption,
  DashboardLayoutItem,
  DashboardPreset,
  DashboardTab,
  getUpdatedDashboardCard,
  normalizeDashboardStorage,
  normalizeTabName,
} from "./dashboard-model";

export class DashboardStore {
  tabs: DashboardTab[];
  activeTabId: string;
  fullScreenCardId: string | null;
  private storageKey = DASHBOARD_STORAGE_KEY;
  private initializedUserId: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.tabs = [];
    this.activeTabId = "";
    this.fullScreenCardId = null;
  }

  init(userId: string) {
    if (this.initializedUserId === userId) {
      return;
    }
    this.initializedUserId = userId;
    this.storageKey = `${DASHBOARD_STORAGE_KEY}:${userId}`;
    const stored = this.loadFromLocalStorage();
    this.tabs = stored.tabs.map((tab) => ({
      ...tab,
      layout: tab.layout.length > 0 ? tab.layout : this.buildDefaultLayout(tab.cards),
    }));
    this.activeTabId = stored.activeTabId;
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

  get canRemoveTab(): boolean {
    return this.tabs.length > 1;
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

  loadFromLocalStorage() {
    return normalizeDashboardStorage(localStorage.getItem(this.storageKey));
  }

  saveToLocalStorage() {
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

  addTab() {
    const nameIndex = this.tabs.reduce((max, item) => Math.max(max, item.nameIndex), 0) + 1;
    const tab = createDashboardTab(nameIndex);
    tab.layout = this.buildDefaultLayout(tab.cards);
    this.tabs.push(tab);
    this.activeTabId = tab.id;
    this.fullScreenCardId = null;
    this.saveToLocalStorage();
  }

  removeTab(tabId: string) {
    if (!this.canRemoveTab) {
      return;
    }
    const tabIndex = this.tabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1) {
      return;
    }
    this.tabs.splice(tabIndex, 1);
    if (this.activeTabId === tabId) {
      this.activeTabId = this.tabs[Math.max(tabIndex - 1, 0)].id;
    }
    this.fullScreenCardId = null;
    this.saveToLocalStorage();
  }

  renameTab(tabId: string, name: string) {
    const tab = this.tabs.find((item) => item.id === tabId);
    if (!tab) {
      return;
    }
    tab.name = normalizeTabName(name);
    this.saveToLocalStorage();
  }

  updateLayout(layout: DashboardLayoutItem[]) {
    this.activeTab.layout = layout;
    this.saveToLocalStorage();
  }

  addCard(fieldOption: DashboardFieldOption, preset: DashboardPreset) {
    if (!this.canAddCard) {
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
