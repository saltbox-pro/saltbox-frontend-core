import { hasLegacySchemaBlock, migrateLegacyTemplate } from "./legacy-template";

const buildLegacySls = (schema: Record<string, unknown>) =>
  `{#start_schema\n${JSON.stringify(schema, null, 2)}\nend_schema#}\n\ntest.show:\n  test.show_notification:\n    - text: "hi"\n`;

const legacySchema = {
  description: { ru: "Описание", en: "Description" },
  json_schema: { type: "object", title: "Установка пакета", properties: {} },
  ui_schema: { kwargs: { "ui:label": false } },
  i18n: { ru: { existing: "Есть" }, en: { existing: "Exists" } },
};

const legacySls = buildLegacySls(legacySchema);

describe("legacy template", () => {
  it("детектит блок схемы в SLS", () => {
    expect(hasLegacySchemaBlock(legacySls)).toBe(true);
    expect(hasLegacySchemaBlock("test.ping:\n  test.ping: []\n")).toBe(false);
    expect(hasLegacySchemaBlock("")).toBe(false);
  });

  it("переносит блок в meta и вычищает его из SLS", () => {
    const { meta, slsRaw } = migrateLegacyTemplate({}, legacySls);

    expect(meta.json_schema).toEqual({ type: "object", properties: {} });
    expect(slsRaw.startsWith("test.show:")).toBe(true);
    expect(hasLegacySchemaBlock(slsRaw)).toBe(false);
  });

  it("локализованное описание уезжает в ui:description и i18n", () => {
    const { meta } = migrateLegacyTemplate({}, legacySls);

    expect(meta).not.toHaveProperty("description");
    expect((meta.ui_schema as Record<string, unknown>)["ui:description"]).toBe(
      "{{ui_description}}"
    );
    expect(meta.i18n).toEqual({
      ru: { existing: "Есть", ui_description: "Описание" },
      en: { existing: "Exists", ui_description: "Description" },
    });
  });

  it("заголовок из json_schema уезжает в ui:title", () => {
    const { meta } = migrateLegacyTemplate({}, legacySls);

    // строка одна на все языки — переводы не выдумываем, кладём литералом
    expect((meta.ui_schema as Record<string, unknown>)["ui:title"]).toBe("Установка пакета");
    expect(meta.json_schema).not.toHaveProperty("title");
  });

  it("строковое описание кладётся в ui:description как есть", () => {
    const { meta } = migrateLegacyTemplate(
      {},
      buildLegacySls({ ...legacySchema, description: "Простое описание", i18n: undefined })
    );

    expect((meta.ui_schema as Record<string, unknown>)["ui:description"]).toBe("Простое описание");
    expect(meta.i18n).toBeUndefined();
  });

  it("не трогает подпись, если там уже плейсхолдер", () => {
    const { meta } = migrateLegacyTemplate(
      {},
      buildLegacySls({
        ...legacySchema,
        ui_schema: { "ui:description": "{{custom_key}}" },
      })
    );

    expect((meta.ui_schema as Record<string, unknown>)["ui:description"]).toBe("{{custom_key}}");
    expect(meta.i18n?.ru?.ui_description).toBeUndefined();
    // текст не перенесён — оставляем его на месте, а не выбрасываем вместе с переводами
    expect(meta.description).toEqual({ ru: "Описание", en: "Description" });
  });

  it("локализованное описание вытесняет одноязычный литерал в ui_schema", () => {
    const { meta } = migrateLegacyTemplate(
      {},
      buildLegacySls({
        ...legacySchema,
        ui_schema: { "ui:description": "Single language text" },
      })
    );

    expect((meta.ui_schema as Record<string, unknown>)["ui:description"]).toBe(
      "{{ui_description}}"
    );
    expect(meta.i18n?.ru?.ui_description).toBe("Описание");
    expect(meta.i18n?.en?.ui_description).toBe("Description");
    expect(meta).not.toHaveProperty("description");
  });

  it("сохраняет json_schema.title, если в ui:title другой текст", () => {
    const { meta } = migrateLegacyTemplate(
      {},
      buildLegacySls({ ...legacySchema, ui_schema: { "ui:title": "Своё название" } })
    );

    expect((meta.json_schema as Record<string, unknown>).title).toBe("Установка пакета");
  });

  it("убирает json_schema.title, когда он дублирует ui:title", () => {
    const { meta } = migrateLegacyTemplate(
      {},
      buildLegacySls({ ...legacySchema, ui_schema: { "ui:title": "Установка пакета" } })
    );

    expect(meta.json_schema).not.toHaveProperty("title");
    expect((meta.ui_schema as Record<string, unknown>)["ui:title"]).toBe("Установка пакета");
  });

  it("не перетирает занятый ключ перевода", () => {
    const { meta } = migrateLegacyTemplate(
      {},
      buildLegacySls({
        ...legacySchema,
        i18n: { ru: { ui_description: "Чужой текст" } },
      })
    );

    expect((meta.ui_schema as Record<string, unknown>)["ui:description"]).toBe(
      "{{ui_description_2}}"
    );
    expect(meta.i18n?.ru).toEqual({
      ui_description: "Чужой текст",
      ui_description_2: "Описание",
    });
  });

  it("проставляет state.apply, если функции нигде нет", () => {
    expect(migrateLegacyTemplate({}, legacySls).meta.fun).toBe("state.apply");
  });

  it("не затирает поля, которых не было в старом формате", () => {
    const { meta } = migrateLegacyTemplate(
      {
        fun: "pkg.install",
        query: { "grains.os": "ALT" },
        secret_pillars: ["kwargs.pillar.token"],
      },
      legacySls
    );

    expect(meta.fun).toBe("pkg.install");
    expect(meta.query).toEqual({ "grains.os": "ALT" });
    expect(meta.secret_pillars).toEqual(["kwargs.pillar.token"]);
  });

  it("бросает на невалидном JSON внутри блока", () => {
    expect(() => migrateLegacyTemplate({}, "{#start_schema { нет end_schema#}")).toThrow();
  });
});

describe("legacy template: шаблон управления службой Windows", () => {
  const windowsServiceSls = buildLegacySls({
    description: {
      en: "Starts, stops, or restarts a Windows service.",
      ru: "Запускает, останавливает или перезапускает службу Windows.",
    },
    json_schema: {
      type: "object",
      title: "Windows - Manage Windows service",
      additionalProperties: false,
      required: ["kwargs"],
      properties: {
        kwargs: {
          type: "object",
          additionalProperties: false,
          required: ["pillar"],
          properties: {
            pillar: {
              type: "object",
              additionalProperties: false,
              required: ["service_name", "service_action"],
              properties: {
                service_name: { type: "string", default: "spooler", minLength: 1 },
                service_action: {
                  type: "string",
                  default: "stop",
                  enum: ["start", "stop", "restart"],
                },
              },
            },
          },
        },
      },
    },
    ui_schema: {
      "ui:title": "Windows - Manage Windows service",
      "ui:description": "Start, stop, or restart a Windows service by its system name.",
      kwargs: {
        "ui:label": false,
        pillar: {
          "ui:label": false,
          service_name: {
            "ui:title": "Windows service name",
            "ui:description": "Enter the system service name, for example: spooler.",
            "ui:placeholder": "spooler",
          },
          service_action: {
            "ui:title": "Action",
            "ui:description": "Select the action to perform on the service.",
            "ui:enumNames": ["Start", "Stop", "Restart"],
          },
        },
      },
    },
  });

  it("сохраняет русский перевод описания", () => {
    const { meta } = migrateLegacyTemplate({}, windowsServiceSls);

    expect((meta.ui_schema as Record<string, unknown>)["ui:description"]).toBe(
      "{{ui_description}}"
    );
    expect(meta.i18n?.ru?.ui_description).toBe(
      "Запускает, останавливает или перезапускает службу Windows."
    );
    expect(meta.i18n?.en?.ui_description).toBe("Starts, stops, or restarts a Windows service.");
    expect(meta).not.toHaveProperty("description");
  });

  it("убирает продублированный заголовок и не трогает подписи полей", () => {
    const { meta } = migrateLegacyTemplate({}, windowsServiceSls);
    const uiSchema = meta.ui_schema as Record<string, any>;

    expect(meta.json_schema).not.toHaveProperty("title");
    expect(uiSchema["ui:title"]).toBe("Windows - Manage Windows service");
    expect(uiSchema.kwargs.pillar.service_action["ui:enumNames"]).toEqual([
      "Start",
      "Stop",
      "Restart",
    ]);
  });
});

describe("legacy template: порядок ключей ui_schema", () => {
  it("ставит ui:title первым, ui:description вторым", () => {
    const { meta } = migrateLegacyTemplate({}, legacySls);

    expect(Object.keys(meta.ui_schema as object).slice(0, 2)).toEqual([
      "ui:title",
      "ui:description",
    ]);
  });

  it("сохраняет порядок, когда подписи уже были в ui_schema", () => {
    const { meta } = migrateLegacyTemplate(
      {},
      buildLegacySls({
        ...legacySchema,
        ui_schema: {
          kwargs: { "ui:label": false },
          "ui:description": "Single language text",
          "ui:title": "Установка пакета",
        },
      })
    );

    expect(Object.keys(meta.ui_schema as object)).toEqual(["ui:title", "ui:description", "kwargs"]);
  });

  it("не выдумывает подписи, которых не было", () => {
    const { meta } = migrateLegacyTemplate(
      {},
      buildLegacySls({ json_schema: { type: "object" }, ui_schema: { kwargs: {} } })
    );

    expect(Object.keys(meta.ui_schema as object)).toEqual(["kwargs"]);
  });
});
