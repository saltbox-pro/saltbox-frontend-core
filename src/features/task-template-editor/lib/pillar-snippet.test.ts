import { buildPillarSnippet, getPillarDefaultLiteral } from "./pillar-snippet";

describe("pillar snippet", () => {
  it.each([
    ["string", "''"],
    ["number", "0"],
    ["integer", "0"],
    ["boolean", "false"],
    ["array", "[]"],
    ["object", "{}"],
  ])("подставляет пустое значение типа %s", (type, expected) => {
    expect(getPillarDefaultLiteral({ type } as never)).toBe(expected);
  });

  it("для незнакомых и сложных конструкций берёт объект", () => {
    expect(getPillarDefaultLiteral(undefined)).toBe("{}");
    expect(getPillarDefaultLiteral({ anyOf: [] } as never)).toBe("{}");
  });

  it("игнорирует null в списке типов", () => {
    expect(getPillarDefaultLiteral({ type: ["null", "string"] } as never)).toBe("''");
  });

  it("собирает Jinja-фрагмент чтения из pillar", () => {
    expect(buildPillarSnippet("message", { type: "string" } as never)).toBe(
      "{% set message = pillar.get('message', '') %}"
    );
  });
});
