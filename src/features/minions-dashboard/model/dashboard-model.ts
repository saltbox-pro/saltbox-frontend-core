import { DASHBOARD_MAX_CARDS, DEFAULT_DASHBOARD_CARDS } from "../constants/dashboard-cards";
import {
  BOOLEAN_FIELD_NAMES,
  BOOLEAN_METADATA_TYPES,
  COMPLEX_FIELD_NAME_PARTS,
  DATE_FIELD_NAME_PARTS,
  DATE_METADATA_TYPES,
  NUMERIC_FIELD_NAMES,
  NUMERIC_METADATA_TYPES,
} from "../constants/dashboard-field-types";
import { PRESETS } from "../constants/dashboard-presets";
import { DASHBOARD_STORAGE_VERSION } from "../constants/dashboard-storage";

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

export type DashboardStorageConfig = {
  version: 2;
  cards: DashboardCardConfig[];
};

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

  return result;
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

export const normalizeDashboardStorage = (rawValue: string | null): DashboardStorageConfig => {
  if (!rawValue) {
    return { version: DASHBOARD_STORAGE_VERSION, cards: DEFAULT_DASHBOARD_CARDS };
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (parsed?.version === DASHBOARD_STORAGE_VERSION && Array.isArray(parsed.cards)) {
      return {
        version: DASHBOARD_STORAGE_VERSION,
        cards: parsed.cards.slice(0, DASHBOARD_MAX_CARDS).map(normalizeCard),
      };
    }
  } catch {
    return { version: DASHBOARD_STORAGE_VERSION, cards: DEFAULT_DASHBOARD_CARDS };
  }

  return { version: DASHBOARD_STORAGE_VERSION, cards: DEFAULT_DASHBOARD_CARDS };
};
