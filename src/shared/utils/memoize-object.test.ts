import { createObjectMemoizer } from "./memoize-object";

describe("createObjectMemoizer (shallow)", () => {
  it("returns the same reference for identical objects", () => {
    const memoize = createObjectMemoizer();

    const obj1 = memoize({ a: 1, b: "hello" });
    const obj2 = memoize({ a: 1, b: "hello" });

    expect(obj1).toBe(obj2);
  });

  it("returns a new reference when values change", () => {
    const memoize = createObjectMemoizer();

    const obj1 = memoize({ a: 1, b: "hello" });
    const obj2 = memoize({ a: 2, b: "hello" });

    expect(obj1).not.toBe(obj2);
    expect(obj2).toEqual({ a: 2, b: "hello" });
  });

  it("returns a new reference when a key is added", () => {
    const memoize = createObjectMemoizer();

    const obj1 = memoize({ a: 1 });
    const obj2 = memoize({ a: 1, b: "hello" });

    expect(obj1).not.toBe(obj2);
  });

  it("returns a new reference when a key is removed", () => {
    const memoize = createObjectMemoizer();

    const obj1 = memoize({ a: 1, b: "hello" });
    const obj2 = memoize({ a: 1 });

    expect(obj1).not.toBe(obj2);
  });

  it("uses shallow equality for nested objects", () => {
    const nested = { x: 1 };
    const memoize = createObjectMemoizer();

    const obj1 = memoize({ a: 1, nested });
    const obj2 = memoize({ a: 1, nested });

    // Same reference to nested object, should be equal
    expect(obj1).toBe(obj2);
  });

  it("returns new reference for different nested object references", () => {
    const memoize = createObjectMemoizer();

    const obj1 = memoize({ a: 1, nested: { x: 1 } });
    const obj2 = memoize({ a: 1, nested: { x: 1 } });

    // Different nested object references, should not be equal
    expect(obj1).not.toBe(obj2);
  });

  it("handles empty objects", () => {
    const memoize = createObjectMemoizer();

    const obj1 = memoize({});
    const obj2 = memoize({});

    expect(obj1).toBe(obj2);
  });

  it("handles objects with arrays using reference equality", () => {
    const arr = [1, 2, 3];
    const memoize = createObjectMemoizer();

    const obj1 = memoize({ items: arr });
    const obj2 = memoize({ items: arr });

    expect(obj1).toBe(obj2);
  });

  it("returns new reference for different array references", () => {
    const memoize = createObjectMemoizer();

    const obj1 = memoize({ items: [1, 2, 3] });
    const obj2 = memoize({ items: [1, 2, 3] });

    expect(obj1).not.toBe(obj2);
  });

  it("returns first object on first call", () => {
    const memoize = createObjectMemoizer();
    const input = { a: 1 };

    const result = memoize(input);

    expect(result).toBe(input);
  });

  it("each memoizer instance is independent", () => {
    const memoize1 = createObjectMemoizer();
    const memoize2 = createObjectMemoizer();

    const obj1 = memoize1({ a: 1 });
    const obj2 = memoize2({ a: 1 });

    // Different memoizer instances, different references
    expect(obj1).not.toBe(obj2);
  });

  it("handles null and undefined values in fields", () => {
    const memoize = createObjectMemoizer();

    const obj1 = memoize({ a: null, b: undefined });
    const obj2 = memoize({ a: null, b: undefined });

    expect(obj1).toBe(obj2);
  });

  it("distinguishes between null and undefined", () => {
    const memoize = createObjectMemoizer();

    const obj1 = memoize({ a: null });
    const obj2 = memoize({ a: undefined });

    expect(obj1).not.toBe(obj2);
  });

  it("handles boolean fields", () => {
    const memoize = createObjectMemoizer();

    const obj1 = memoize({ flag: true });
    const obj2 = memoize({ flag: true });
    const obj3 = memoize({ flag: false });

    expect(obj1).toBe(obj2);
    expect(obj2).not.toBe(obj3);
  });

  it("handles function references", () => {
    const fn = () => {};
    const memoize = createObjectMemoizer();

    const obj1 = memoize({ callback: fn });
    const obj2 = memoize({ callback: fn });

    expect(obj1).toBe(obj2);
  });

  it("returns new reference for different function references", () => {
    const memoize = createObjectMemoizer();

    const obj1 = memoize({ callback: () => {} });
    const obj2 = memoize({ callback: () => {} });

    expect(obj1).not.toBe(obj2);
  });

  it("returns the same reference when passing the previous result", () => {
    const memoize = createObjectMemoizer();

    const obj1 = memoize({ a: 1, b: "hello" });
    const obj2 = memoize(obj1);

    expect(obj1).toBe(obj2);
  });
});

describe("createObjectMemoizer (deep)", () => {
  it("returns the same reference for identical nested objects", () => {
    const memoize = createObjectMemoizer({ deep: true });

    const obj1 = memoize({ a: 1, nested: { x: 1 } });
    const obj2 = memoize({ a: 1, nested: { x: 1 } });

    expect(obj1).toBe(obj2);
  });

  it("returns the same reference for arrays with identical objects", () => {
    const memoize = createObjectMemoizer({ deep: true });

    const arr1 = memoize([{ a: 1 }, { b: 2 }]);
    const arr2 = memoize([{ a: 1 }, { b: 2 }]);

    expect(arr1).toBe(arr2);
  });

  it("handles rules-like pattern (array of rule objects)", () => {
    const memoize = createObjectMemoizer({ deep: true });

    const rules1 = memoize([{ required: true, message: "Field is required" }]);
    const rules2 = memoize([{ required: true, message: "Field is required" }]);

    expect(rules1).toBe(rules2);
  });

  it("returns new reference when nested value changes", () => {
    const memoize = createObjectMemoizer({ deep: true });

    const obj1 = memoize({ a: 1, nested: { x: 1 } });
    const obj2 = memoize({ a: 1, nested: { x: 2 } });

    expect(obj1).not.toBe(obj2);
  });

  it("returns new reference when sibling changes", () => {
    const memoize = createObjectMemoizer({ deep: true });

    const obj1 = memoize({ a: { x: 1 }, b: { y: 2 } });
    const obj2 = memoize({ a: { x: 1 }, b: { y: 3 } });

    expect(obj1).not.toBe(obj2);
  });

  it("returns new reference when array item changes", () => {
    const memoize = createObjectMemoizer({ deep: true });

    const arr1 = memoize([{ a: 1 }, { b: 2 }, { c: 3 }]);
    const arr2 = memoize([{ a: 1 }, { b: 99 }, { c: 3 }]);

    expect(arr1).not.toBe(arr2);
  });

  it("handles deeply nested structures", () => {
    const memoize = createObjectMemoizer({ deep: true });

    const obj1 = memoize({ level1: { level2: { level3: { value: 1 } } } });
    const obj2 = memoize({ level1: { level2: { level3: { value: 1 } } } });

    expect(obj1).toBe(obj2);
  });

  it("handles empty arrays", () => {
    const memoize = createObjectMemoizer({ deep: true });

    const arr1 = memoize([]);
    const arr2 = memoize([]);

    expect(arr1).toBe(arr2);
  });

  it("handles empty objects", () => {
    const memoize = createObjectMemoizer({ deep: true });

    const obj1 = memoize({});
    const obj2 = memoize({});

    expect(obj1).toBe(obj2);
  });

  it("handles arrays with different lengths", () => {
    const memoize = createObjectMemoizer({ deep: true });

    const arr1 = memoize([{ a: 1 }, { b: 2 }]);
    const arr2 = memoize([{ a: 1 }]);

    expect(arr1).not.toBe(arr2);
  });

  it("handles mixed primitive and object values", () => {
    const memoize = createObjectMemoizer({ deep: true });

    const obj1 = memoize({ num: 1, str: "hello", nested: { x: 1 } });
    const obj2 = memoize({ num: 1, str: "hello", nested: { x: 1 } });

    expect(obj1).toBe(obj2);
  });

  it("handles null values in nested structures", () => {
    const memoize = createObjectMemoizer({ deep: true });

    const obj1 = memoize({ a: null, b: { x: null } });
    const obj2 = memoize({ a: null, b: { x: null } });

    expect(obj1).toBe(obj2);
  });

  it("each memoizer instance is independent", () => {
    const memoize1 = createObjectMemoizer({ deep: true });
    const memoize2 = createObjectMemoizer({ deep: true });

    const obj1 = memoize1([{ a: 1 }]);
    const obj2 = memoize2([{ a: 1 }]);

    expect(obj1).not.toBe(obj2);
  });
});
