export const DASHBOARD_MAX_CARDS = 10;

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

type LegacyDashboardBlock = {
  title?: string;
  grains?: string;
  view?: "table" | "graph" | string;
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

const DEFAULT_DASHBOARD_CARDS: LegacyDashboardBlock[] = [
  { title: "cpu", grains: "cpu_model", view: "table" },
  { title: "osfullname", grains: "osfullname", view: "table" },
  { title: "boardname", grains: "boardname", view: "table" },
  { title: "kernel", grains: "kernel", view: "table" },
  { title: "saltversion", grains: "saltversion", view: "table" },
  { title: "pythonversion", grains: "pythonversion", view: "table" },
];

const presetOption = (value: DashboardPreset): DashboardPresetOption => ({
  value,
  labelKey: `dashboard.preset-${value}`,
  descriptionKey: `dashboard.preset-${value}-description`,
});

const PRESETS: Record<DashboardFieldType, DashboardPresetOption[]> = {
  categorical: [
    presetOption("treemap"),
    presetOption("horizontal-bar"),
    presetOption("donut"),
    presetOption("vertical-bar"),
    presetOption("lollipop"),
    presetOption("table"),
  ],
  numeric: [
    presetOption("kpi"),
    presetOption("histogram"),
    presetOption("vertical-bar"),
    presetOption("table"),
  ],
  boolean: [
    presetOption("boolean-donut"),
    presetOption("boolean-bars"),
    presetOption("kpi"),
    presetOption("table"),
  ],
  date: [presetOption("histogram"), presetOption("vertical-bar"), presetOption("table")],
  complex: [presetOption("horizontal-bar"), presetOption("table")],
};

const KNOWN_PRESETS = new Set<DashboardPreset>(
  Object.values(PRESETS)
    .flat()
    .map((option) => option.value)
);

const NUMERIC_FIELD_NAMES = new Set(["num_cpus", "mem_total", "swap_total", "pid", "uid", "gid"]);

const BOOLEAN_FIELD_NAMES = new Set(["virtual", "zfs_support", "efi_secure_boot", "selinux"]);

const COMPLEX_FIELD_NAME_PARTS = ["interfaces", "ip_interfaces", "hwaddr_interfaces", "gpus"];

const DATE_FIELD_NAME_PARTS = ["date", "time", "created", "updated", "last_seen", "last_activity"];

const normalizeFieldName = (field: string): string => field.replace(/^grains\./, "");

const createCardId = (field: string, suffix: number): string =>
  `dashboard-card-${field.replace(/[^a-zA-Z0-9_-]/g, "-")}-${suffix}`;

const inferDashboardFieldType = (field: SchemaOption): DashboardFieldType => {
  const source = field.name || field.value || "";
  const normalizedName = normalizeFieldName(source).toLowerCase();
  const metadataType = String(field.datatype || field.inputType || field.type || "").toLowerCase();

  if (["number", "integer", "float", "double"].includes(metadataType)) {
    return "numeric";
  }
  if (["boolean", "bool", "checkbox"].includes(metadataType)) {
    return "boolean";
  }
  if (["date", "datetime", "time"].includes(metadataType)) {
    return "date";
  }
  if (Array.isArray(field.values) && field.values.length > 0) {
    const allBoolean = field.values.every((value) => typeof value === "boolean");
    if (allBoolean) return "boolean";
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

export const getPresetOptionsForFieldType = (fieldType: DashboardFieldType) => PRESETS[fieldType];

const getDefaultPresetForField = (
  fieldType: DashboardFieldType,
  legacyView?: LegacyDashboardBlock["view"]
): DashboardPreset => {
  if (legacyView === "table") return "table";
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
    if (!source) return;

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

const normalizePreset = (preset: string, fieldType: DashboardFieldType): DashboardPreset =>
  KNOWN_PRESETS.has(preset as DashboardPreset)
    ? (preset as DashboardPreset)
    : getDefaultPresetForField(fieldType);

const normalizeCard = (card: DashboardCardConfig): DashboardCardConfig => ({
  id: card.id,
  field: card.field,
  fieldSource: card.fieldSource,
  fieldLabel: card.fieldLabel,
  fieldType: card.fieldType,
  preset: normalizePreset(card.preset, card.fieldType),
});

const migrateDashboardBlocks = (
  legacyBlocks: LegacyDashboardBlock[] = DEFAULT_DASHBOARD_CARDS
): DashboardCardConfig[] =>
  legacyBlocks.slice(0, DASHBOARD_MAX_CARDS).map((block, index) => {
    const field = block.grains || block.title || "cpu_model";
    const fieldType = inferDashboardFieldType({ name: `grains.${field}` });

    return {
      id: createCardId(field, index),
      field,
      fieldSource: `grains.${field}`,
      fieldLabel: block.title || field,
      fieldType,
      preset: getDefaultPresetForField(fieldType, block.view),
    };
  });

export const createDashboardCard = (
  fieldOption: DashboardFieldOption,
  preset: DashboardPreset
): DashboardCardConfig => ({
  id: createCardId(fieldOption.value, Date.now()),
  field: fieldOption.value,
  fieldSource: fieldOption.source,
  fieldLabel: fieldOption.label,
  fieldType: fieldOption.type,
  preset,
});

export const getUpdatedDashboardCard = (
  card: DashboardCardConfig,
  fieldOption: DashboardFieldOption,
  preset: DashboardPreset
): DashboardCardConfig => ({
  ...card,
  field: fieldOption.value,
  fieldSource: fieldOption.source,
  fieldLabel: fieldOption.label,
  fieldType: fieldOption.type,
  preset,
});

export const normalizeDashboardStorage = (rawValue: string | null): DashboardStorageConfig => {
  if (!rawValue) {
    return { version: 2, cards: migrateDashboardBlocks() };
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return { version: 2, cards: migrateDashboardBlocks(parsed) };
    }
    if (parsed?.version === 2 && Array.isArray(parsed.cards)) {
      return { version: 2, cards: parsed.cards.slice(0, DASHBOARD_MAX_CARDS).map(normalizeCard) };
    }
  } catch {
    return { version: 2, cards: migrateDashboardBlocks() };
  }

  return { version: 2, cards: migrateDashboardBlocks() };
};
