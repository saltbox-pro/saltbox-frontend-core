export const MINION_FILTER_GRAINS_GROUP_KEY = "grains";
export const MINION_FILTER_CUSTOM_GRAIN_VALUE = "__custom_grain__";

const EXTRA_DATA_FIELD_PREFIX = "extra.";

export type MinionFilterFieldCascaderOption = {
  value: string;
  label: string;
  icon?: string | null;
  searchText?: string;
  children?: MinionFilterFieldCascaderOption[];
};

type MinionFilterSchemaField = {
  name: string;
  label: string;
};

type MinionFilterCascaderCategory = {
  source: string;
  name: string;
  label: string;
  icon?: string | null;
};

type ParsedExtraField = {
  source: string;
  categoryName: string;
  fieldName: string;
  fullName: string;
  label: string;
};

type BuildMinionFilterFieldCascaderOptionsParams = {
  fields: ReadonlyArray<MinionFilterSchemaField>;
  categories?: ReadonlyArray<MinionFilterCascaderCategory>;
  grainsGroupLabel: string;
  customGrainLabel: string;
};

function isExtraDataField(name: string): boolean {
  return name === "extra" || name.startsWith(EXTRA_DATA_FIELD_PREFIX);
}

export function parseExtraDataFilterField(name: string): Omit<ParsedExtraField, "label"> | null {
  if (!name.startsWith(EXTRA_DATA_FIELD_PREFIX)) {
    return null;
  }

  const parts = name.slice(EXTRA_DATA_FIELD_PREFIX.length).split(".");
  if (parts.length < 3) {
    return null;
  }

  const [source, categoryName, ...fieldParts] = parts;
  const fieldName = fieldParts.join(".");
  if (!source || !categoryName || !fieldName) {
    return null;
  }

  return { source, categoryName, fieldName, fullName: name };
}

export function flattenMinionFilterSchemaFields(
  options: ReadonlyArray<unknown> | undefined
): MinionFilterSchemaField[] {
  const result: MinionFilterSchemaField[] = [];

  const visit = (option: unknown) => {
    if (!option || typeof option !== "object") {
      return;
    }

    const typed = option as {
      options?: unknown[];
      name?: unknown;
      value?: unknown;
      label?: unknown;
    };

    if (Array.isArray(typed.options)) {
      typed.options.forEach(visit);
      return;
    }

    const name =
      typeof typed.name === "string"
        ? typed.name
        : typeof typed.value === "string"
          ? typed.value
          : "";
    if (!name) {
      return;
    }

    result.push({
      name,
      label: typeof typed.label === "string" && typed.label ? typed.label : name,
    });
  };

  (options ?? []).forEach(visit);
  return result;
}

function getCategoryGroupKey(source: string, categoryName: string): string {
  return `${source}.${categoryName}`;
}

function formatFieldLabel(label: string, name: string): string {
  return `${label} (${name})`;
}

function toExtraLeafOption(
  field: ParsedExtraField,
  categoryLabel?: string
): MinionFilterFieldCascaderOption {
  return {
    value: field.fullName,
    label: field.fieldName,
    searchText: [categoryLabel, field.fieldName, field.label, field.fullName]
      .filter(Boolean)
      .join(" "),
  };
}

export function buildMinionFilterFieldCascaderOptions({
  fields,
  categories = [],
  grainsGroupLabel,
  customGrainLabel,
}: BuildMinionFilterFieldCascaderOptionsParams): MinionFilterFieldCascaderOption[] {
  const grainFields = fields.filter((field) => !isExtraDataField(field.name));
  const parsedExtraFields = fields.flatMap((field) => {
    const parsed = parseExtraDataFilterField(field.name);
    if (!parsed) {
      return [];
    }
    return [{ ...parsed, label: field.label }];
  });
  const parsedExtraNames = new Set(parsedExtraFields.map((field) => field.fullName));

  const leftoverExtraFields = fields.filter(
    (field) => isExtraDataField(field.name) && !parsedExtraNames.has(field.name)
  );

  const fieldsByCategory = new Map<string, ParsedExtraField[]>();
  for (const field of parsedExtraFields) {
    const groupKey = getCategoryGroupKey(field.source, field.categoryName);
    const groupFields = fieldsByCategory.get(groupKey) ?? [];
    groupFields.push(field);
    fieldsByCategory.set(groupKey, groupFields);
  }

  const grainsGroup: MinionFilterFieldCascaderOption = {
    value: MINION_FILTER_GRAINS_GROUP_KEY,
    label: grainsGroupLabel,
    searchText: grainsGroupLabel,
    children: [
      ...grainFields.map((field) => ({
        value: field.name,
        label: formatFieldLabel(field.label, field.name),
        searchText: `${field.label} ${field.name}`,
      })),
      {
        value: MINION_FILTER_CUSTOM_GRAIN_VALUE,
        label: customGrainLabel,
        searchText: customGrainLabel,
      },
    ],
  };

  const categoryGroups: MinionFilterFieldCascaderOption[] = [];
  const usedGroupKeys = new Set<string>();

  for (const category of categories) {
    const groupKey = getCategoryGroupKey(category.source, category.name);
    const groupFields = fieldsByCategory.get(groupKey);
    if (!groupFields?.length) {
      continue;
    }

    usedGroupKeys.add(groupKey);
    categoryGroups.push({
      value: groupKey,
      label: category.label,
      icon: category.icon,
      searchText: category.label,
      children: groupFields.map((field) => toExtraLeafOption(field, category.label)),
    });
  }

  for (const [groupKey, groupFields] of fieldsByCategory) {
    if (usedGroupKeys.has(groupKey) || !groupFields.length) {
      continue;
    }

    const [{ categoryName }] = groupFields;
    categoryGroups.push({
      value: groupKey,
      label: categoryName,
      searchText: categoryName,
      children: groupFields.map((field) => toExtraLeafOption(field, categoryName)),
    });
  }

  const leftoverExtraOptions: MinionFilterFieldCascaderOption[] = leftoverExtraFields.map(
    (field) => ({
      value: field.name,
      label: field.label,
      searchText: `${field.label} ${field.name}`,
    })
  );

  return [grainsGroup, ...categoryGroups, ...leftoverExtraOptions];
}

export function getMinionFilterFieldCascaderValue(
  fieldName: string | undefined,
  options: ReadonlyArray<MinionFilterFieldCascaderOption>,
  isCustomGrain: boolean
): string[] | undefined {
  if (isCustomGrain) {
    return [MINION_FILTER_GRAINS_GROUP_KEY, MINION_FILTER_CUSTOM_GRAIN_VALUE];
  }

  if (!fieldName) {
    return undefined;
  }

  const rootLeaf = options.find((option) => option.value === fieldName && !option.children?.length);
  if (rootLeaf) {
    return [fieldName];
  }

  const group = options.find((option) =>
    option.children?.some((child) => child.value === fieldName)
  );
  if (!group) {
    return undefined;
  }

  return [group.value, fieldName];
}
