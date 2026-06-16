import { makeAutoObservable } from "mobx";

import { DASHBOARD_MAX_CARDS } from "../constants/dashboard-cards";
import { DASHBOARD_STORAGE_KEY, DASHBOARD_STORAGE_VERSION } from "../constants/dashboard-storage";

import {
  createDashboardCard,
  DashboardCardConfig,
  DashboardFieldOption,
  DashboardPreset,
  getUpdatedDashboardCard,
  normalizeDashboardStorage,
} from "./dashboard-model";

export class DashboardStore {
  cards: DashboardCardConfig[];
  fullScreenCardId: string | null;

  constructor() {
    makeAutoObservable(this);
    this.cards = this.loadFromLocalStorage();
    this.fullScreenCardId = null;
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

  loadFromLocalStorage(): DashboardCardConfig[] {
    return normalizeDashboardStorage(localStorage.getItem(DASHBOARD_STORAGE_KEY)).cards;
  }

  saveToLocalStorage() {
    localStorage.setItem(
      DASHBOARD_STORAGE_KEY,
      JSON.stringify({ version: DASHBOARD_STORAGE_VERSION, cards: this.cards })
    );
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
