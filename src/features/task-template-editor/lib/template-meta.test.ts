import {
  getEmptyMeta,
  isSlsFunction,
  parseMeta,
  stringifyMeta,
  type TemplateMeta,
} from "./template-meta";

describe("template meta", () => {
  it("держит порядок ключей и сохраняет незнакомые поля", () => {
    const meta = {
      secret_pillars: ["kwargs.pillar.token"],
      json_schema: { type: "object" },
      future_backend_field: 42,
      fun: "state.apply",
    } as TemplateMeta;

    expect(Object.keys(JSON.parse(stringifyMeta(meta)))).toEqual([
      "fun",
      "json_schema",
      "secret_pillars",
      "future_backend_field",
    ]);
  });

  it("не пишет undefined в текст схемы", () => {
    expect(stringifyMeta({ fun: "test.ping", query: undefined })).not.toContain("query");
  });

  it("отвергает не-объект", () => {
    expect(() => parseMeta("[]")).toThrow();
    expect(() => parseMeta("null")).toThrow();
    expect(() => parseMeta("{")).toThrow();
  });

  it("знает функции, которым нужен sls", () => {
    expect(isSlsFunction("state.apply")).toBe(true);
    expect(isSlsFunction(" state.apply ")).toBe(true);
    expect(isSlsFunction("pkg.install")).toBe(false);
    expect(isSlsFunction(undefined)).toBe(false);
  });

  it("каркас state.apply кладёт параметры в kwargs.pillar", () => {
    const jsonSchema = getEmptyMeta("state.apply").json_schema as Record<string, any>;

    expect(jsonSchema.properties.kwargs.properties.pillar).toBeDefined();
  });

  it("каркас обычной функции кладёт параметры прямо в kwargs", () => {
    const meta = getEmptyMeta("pkg.install");
    const jsonSchema = meta.json_schema as Record<string, any>;

    expect(meta.fun).toBe("pkg.install");
    expect(jsonSchema.properties.kwargs.properties).toEqual({});
    expect(jsonSchema.properties.kwargs.properties.pillar).toBeUndefined();
  });
});
