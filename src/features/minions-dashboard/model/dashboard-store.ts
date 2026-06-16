import { makeAutoObservable } from "mobx";

import {
  createDashboardCard,
  DASHBOARD_MAX_CARDS,
  DashboardCardConfig,
  DashboardFieldOption,
  DashboardPreset,
  getUpdatedDashboardCard,
  normalizeDashboardStorage,
} from "./dashboard-model";

const STORAGE_KEY = "savedBlocks";

export class DashboardStore {
  cards: DashboardCardConfig[];
  isCardFullScreen: boolean;

  constructor() {
    makeAutoObservable(this);
    this.cards = this.loadFromLocalStorage();
    this.isCardFullScreen = false;
  }

  setCardFullScreen(isFullScreen: boolean) {
    this.isCardFullScreen = isFullScreen;
  }

  get canAddCard(): boolean {
    return this.cards.length < DASHBOARD_MAX_CARDS;
  }

  loadFromLocalStorage(): DashboardCardConfig[] {
    return normalizeDashboardStorage(localStorage.getItem(STORAGE_KEY)).cards;
  }

  saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, cards: this.cards }));
  }

  addCard(fieldOption: DashboardFieldOption, preset: DashboardPreset) {
    if (!this.canAddCard) {
      return;
    }
    this.cards.unshift(createDashboardCard(fieldOption, preset));
    this.saveToLocalStorage();
  }

  updateCard(cardId: string, fieldOption: DashboardFieldOption, preset: DashboardPreset) {
    const cardIndex = this.cards.findIndex((item) => item.id === cardId);
    if (cardIndex === -1) {
      return;
    }
    this.cards[cardIndex] = getUpdatedDashboardCard(this.cards[cardIndex], fieldOption, preset);
    this.saveToLocalStorage();
  }

  removeCard(cardId: string) {
    this.cards = this.cards.filter((card) => card.id !== cardId);
    this.saveToLocalStorage();
  }
}

export const dashboardStore = new DashboardStore();
