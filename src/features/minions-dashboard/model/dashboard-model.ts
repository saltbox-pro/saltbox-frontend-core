import { DASHBOARD_MAX_CARDS, DEFAULT_DASHBOARD_CARDS } from "../constants/dashboard-cards";
import {
  ALLOWED_GRAIN_FIELDS,
  BOOLEAN_FIELD_NAMES,
  BOOLEAN_METADATA_TYPES,
  COMPLEX_FIELD_NAME_PARTS,
  DATE_FIELD_NAME_PARTS,
  DATE_METADATA_TYPES,
  NUMERIC_FIELD_NAMES,
  NUMERIC_METADATA_TYPES,
} from "../constants/dashboard-field-types";
import { PRESETS } from "../constants/dashboard-presets";

export type DashboardFieldType = "categorical" | "numeric" | "boolean" | "date" | "complex";

export type DashboardPreset =
  | "donut"
  | "horizontal-bar"
  | "vertical-bar"
  | "treemap"
  | "lollipop"
  | "histogram"
  | "kpi"
  | "boolean-donut"
  | "boolean-bars"
  | "table";

export type DashboardPresetOption = {
  value: DashboardPreset;
  labelKey: string;
  descriptionKey: string;
};

export type DashboardCardConfig = {
  id: string;
  field: string;
  fieldSource: string;
  fieldLabel: string;
  fieldType: DashboardFieldType;
  preset: DashboardPreset;
};

export type DashboardLayoutItem = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DashboardTab = {
  id: string;
  name: string;
  primary: boolean;
  nameCustomized: boolean;
  cards: DashboardCardConfig[];
  layout: DashboardLayoutItem[];
};

export type DashboardStorageConfig = {
  tabs: DashboardTab[];
  activeTabId: string;
};

export type DashboardTabNames = {
  firstTab: string;
  newTab: string;
  firstTabAliases: string[];
};

export type TabNameError = "empty" | "duplicate";

export type DashboardFieldOption = {
  value: string;
  label: string;
  source: string;
  type: DashboardFieldType;
};

type SchemaOption = {
  name?: string;
  value?: string;
  label?: string;
  datatype?: string;
  inputType?: string;
  type?: string;
  values?: unknown[];
  options?: SchemaOption[];
};

const normalizeFieldName = (field: string): string => {
  return field.replace(/^grains\./, "");
};

const createCardId = (field: string, suffix: number): string => {
  return `dashboard-card-${field.replace(/[^a-zA-Z0-9_-]/g, "-")}-${suffix}`;
};

const createTabId = (): string => {
  return `dashboard-tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const inferDashboardFieldType = (field: SchemaOption): DashboardFieldType => {
  const source = field.name || field.value || "";
  const normalizedName = normalizeFieldName(source).toLowerCase();
  const metadataType = String(field.datatype || field.inputType || field.type || "").toLowerCase();

  if (NUMERIC_METADATA_TYPES.includes(metadataType)) {
    return "numeric";
  }
  if (BOOLEAN_METADATA_TYPES.includes(metadataType)) {
    return "boolean";
  }
  if (DATE_METADATA_TYPES.includes(metadataType)) {
    return "date";
  }
  if (
    Array.isArray(field.values) &&
    field.values.length > 0 &&
    field.values.every((value) => typeof value === "boolean")
  ) {
    return "boolean";
  }
  if (NUMERIC_FIELD_NAMES.has(normalizedName)) {
    return "numeric";
  }
  if (BOOLEAN_FIELD_NAMES.has(normalizedName)) {
    return "boolean";
  }
  if (DATE_FIELD_NAME_PARTS.some((part) => normalizedName.includes(part))) {
    return "date";
  }
  if (COMPLEX_FIELD_NAME_PARTS.some((part) => normalizedName.includes(part))) {
    return "complex";
  }

  return "categorical";
};

export const getPresetOptionsForFieldType = (fieldType: DashboardFieldType) => {
  return PRESETS[fieldType];
};

const getDefaultPresetForField = (fieldType: DashboardFieldType): DashboardPreset => {
  return PRESETS[fieldType][0].value;
};

export const getDashboardFieldOptions = (
  schema: ReadonlyArray<SchemaOption> = []
): DashboardFieldOption[] => {
  const result: DashboardFieldOption[] = [];

  const visit = (option: SchemaOption) => {
    if (Array.isArray(option.options)) {
      option.options.forEach(visit);
      return;
    }

    const source = option.name || option.value;
    if (!source) {
      return;
    }

    result.push({
      value: normalizeFieldName(source),
      label: option.label || normalizeFieldName(source),
      source,
      type: inferDashboardFieldType(option),
    });
  };

  schema.forEach(visit);

  const seen = new Set<string>();
  return result
    .filter((opt) => {
      if (seen.has(opt.value)) {
        return false;
      }
      seen.add(opt.value);
      return true;
    })
    .filter((opt) => ALLOWED_GRAIN_FIELDS.has(opt.value));
};

const normalizePreset = (preset: string, fieldType: DashboardFieldType): DashboardPreset => {
  const isValid = PRESETS[fieldType].some((option) => option.value === preset);
  return isValid ? (preset as DashboardPreset) : getDefaultPresetForField(fieldType);
};

const normalizeCard = (card: DashboardCardConfig): DashboardCardConfig => {
  return {
    id: card.id,
    field: card.field,
    fieldSource: card.fieldSource,
    fieldLabel: card.fieldLabel,
    fieldType: card.fieldType,
    preset: normalizePreset(card.preset, card.fieldType),
  };
};

export const createDashboardCard = (
  fieldOption: DashboardFieldOption,
  preset: DashboardPreset
): DashboardCardConfig => {
  return {
    id: createCardId(fieldOption.value, Date.now()),
    field: fieldOption.value,
    fieldSource: fieldOption.source,
    fieldLabel: fieldOption.label,
    fieldType: fieldOption.type,
    preset,
  };
};

export const getUpdatedDashboardCard = (
  card: DashboardCardConfig,
  fieldOption: DashboardFieldOption,
  preset: DashboardPreset
): DashboardCardConfig => {
  return {
    ...card,
    field: fieldOption.value,
    fieldSource: fieldOption.source,
    fieldLabel: fieldOption.label,
    fieldType: fieldOption.type,
    preset,
  };
};

export const createDefaultTabCards = (tabId: string): DashboardCardConfig[] => {
  return DEFAULT_DASHBOARD_CARDS.map((card, index) => ({
    ...card,
    id: `${tabId}-${createCardId(card.field, index)}`,
  }));
};

export const normalizeTabName = (name: string): string => {
  return name.trim();
};

export const createUniqueTabName = (
  base: string,
  tabs: DashboardTab[],
  excludeTabId?: string
): string => {
  const taken = new Set(tabs.filter((tab) => tab.id !== excludeTabId).map((tab) => tab.name));
  if (!taken.has(base)) {
    return base;
  }
  let suffix = 2;
  while (taken.has(`${base} ${suffix}`)) {
    suffix += 1;
  }
  return `${base} ${suffix}`;
};

export const validateTabName = (
  name: string,
  tabs: DashboardTab[],
  tabId: string
): TabNameError | null => {
  const normalized = normalizeTabName(name);
  if (!normalized) {
    return "empty";
  }
  if (tabs.some((tab) => tab.id !== tabId && tab.name === normalized)) {
    return "duplicate";
  }
  return null;
};

export const moveDashboardTab = (
  tabs: DashboardTab[],
  fromTabId: string,
  toTabId: string
): DashboardTab[] => {
  const fromIndex = tabs.findIndex((tab) => tab.id === fromTabId);
  const toIndex = tabs.findIndex((tab) => tab.id === toTabId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return tabs;
  }
  const result = [...tabs];
  const [movedTab] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, movedTab);
  return result;
};

export const canRemoveDashboardTab = (tab: DashboardTab, tabs: DashboardTab[]): boolean => {
  return !tab.primary && tabs.length > 1;
};

export const createDashboardTab = (name: string): DashboardTab => {
  return {
    id: createTabId(),
    name,
    primary: false,
    nameCustomized: false,
    cards: [],
    layout: [],
  };
};

export const createFirstDashboardTab = (name: string): DashboardTab => {
  const id = createTabId();
  return {
    id,
    name,
    primary: true,
    nameCustomized: false,
    cards: createDefaultTabCards(id),
    layout: [],
  };
};

const normalizeTabs = (
  rawTabs: Partial<DashboardTab>[],
  names: DashboardTabNames
): DashboardTab[] => {
  const tabs: DashboardTab[] = [];
  let hasPrimary = false;

  for (const rawTab of rawTabs) {
    const storedName = typeof rawTab?.name === "string" ? normalizeTabName(rawTab.name) : "";
    const baseName = storedName || (tabs.length === 0 ? names.firstTab : names.newTab);
    const primary = rawTab?.primary === true && !hasPrimary;
    hasPrimary = hasPrimary || primary;
    tabs.push({
      id: typeof rawTab?.id === "string" && rawTab.id ? rawTab.id : createTabId(),
      name: createUniqueTabName(baseName, tabs),
      primary,
      nameCustomized:
        typeof rawTab?.nameCustomized === "boolean"
          ? rawTab.nameCustomized
          : Boolean(storedName) && !names.firstTabAliases.includes(storedName),
      cards: Array.isArray(rawTab?.cards)
        ? rawTab.cards.slice(0, DASHBOARD_MAX_CARDS).map(normalizeCard)
        : [],
      layout: Array.isArray(rawTab?.layout) ? rawTab.layout : [],
    });
  }

  if (!hasPrimary && tabs.length > 0) {
    tabs[0].primary = true;
  }

  return tabs;
};

export const normalizeDashboardStorage = (
  rawValue: string | null,
  names: DashboardTabNames
): DashboardStorageConfig => {
  const createDefaultConfig = (): DashboardStorageConfig => {
    const tab = createFirstDashboardTab(names.firstTab);
    return { tabs: [tab], activeTabId: tab.id };
  };

  if (!rawValue) {
    return createDefaultConfig();
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (Array.isArray(parsed?.tabs) && parsed.tabs.length > 0) {
      const tabs = normalizeTabs(parsed.tabs, names);
      const activeTabId = tabs.some((tab) => tab.id === parsed.activeTabId)
        ? parsed.activeTabId
        : tabs[0].id;
      return { tabs, activeTabId };
    }

    if (Array.isArray(parsed?.cards) && Array.isArray(parsed?.layout)) {
      const tabs = normalizeTabs([{ cards: parsed.cards, layout: parsed.layout }], names);
      return { tabs, activeTabId: tabs[0].id };
    }

    return createDefaultConfig();
  } catch {
    return createDefaultConfig();
  }
};
