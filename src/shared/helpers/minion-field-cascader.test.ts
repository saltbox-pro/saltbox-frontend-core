import {
  buildMinionFieldCascaderOptions,
  flattenMinionFilterSchemaFields,
  getMinionFieldCascaderValue,
  MINION_FIELD_CUSTOM_GRAIN_VALUE,
  MINION_FIELD_EXTRA_DATA_GROUP_KEY,
  MINION_FIELD_GENERAL_GROUP_KEY,
  MINION_FIELD_GRAINS_GROUP_KEY,
  parseExtraDataFilterField,
} from "./minion-field-cascader";

const BASE_GROUP_LABELS = {
  generalGroupLabel: "Общие данные",
  grainsGroupLabel: "Данные grains",
  extraDataGroupLabel: "Расширенные данные",
};

const GROUP_LABELS = { ...BASE_GROUP_LABELS, customGrainLabel: "Произвольный grain" };

describe("parseExtraDataFilterField", () => {
  it("parses extra field path", () => {
    expect(parseExtraDataFilterField("extra.system.hardware.cpu_model")).toEqual({
      source: "system",
      categoryName: "hardware",
      fieldName: "cpu_model",
      fullName: "extra.system.hardware.cpu_model",
    });
  });

  it("keeps dotted field name", () => {
    expect(parseExtraDataFilterField("extra.user.custom.nested.field")).toEqual({
      source: "user",
      categoryName: "custom",
      fieldName: "nested.field",
      fullName: "extra.user.custom.nested.field",
    });
  });

  it("returns null for invalid paths", () => {
    expect(parseExtraDataFilterField("os")).toBeNull();
    expect(parseExtraDataFilterField("extra.system")).toBeNull();
    expect(parseExtraDataFilterField("extra.system.only")).toBeNull();
    expect(parseExtraDataFilterField("extra.foo")).toBeNull();
  });
});

describe("flattenMinionFilterSchemaFields", () => {
  it("flattens nested option groups", () => {
    expect(
      flattenMinionFilterSchemaFields([
        { name: "grains.os", label: "OS" },
        {
          label: "group",
          options: [{ name: "extra.system.hw.cpu", label: "CPU" }],
        },
      ])
    ).toEqual([
      { name: "grains.os", label: "OS" },
      { name: "extra.system.hw.cpu", label: "CPU" },
    ]);
  });

  it("falls back to value when name is missing", () => {
    expect(flattenMinionFilterSchemaFields([{ value: "host", label: "Host" }])).toEqual([
      { name: "host", label: "Host" },
    ]);
  });
});

describe("buildMinionFieldCascaderOptions", () => {
  const fields = [
    { name: "minion_id", label: "Minion ID" },
    { name: "grains.os", label: "OS" },
    { name: "collection", label: "Collection" },
    { name: "grains.host", label: "Host" },
    { name: "last_activity", label: "Last activity" },
    { name: "extra", label: "Extra aggregated data" },
    { name: "extra.system.hardware.cpu", label: 'Extra data field "system.hardware.cpu"' },
    { name: "extra.system.hardware.ram", label: 'Extra data field "system.hardware.ram"' },
    { name: "extra.user.notes.comment", label: 'Extra data field "user.notes.comment"' },
    { name: "extra.orphan.cat.field", label: 'Extra data field "orphan.cat.field"' },
  ];

  const categories = [
    { source: "user", name: "notes", label: "Заметки", icon: "sticky_note_2" },
    { source: "system", name: "hardware", label: "Оборудование", icon: "memory" },
    { source: "system", name: "empty", label: "Пустая", icon: "inbox" },
  ];

  const options = buildMinionFieldCascaderOptions({ fields, categories, ...GROUP_LABELS });

  it("orders root options as collection, general, grains, extra data", () => {
    expect(options.map((option) => option.value)).toEqual([
      "collection",
      MINION_FIELD_GENERAL_GROUP_KEY,
      MINION_FIELD_GRAINS_GROUP_KEY,
      MINION_FIELD_EXTRA_DATA_GROUP_KEY,
    ]);
    expect(options[0]).toEqual({
      value: "collection",
      label: "Collection",
      searchText: "Collection collection",
    });
  });

  it("puts non-grain and non-extra fields into general group", () => {
    expect(options[1]).toEqual({
      value: MINION_FIELD_GENERAL_GROUP_KEY,
      label: "Общие данные",
      searchText: "Общие данные",
      children: [
        { value: "minion_id", label: "Minion ID (minion_id)", searchText: "Minion ID minion_id" },
        {
          value: "last_activity",
          label: "Last activity (last_activity)",
          searchText: "Last activity last_activity",
        },
      ],
    });
  });

  it("puts grains.* fields into grains group with custom grain option", () => {
    expect(options[2]).toEqual({
      value: MINION_FIELD_GRAINS_GROUP_KEY,
      label: "Данные grains",
      searchText: "Данные grains",
      children: [
        { value: "grains.os", label: "OS (grains.os)", searchText: "OS grains.os" },
        { value: "grains.host", label: "Host (grains.host)", searchText: "Host grains.host" },
        {
          value: MINION_FIELD_CUSTOM_GRAIN_VALUE,
          label: "Произвольный grain",
          searchText: "Произвольный grain",
        },
      ],
    });
  });

  it("nests extra data categories and aggregated field last into extra data group", () => {
    const extraGroup = options[3];

    expect(extraGroup?.label).toBe("Расширенные данные");
    expect(extraGroup?.children?.map((child) => child.value)).toEqual([
      "user.notes",
      "system.hardware",
      "orphan.cat",
      "extra",
    ]);
    expect(extraGroup?.children?.at(-1)).toEqual({
      value: "extra",
      label: "Extra aggregated data",
      searchText: "Extra aggregated data extra",
    });
    expect(extraGroup?.children?.[1]).toEqual({
      value: "system.hardware",
      label: "Оборудование",
      icon: "memory",
      searchText: "Оборудование",
      children: [
        {
          value: "extra.system.hardware.cpu",
          label: "cpu",
          searchText:
            'Оборудование cpu Extra data field "system.hardware.cpu" extra.system.hardware.cpu',
        },
        {
          value: "extra.system.hardware.ram",
          label: "ram",
          searchText:
            'Оборудование ram Extra data field "system.hardware.ram" extra.system.hardware.ram',
        },
      ],
    });
  });

  it("skips empty categories and keeps unmatched categories by path name", () => {
    const extraChildren = options[3]?.children ?? [];

    expect(extraChildren.some((option) => option.value === "system.empty")).toBe(false);
    expect(extraChildren.at(-2)).toEqual({
      value: "orphan.cat",
      label: "cat",
      searchText: "cat",
      children: [
        {
          value: "extra.orphan.cat.field",
          label: "field",
          searchText: 'cat field Extra data field "orphan.cat.field" extra.orphan.cat.field',
        },
      ],
    });
  });

  it("omits empty general and extra data groups", () => {
    const grainsOnly = buildMinionFieldCascaderOptions({
      fields: [{ name: "grains.os", label: "OS" }],
      ...GROUP_LABELS,
    });

    expect(grainsOnly.map((option) => option.value)).toEqual([MINION_FIELD_GRAINS_GROUP_KEY]);
  });

  it("omits custom grain option and empty grains group without custom grain label", () => {
    const withGrains = buildMinionFieldCascaderOptions({
      fields: [{ name: "grains.os", label: "OS" }],
      ...BASE_GROUP_LABELS,
    });
    expect(withGrains[0]?.children?.map((child) => child.value)).toEqual(["grains.os"]);

    const withoutGrains = buildMinionFieldCascaderOptions({
      fields: [{ name: "minion_id", label: "Minion ID" }],
      ...BASE_GROUP_LABELS,
    });
    expect(withoutGrains.map((option) => option.value)).toEqual([MINION_FIELD_GENERAL_GROUP_KEY]);
  });

  it("builds single group for duplicated categories", () => {
    const hardware = { source: "system", name: "hardware", label: "Оборудование" };
    const withDuplicates = buildMinionFieldCascaderOptions({
      fields: [
        { name: "extra.system.hardware.cpu", label: "CPU" },
        { name: "extra.system.hardware.ram", label: "RAM" },
      ],
      categories: [hardware, hardware],
      ...GROUP_LABELS,
    });

    expect(withDuplicates.at(-1)?.children?.map((child) => child.value)).toEqual([
      "system.hardware",
    ]);
  });

  it("keeps leftover short extra paths inside extra data group", () => {
    const withShortExtra = buildMinionFieldCascaderOptions({
      fields: [{ name: "extra.foo", label: "Short extra" }],
      ...GROUP_LABELS,
    });

    expect(withShortExtra.at(-1)?.children).toEqual([
      { value: "extra.foo", label: "Short extra", searchText: "Short extra extra.foo" },
    ]);
  });
});

describe("getMinionFieldCascaderValue", () => {
  const options = buildMinionFieldCascaderOptions({
    fields: [
      { name: "collection", label: "Collection" },
      { name: "minion_id", label: "Minion ID" },
      { name: "grains.os", label: "OS" },
      { name: "extra", label: "Extra aggregated data" },
      { name: "extra.system.hardware.cpu", label: "CPU" },
    ],
    categories: [{ source: "system", name: "hardware", label: "Оборудование", icon: "memory" }],
    ...GROUP_LABELS,
  });

  it("returns path for root collection field", () => {
    expect(getMinionFieldCascaderValue("collection", options)).toEqual(["collection"]);
  });

  it("returns path for general and grain fields", () => {
    expect(getMinionFieldCascaderValue("minion_id", options)).toEqual([
      MINION_FIELD_GENERAL_GROUP_KEY,
      "minion_id",
    ]);
    expect(getMinionFieldCascaderValue("grains.os", options)).toEqual([
      MINION_FIELD_GRAINS_GROUP_KEY,
      "grains.os",
    ]);
  });

  it("returns path for extra data fields", () => {
    expect(getMinionFieldCascaderValue("extra", options)).toEqual([
      MINION_FIELD_EXTRA_DATA_GROUP_KEY,
      "extra",
    ]);
    expect(getMinionFieldCascaderValue("extra.system.hardware.cpu", options)).toEqual([
      MINION_FIELD_EXTRA_DATA_GROUP_KEY,
      "system.hardware",
      "extra.system.hardware.cpu",
    ]);
  });

  it("returns undefined for unknown field", () => {
    expect(getMinionFieldCascaderValue("missing.field", options)).toBeUndefined();
  });

  it("returns custom grain path", () => {
    expect(getMinionFieldCascaderValue("grains.foo", options, true)).toEqual([
      MINION_FIELD_GRAINS_GROUP_KEY,
      MINION_FIELD_CUSTOM_GRAIN_VALUE,
    ]);
  });
});
