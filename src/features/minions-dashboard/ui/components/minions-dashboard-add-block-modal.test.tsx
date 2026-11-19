import { act, ComponentProps } from "react";
import { createRoot, Root } from "react-dom/client";

import type { DashboardHistoryCardConfig } from "../../model/dashboard-model";

import { MinionsDashboardAddBlockModal } from "./minions-dashboard-add-block-modal";

jest.mock("@saltbox/saltbox-frontend-common", () => ({
  createFilterLabelComparator: () => (left: string, right: string) => left.localeCompare(right),
  getLocalizedText: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));

beforeAll(() => {
  const getComputedStyle = window.getComputedStyle.bind(window);
  jest.spyOn(window, "getComputedStyle").mockImplementation((element) => getComputedStyle(element));
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

afterAll(() => jest.restoreAllMocks());

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

const renderModal = async (
  props: Partial<ComponentProps<typeof MinionsDashboardAddBlockModal>>
) => {
  await act(async () => {
    root.render(
      <MinionsDashboardAddBlockModal
        open
        fieldOptions={[]}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        {...props}
      />
    );
  });
};

const clickButton = async (name: string) => {
  const button = Array.from(document.querySelectorAll("button")).find(
    (item) => item.textContent === name
  );
  expect(button).toBeTruthy();
  await act(async () => button.click());
};

const card: DashboardHistoryCardConfig = {
  id: "history",
  kind: "collection-history",
  preset: "collection-history",
  settings: { from: "2026-01-01T00:00:00Z", to: "2026-01-15T00:00:00Z", interval: "week" },
};

it("creates a history card without selecting a client field", async () => {
  const onSubmit = jest.fn();
  await renderModal({ onSubmit });
  const option = Array.from(document.querySelectorAll("label")).find(
    (item) => item.textContent === "dashboard.history-title"
  );
  expect(option).toBeTruthy();
  await act(async () => option.click());
  expect(document.getElementById("collection-history-period")).toBeTruthy();
  expect(document.getElementById("collection-history-interval")).toBeTruthy();
  await clickButton("dashboard.create-block");
  expect(onSubmit).toHaveBeenCalledWith({
    kind: "collection-history",
    settings: expect.objectContaining({
      from: expect.any(String),
      to: expect.any(String),
      interval: "day",
    }),
  });
});

it("restores and saves an existing history period and interval", async () => {
  const onSubmit = jest.fn();
  await renderModal({ initialCard: card, onSubmit });
  await clickButton("dashboard.save-block");
  expect(onSubmit).toHaveBeenCalledWith({ kind: "collection-history", settings: card.settings });
});

it("prevents submitting a history query exceeding the point limit", async () => {
  const onSubmit = jest.fn();
  await renderModal({
    initialCard: {
      ...card,
      settings: { ...card.settings, to: "2026-12-01T00:00:00Z", interval: "hour" },
    },
    onSubmit,
  });
  expect(document.querySelector('[role="alert"]')?.textContent).toBe(
    "dashboard.history-too-many-points"
  );
  const saveButton = Array.from(document.querySelectorAll("button")).find(
    (item) => item.textContent === "dashboard.save-block"
  );
  expect(saveButton.disabled).toBe(true);
  expect(onSubmit).not.toHaveBeenCalled();
});
