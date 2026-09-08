import {
  normalizeSecretPaths,
  readSecretNames,
  syncSecretWidgets,
  writeSecretNames,
} from "./secret-pillars";
import { getEmptyMeta, type TemplateMeta } from "./template-meta";

const metaWithParams = (): TemplateMeta => ({
  ...getEmptyMeta("state.apply"),
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
            properties: { message: { type: "string" }, token: { type: "string" } },
          },
        },
      },
    },
  },
  ui_schema: {
    kwargs: {
      "ui:label": false,
      pillar: { "ui:label": false, message: { "ui:title": "{{message_title}}" } },
    },
  },
});

const paramsUiSchema = (meta: TemplateMeta) =>
  (meta.ui_schema as Record<string, Record<string, Record<string, unknown>>>).kwargs.pillar;

const getProperties = (schema: unknown): Record<string, Record<string, unknown>> =>
  (schema as { properties: Record<string, Record<string, unknown>> }).properties;

/** Свойства поддерева параметров в `json_schema`. */
const paramsJsonSchema = (meta: TemplateMeta) =>
  getProperties(getProperties(getProperties(meta.json_schema).kwargs).pillar);

describe("secret pillars", () => {
  it("читает и короткое имя, и легаси-путь", () => {
    const short: TemplateMeta = { ...metaWithParams(), secret_pillars: ["token"] };
    const legacy: TemplateMeta = { ...metaWithParams(), secret_pillars: ["kwargs.pillar.token"] };

    expect(readSecretNames(short)).toEqual(["token"]);
    expect(readSecretNames(legacy)).toEqual(["token"]);
  });

  it("не считает параметром вложенные и чужие пути", () => {
    const meta: TemplateMeta = {
      ...metaWithParams(),
      secret_pillars: ["kwargs.pillar.token.value", "kwargs.token"],
    };

    expect(readSecretNames(meta)).toEqual([]);
  });

  it("не дублирует имя, записанное в обоих форматах", () => {
    const meta: TemplateMeta = {
      ...metaWithParams(),
      secret_pillars: ["kwargs.pillar.token", "token"],
    };

    expect(readSecretNames(meta)).toEqual(["token"]);
  });

  it("пишет короткое имя и помечает поле паролем", () => {
    const next = writeSecretNames(metaWithParams(), ["token"]);

    expect(next.secret_pillars).toEqual(["token"]);
    expect(paramsUiSchema(next).token).toEqual({ "ui:widget": "password" });
  });

  it("снимает секретность вместе с виджетом", () => {
    const secret = writeSecretNames(metaWithParams(), ["token"]);
    const next = writeSecretNames(secret, []);

    expect(next.secret_pillars).toBeUndefined();
    expect(paramsUiSchema(next).token).toBeUndefined();
  });

  it("сохраняет остальные настройки поля при снятии секретности", () => {
    const meta = metaWithParams();
    const secret = writeSecretNames(meta, ["message"]);

    expect(paramsUiSchema(secret).message).toEqual({
      "ui:title": "{{message_title}}",
      "ui:widget": "password",
    });

    const next = writeSecretNames(secret, []);
    expect(paramsUiSchema(next).message).toEqual({ "ui:title": "{{message_title}}" });
  });

  it("не трогает чужой ui:widget у несекретного поля", () => {
    const meta = metaWithParams();
    (
      meta.ui_schema as Record<string, Record<string, Record<string, unknown>>>
    ).kwargs.pillar.token = { "ui:widget": "textarea" };

    const next = writeSecretNames(meta, []);

    expect(paramsUiSchema(next).token).toEqual({ "ui:widget": "textarea" });
  });

  it("переносит нераспознанные пути без изменений", () => {
    const meta: TemplateMeta = {
      ...metaWithParams(),
      secret_pillars: ["kwargs.pillar.token.value"],
    };

    const next = writeSecretNames(meta, ["message"]);

    expect(next.secret_pillars).toEqual(["kwargs.pillar.token.value", "message"]);
  });

  it("для обычной функции имя параметра пишется так же коротко", () => {
    const meta = getEmptyMeta("test.ping");
    const next = writeSecretNames(meta, ["token"]);

    expect(next.secret_pillars).toEqual(["token"]);
    expect(readSecretNames(next)).toEqual(["token"]);
  });

  it("восстанавливает виджет, если схему перезаписали устаревшей ui-схемой", () => {
    // Так ведёт себя визуальный редактор: сначала сообщает о новом секрете,
    // затем присылает схему, снятую до этого
    const secret = writeSecretNames(metaWithParams(), ["token"]);
    const stale: TemplateMeta = { ...secret, ui_schema: metaWithParams().ui_schema };

    const next = syncSecretWidgets(stale);

    expect(next.secret_pillars).toEqual(["token"]);
    expect(paramsUiSchema(next).token).toEqual({ "ui:widget": "password" });
  });

  it("ничего не меняет, когда секретов нет", () => {
    const meta = metaWithParams();

    expect(syncSecretWidgets(meta).ui_schema).toEqual(meta.ui_schema);
  });

  describe("format в json_schema", () => {
    it("проставляет format секретному параметру", () => {
      const next = writeSecretNames(metaWithParams(), ["token"]);

      expect(paramsJsonSchema(next).token).toEqual({ type: "string", format: "password" });
      expect(paramsJsonSchema(next).message).toEqual({ type: "string" });
    });

    it("снимает format вместе с секретностью", () => {
      const secret = writeSecretNames(metaWithParams(), ["token"]);
      const next = writeSecretNames(secret, []);

      expect(paramsJsonSchema(next).token).toEqual({ type: "string" });
    });

    it("не затирает чужой format у несекретного параметра", () => {
      const meta = metaWithParams();
      paramsJsonSchema(meta).message = { type: "string", format: "email" };

      const next = writeSecretNames(meta, ["token"]);

      expect(paramsJsonSchema(next).message).toEqual({ type: "string", format: "email" });
    });

    it("не ставит format нестроковому параметру", () => {
      const meta = metaWithParams();
      paramsJsonSchema(meta).token = { type: "number" };

      const next = writeSecretNames(meta, ["token"]);

      expect(next.secret_pillars).toEqual(["token"]);
      expect(paramsJsonSchema(next).token).toEqual({ type: "number" });
    });
  });

  describe("нормализация при открытии шаблона", () => {
    it("обрезает путь до имени параметра", () => {
      const meta: TemplateMeta = {
        ...metaWithParams(),
        secret_pillars: ["kwargs.pillar.token", "message"],
      };

      expect(normalizeSecretPaths(meta).secret_pillars).toEqual(["token", "message"]);
    });

    it("не трогает ui-схему", () => {
      const meta: TemplateMeta = {
        ...metaWithParams(),
        secret_pillars: ["kwargs.pillar.token"],
      };

      expect(normalizeSecretPaths(meta).ui_schema).toEqual(meta.ui_schema);
    });

    it("оставляет как есть то, что не разобрали", () => {
      const meta: TemplateMeta = {
        ...metaWithParams(),
        secret_pillars: ["kwargs.pillar.token.value"],
      };

      expect(normalizeSecretPaths(meta).secret_pillars).toEqual(["kwargs.pillar.token.value"]);
    });

    it("схему без секретов возвращает без изменений", () => {
      const meta = metaWithParams();

      expect(normalizeSecretPaths(meta)).toBe(meta);
    });
  });
});
