import {
  buildMinionFilterFieldCascaderOptions,
  flattenMinionFilterSchemaFields,
  getMinionFilterFieldCascaderValue,
  MINION_FILTER_CUSTOM_GRAIN_VALUE,
  MINION_FILTER_GRAINS_GROUP_KEY,
  parseExtraDataFilterField,
} from "./minion-filter-field-cascader";

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
        { name: "os", label: "OS" },
        {
          label: "group",
          options: [{ name: "extra.system.hw.cpu", label: "CPU" }],
        },
      ])
    ).toEqual([
      { name: "os", label: "OS" },
      { name: "extra.system.hw.cpu", label: "CPU" },
    ]);
  });

  it("falls back to value when name is missing", () => {
    expect(flattenMinionFilterSchemaFields([{ value: "host", label: "Host" }])).toEqual([
      { name: "host", label: "Host" },
    ]);
  });
});

describe("buildMinionFilterFieldCascaderOptions", () => {
  const fields = [
    { name: "os", label: "OS" },
    { name: "host", label: "Host" },
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

  it("puts grains group first with custom grain option", () => {
    const options = buildMinionFilterFieldCascaderOptions({
      fields,
      categories,
      grainsGroupLabel: "Grains",
      customGrainLabel: "Custom grain",
    });

    expect(options[0]).toEqual({
      value: MINION_FILTER_GRAINS_GROUP_KEY,
      label: "Grains",
      searchText: "Grains",
      children: [
        { value: "os", label: "OS (os)", searchText: "OS os" },
        { value: "host", label: "Host (host)", searchText: "Host host" },
        {
          value: MINION_FILTER_CUSTOM_GRAIN_VALUE,
          label: "Custom grain",
          searchText: "Custom grain",
        },
      ],
    });
  });

  it("uses localized category labels and field names for extra leaves", () => {
    const options = buildMinionFilterFieldCascaderOptions({
      fields,
      categories,
      grainsGroupLabel: "Grains",
      customGrainLabel: "Custom grain",
    });

    expect(options.slice(1, 3)).toEqual([
      {
        value: "user.notes",
        label: "Заметки",
        icon: "sticky_note_2",
        searchText: "Заметки",
        children: [
          {
            value: "extra.user.notes.comment",
            label: "comment",
            searchText:
              'Заметки comment Extra data field "user.notes.comment" extra.user.notes.comment',
          },
        ],
      },
      {
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
      },
    ]);
  });

  it("skips empty categories and keeps unmatched groups by path name", () => {
    const options = buildMinionFilterFieldCascaderOptions({
      fields,
      categories,
      grainsGroupLabel: "Данные grains",
      customGrainLabel: "Произвольный grain",
    });

    expect(options.some((option) => option.value === "system.empty")).toBe(false);
    expect(options.at(-1)).toEqual({
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

  it("keeps aggregated top-level extra field from schema", () => {
    const options = buildMinionFilterFieldCascaderOptions({
      fields: [
        { name: "os", label: "OS" },
        { name: "extra", label: "Расширенные данные (агрегированные)" },
        { name: "extra.system.hardware.cpu", label: "CPU" },
      ],
      categories: [{ source: "system", name: "hardware", label: "Оборудование" }],
      grainsGroupLabel: "Данные grains",
      customGrainLabel: "Произвольный grain",
    });

    expect(options.at(-1)).toEqual({
      value: "extra",
      label: "Расширенные данные (агрегированные)",
      searchText: "Расширенные данные (агрегированные) extra",
    });
  });

  it("keeps leftover short extra paths as root leaves", () => {
    const options = buildMinionFilterFieldCascaderOptions({
      fields: [
        { name: "os", label: "OS" },
        { name: "extra.foo", label: "Short extra" },
      ],
      grainsGroupLabel: "Grains",
      customGrainLabel: "Custom grain",
    });

    expect(options.at(-1)).toEqual({
      value: "extra.foo",
      label: "Short extra",
      searchText: "Short extra extra.foo",
    });
  });

  it("keeps grain named custom distinct from custom-grain sentinel", () => {
    const options = buildMinionFilterFieldCascaderOptions({
      fields: [{ name: "custom", label: "Custom grain field" }],
      grainsGroupLabel: "Grains",
      customGrainLabel: "Произвольный grain",
    });

    expect(MINION_FILTER_CUSTOM_GRAIN_VALUE).not.toBe("custom");
    expect(options[0]?.children).toEqual([
      {
        value: "custom",
        label: "Custom grain field (custom)",
        searchText: "Custom grain field custom",
      },
      {
        value: MINION_FILTER_CUSTOM_GRAIN_VALUE,
        label: "Произвольный grain",
        searchText: "Произвольный grain",
      },
    ]);
  });
});

describe("getMinionFilterFieldCascaderValue", () => {
  const options = buildMinionFilterFieldCascaderOptions({
    fields: [
      { name: "os", label: "OS" },
      { name: "extra.system.hardware.cpu", label: "CPU" },
    ],
    categories: [{ source: "system", name: "hardware", label: "Оборудование", icon: "memory" }],
    grainsGroupLabel: "Grains",
    customGrainLabel: "Custom grain",
  });

  it("returns path for known field", () => {
    expect(getMinionFilterFieldCascaderValue("os", options, false)).toEqual([
      MINION_FILTER_GRAINS_GROUP_KEY,
      "os",
    ]);
    expect(getMinionFilterFieldCascaderValue("extra.system.hardware.cpu", options, false)).toEqual([
      "system.hardware",
      "extra.system.hardware.cpu",
    ]);
  });

  it("returns undefined for unknown field", () => {
    expect(getMinionFilterFieldCascaderValue("missing.field", options, false)).toBeUndefined();
  });

  it("returns custom grain path", () => {
    expect(getMinionFilterFieldCascaderValue("grains.foo", options, true)).toEqual([
      MINION_FILTER_GRAINS_GROUP_KEY,
      MINION_FILTER_CUSTOM_GRAIN_VALUE,
    ]);
  });

  it("returns path for root-level leftover extra field", () => {
    const withAggregatedExtra = buildMinionFilterFieldCascaderOptions({
      fields: [
        { name: "os", label: "OS" },
        { name: "extra", label: "Extra aggregated data" },
      ],
      grainsGroupLabel: "Grains",
      customGrainLabel: "Custom grain",
    });

    expect(getMinionFilterFieldCascaderValue("extra", withAggregatedExtra, false)).toEqual([
      "extra",
    ]);
  });
});
