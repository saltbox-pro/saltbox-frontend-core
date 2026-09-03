import { extractParamsFormSchema, hasParams, wrapParamsFormSchema } from "./params-subtree";
import { getEmptyMeta, type TemplateMeta } from "./template-meta";

const stateApplyMeta = (): TemplateMeta => ({
  fun: "state.apply",
  json_schema: {
    type: "object",
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
            properties: { test: { type: "integer", default: 1 } },
          },
        },
      },
    },
  },
  ui_schema: {
    "ui:title": "{{ui_title}}",
    "ui:description": "{{ui_description}}",
    kwargs: {
      "ui:label": false,
      pillar: { "ui:label": false, test: { "ui:title": "{{test_title}}" } },
    },
  },
});

describe("params subtree", () => {
  it("отдаёт поддерево pillar для state.apply", () => {
    const { json_schema, ui_schema } = extractParamsFormSchema(stateApplyMeta());

    expect(Object.keys((json_schema as { properties: object }).properties)).toEqual(["test"]);
    expect(ui_schema.test).toEqual({ "ui:title": "{{test_title}}" });
  });

  it("не тащит подписи шаблона в поддерево: они правятся в шапке редактора", () => {
    const { ui_schema } = extractParamsFormSchema(stateApplyMeta());

    expect(ui_schema["ui:title"]).toBeUndefined();
    expect(ui_schema["ui:description"]).toBeUndefined();
    // настройки самой обёртки pillar при этом на месте
    expect(ui_schema["ui:label"]).toBe(false);
  });

  it("extract → wrap не меняет схему", () => {
    const meta = stateApplyMeta();
    const wrapped = wrapParamsFormSchema(meta, meta.fun, extractParamsFormSchema(meta));

    expect(wrapped.json_schema).toEqual(meta.json_schema);
    expect(wrapped.ui_schema).toEqual(meta.ui_schema);
  });

  it("подписи из поддерева не всплывают в корень ui_schema", () => {
    const meta = stateApplyMeta();
    const edited = extractParamsFormSchema(meta);

    const wrapped = wrapParamsFormSchema(meta, meta.fun, {
      ...edited,
      ui_schema: { ...edited.ui_schema, "ui:title": "Подпись группы параметров" },
    });

    const uiSchema = wrapped.ui_schema as Record<string, any>;
    expect(uiSchema["ui:title"]).toBe("{{ui_title}}");
    expect(uiSchema.kwargs.pillar["ui:title"]).toBe("Подпись группы параметров");
  });

  it("для обычной функции параметры лежат прямо в kwargs", () => {
    const meta: TemplateMeta = {
      fun: "pkg.install",
      json_schema: {
        type: "object",
        properties: {
          kwargs: { type: "object", properties: { name: { type: "string" } } },
        },
      },
      ui_schema: {},
    };

    const { json_schema } = extractParamsFormSchema(meta);

    expect(Object.keys((json_schema as { properties: object }).properties)).toEqual(["name"]);
  });

  it("достраивает обёртки kwargs.pillar, если их нет", () => {
    const wrapped = wrapParamsFormSchema({ fun: "state.apply" }, "state.apply", {
      json_schema: { type: "object", properties: { token: { type: "string" } } },
      ui_schema: {},
    });

    const jsonSchema = wrapped.json_schema as Record<string, any>;
    expect(jsonSchema.required).toEqual(["kwargs"]);
    expect(jsonSchema.properties.kwargs.required).toEqual(["pillar"]);
    expect(jsonSchema.properties.kwargs.properties.pillar.properties.token).toEqual({
      type: "string",
    });
  });

  it("удалённые поля не оставляют настроек в ui_schema", () => {
    const meta = stateApplyMeta();

    const wrapped = wrapParamsFormSchema(meta, meta.fun, {
      json_schema: { type: "object", properties: {} },
      ui_schema: { "ui:label": false },
    });

    const uiSchema = wrapped.ui_schema as Record<string, any>;
    expect(uiSchema.kwargs.pillar).toEqual({ "ui:label": false });
  });

  it("пустой каркас не считается заполненной схемой", () => {
    expect(hasParams(getEmptyMeta("state.apply"), "state.apply")).toBe(false);
    expect(hasParams(stateApplyMeta(), "state.apply")).toBe(true);
  });
});
