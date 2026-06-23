import { makeAutoObservable } from "mobx";

import {
  DASHBOARD_GRID_COLS,
  DASHBOARD_MAX_CARDS,
  getDefaultCardSize,
} from "../constants/dashboard-cards";
import { DASHBOARD_STORAGE_KEY } from "../constants/dashboard-storage";

import {
  createDashboardCard,
  DashboardCardConfig,
  DashboardFieldOption,
  DashboardLayoutItem,
  DashboardPreset,
  getUpdatedDashboardCard,
  normalizeDashboardStorage,
} from "./dashboard-model";

export class DashboardStore {
  cards: DashboardCardConfig[];
  layout: DashboardLayoutItem[];
  fullScreenCardId: string | null;
  private storageKey = DASHBOARD_STORAGE_KEY;
  private initializedUserId: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.cards = [];
    this.layout = [];
    this.fullScreenCardId = null;
  }

  init(userId: string) {
    if (this.initializedUserId === userId) {
      return;
    }
    this.initializedUserId = userId;
    this.storageKey = `${DASHBOARD_STORAGE_KEY}:${userId}`;
    const stored = this.loadFromLocalStorage();
    this.cards = stored.cards;
    this.layout = stored.layout.length > 0 ? stored.layout : this.buildDefaultLayout(stored.cards);
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
    let currentX = 0;
    let currentY = 0;
    let rowHeight = 0;

    return cards.map((card) => {
      const size = getDefaultCardSize(card.preset);
      if (currentX + size.width > DASHBOARD_GRID_COLS) {
        currentX = 0;
        currentY += rowHeight;
        rowHeight = 0;
      }
      const item: DashboardLayoutItem = {
        id: card.id,
        x: currentX,
        y: currentY,
        width: size.width,
        height: size.height,
        minWidth: size.minWidth,
        minHeight: size.minHeight,
      };
      currentX += size.width;
      rowHeight = Math.max(rowHeight, size.height);
      return item;
    });
  }

  loadFromLocalStorage() {
    return normalizeDashboardStorage(localStorage.getItem(this.storageKey));
  }

  saveToLocalStorage() {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify({ cards: this.cards, layout: this.layout })
    );
  }

  updateLayout(layout: DashboardLayoutItem[]) {
    this.layout = layout;
    this.saveToLocalStorage();
  }

  addCard(fieldOption: DashboardFieldOption, preset: DashboardPreset) {
    if (!this.canAddCard) {
      return;
    }
    const card = createDashboardCard(fieldOption, preset);
    const size = getDefaultCardSize(preset);
    const nextY = this.layout.reduce((max, item) => Math.max(max, item.y + item.height), 0);
    this.cards.unshift(card);
    this.layout = [
      {
        id: card.id,
        x: 0,
        y: nextY,
        width: size.width,
        height: size.height,
        minWidth: size.minWidth,
        minHeight: size.minHeight,
      },
      ...this.layout,
    ];
    this.saveToLocalStorage();
  }

  updateCard(cardId: string, fieldOption: DashboardFieldOption, preset: DashboardPreset) {
    const cardIndex = this.cards.findIndex((item) => item.id === cardId);
    if (cardIndex === -1) {
      return;
    }
    this.cards[cardIndex] = getUpdatedDashboardCard(this.cards[cardIndex], fieldOption, preset);
    const size = getDefaultCardSize(preset);
    this.layout = this.layout.map((item) => {
      if (item.id !== cardId) {
        return item;
      }
      return {
        ...item,
        width: size.width,
        height: size.height,
        minWidth: size.minWidth,
        minHeight: size.minHeight,
      };
    });
    this.saveToLocalStorage();
  }

  removeCard(cardId: string) {
    this.cards = this.cards.filter((card) => card.id !== cardId);
    const remaining = this.layout.filter((item) => item.id !== cardId);
    this.layout = this.compactVertical(remaining);
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

  private compactVertical(layout: DashboardLayoutItem[]): DashboardLayoutItem[] {
    const sorted = [...layout].sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));
    const compacted: DashboardLayoutItem[] = [];
    for (const item of sorted) {
      let newY = 0;
      while (compacted.some((placed) => this.isCardsOverlap(placed, { ...item, y: newY }))) {
        newY++;
      }
      compacted.push({ ...item, y: newY });
    }
    return compacted;
  }
}

export const dashboardStore = new DashboardStore();
