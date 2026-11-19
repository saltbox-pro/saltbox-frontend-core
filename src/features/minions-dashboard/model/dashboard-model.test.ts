import { MinionFilterGroup } from "@saltbox/saltbox-core-api-client";
import { toJS, when } from "mobx";

import {
  createDashboardCard,
  DashboardFieldCardConfig,
  normalizeDashboardStorage,
  normalizeGlobalDashboardTabs,
} from "./dashboard-model";
import { DashboardStore } from "./dashboard-store";

jest.mock("@babel/runtime/helpers/esm/defineProperty", () =>
  jest.requireActual("@babel/runtime/helpers/defineProperty")
);

jest.mock("@saltbox/saltbox-frontend-common", () => ({
  getLocalizedText: jest.fn(),
  ensureUserSettingsLoaded: jest.fn().mockResolvedValue(undefined),
  getUserSettingsValue: jest.fn(),
  setUserSettingsValue: jest.fn(),
}));

const names = { firstTab: "Overview", newTab: "New tab", firstTabAliases: [] };
const settings = {
  from: "2026-11-01T00:00:00Z",
  to: "2026-11-02T00:00:00Z",
  interval: "hour" as const,
};

describe("dashboard history card settings", () => {
  it("keeps card positions and dimensions when changing history settings", async () => {
    const store = new DashboardStore();
    store.init("user");
    store.setCollection("collection", names);
    await when(() => store.isHydrated);
    store.addCard({ kind: "collection-history", settings });
    const card = store.cards.find((item) => item.kind === "collection-history");
    store.updateLayout(
      store.layout.map((item) =>
        item.id === card.id ? { ...item, x: 1, y: 5, width: 2, height: 2 } : item
      )
    );
    const layout = toJS(store.layout);
    store.updateCard(card.id, {
      kind: "collection-history",
      settings: { ...settings, interval: "day" },
    });
    expect(toJS(store.layout)).toEqual(layout);
    expect(store.cards.find((item) => item.id === card.id)).toMatchObject({
      settings: { ...settings, interval: "day" },
    });
  });
  it("preserves history settings and card ids after saving and restoring", () => {
    const card = createDashboardCard({ kind: "collection-history", settings }, "history-card");
    const stored = JSON.stringify({
      tabs: [{ id: "tab", name: "Overview", primary: true, cards: [card], layout: [] }],
      activeTabId: "tab",
    });
    expect(normalizeDashboardStorage(stored, names, []).tabs[0].cards).toEqual([card]);
    expect(normalizeGlobalDashboardTabs(stored, names)[0].cards).toEqual([card]);
  });

  it("continues restoring legacy field cards without a kind", () => {
    const card: DashboardFieldCardConfig = {
      id: "os-card",
      field: "os",
      fieldSource: "grains.os",
      fieldLabel: "OS",
      fieldType: "categorical",
      preset: "donut",
    };
    const restored = normalizeDashboardStorage({ cards: [card], layout: [] }, names, []);
    expect(restored.tabs[0].cards[0]).toMatchObject(card);
  });

  it("replaces invalid history settings without losing other cards", () => {
    const card = createDashboardCard({ kind: "collection-history", settings });
    const restored = normalizeDashboardStorage(
      {
        cards: [
          { ...card, settings: { from: "invalid", to: null, interval: "year" } },
          createDashboardCard({
            kind: "field",
            preset: "donut",
            fieldOption: {
              value: "os",
              source: "grains.os",
              label: "OS",
              type: "categorical",
              group: MinionFilterGroup.Grains,
            },
          }),
        ],
        layout: [],
      },
      names,
      []
    );
    expect(restored.tabs[0].cards).toHaveLength(2);
    expect(restored.tabs[0].cards[0]).toMatchObject({
      id: card.id,
      kind: "collection-history",
      settings: { interval: "day" },
    });
  });
});
