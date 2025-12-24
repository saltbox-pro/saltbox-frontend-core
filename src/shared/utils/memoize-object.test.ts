import { createTypedObjectMemoizer } from "./memoize-object";

describe("createObjectMemoizer", () => {
  it("returns the same reference for identical objects", () => {
    const memoize = createTypedObjectMemoizer<{ a: number; b: string }>();

    const obj1 = memoize({ a: 1, b: "hello" });
    const obj2 = memoize({ a: 1, b: "hello" });

    expect(obj1).toBe(obj2);
  });

  it("returns a new reference when values change", () => {
    const memoize = createTypedObjectMemoizer<{ a: number; b: string }>();

    const obj1 = memoize({ a: 1, b: "hello" });
    const obj2 = memoize({ a: 2, b: "hello" });

    expect(obj1).not.toBe(obj2);
    expect(obj2).toEqual({ a: 2, b: "hello" });
  });

  it("returns a new reference when a key is added", () => {
    const memoize = createTypedObjectMemoizer<{ a: number; b?: string }>();

    const obj1 = memoize({ a: 1 });
    const obj2 = memoize({ a: 1, b: "hello" });

    expect(obj1).not.toBe(obj2);
  });

  it("returns a new reference when a key is removed", () => {
    const memoize = createTypedObjectMemoizer<{ a: number; b?: string }>();

    const obj1 = memoize({ a: 1, b: "hello" });
    const obj2 = memoize({ a: 1 });

    expect(obj1).not.toBe(obj2);
  });

  it("uses shallow equality for nested objects", () => {
    const nested = { x: 1 };
    const memoize = createTypedObjectMemoizer<{ a: number; nested: typeof nested }>();

    const obj1 = memoize({ a: 1, nested });
    const obj2 = memoize({ a: 1, nested });

    // Same reference to nested object, should be equal
    expect(obj1).toBe(obj2);
  });

  it("returns new reference for different nested object references", () => {
    const memoize = createTypedObjectMemoizer<{ a: number; nested: { x: number } }>();

    const obj1 = memoize({ a: 1, nested: { x: 1 } });
    const obj2 = memoize({ a: 1, nested: { x: 1 } });

    // Different nested object references, should not be equal
    expect(obj1).not.toBe(obj2);
  });

  it("handles empty objects", () => {
    const memoize = createTypedObjectMemoizer<Record<string, never>>();

    const obj1 = memoize({});
    const obj2 = memoize({});

    expect(obj1).toBe(obj2);
  });

  it("handles objects with arrays using reference equality", () => {
    const arr = [1, 2, 3];
    const memoize = createTypedObjectMemoizer<{ items: number[] }>();

    const obj1 = memoize({ items: arr });
    const obj2 = memoize({ items: arr });

    expect(obj1).toBe(obj2);
  });

  it("returns new reference for different array references", () => {
    const memoize = createTypedObjectMemoizer<{ items: number[] }>();

    const obj1 = memoize({ items: [1, 2, 3] });
    const obj2 = memoize({ items: [1, 2, 3] });

    expect(obj1).not.toBe(obj2);
  });

  it("returns first object on first call", () => {
    const memoize = createTypedObjectMemoizer<{ a: number }>();
    const input = { a: 1 };

    const result = memoize(input);

    expect(result).toBe(input);
  });

  it("each memoizer instance is independent", () => {
    const memoize1 = createTypedObjectMemoizer<{ a: number }>();
    const memoize2 = createTypedObjectMemoizer<{ a: number }>();

    const obj1 = memoize1({ a: 1 });
    const obj2 = memoize2({ a: 1 });

    // Different memoizer instances, different references
    expect(obj1).not.toBe(obj2);
  });

  it("handles null and undefined values in fields", () => {
    const memoize = createTypedObjectMemoizer<{ a: null; b: undefined }>();

    const obj1 = memoize({ a: null, b: undefined });
    const obj2 = memoize({ a: null, b: undefined });

    expect(obj1).toBe(obj2);
  });

  it("distinguishes between null and undefined", () => {
    const memoize = createTypedObjectMemoizer<{ a: null | undefined }>();

    const obj1 = memoize({ a: null });
    const obj2 = memoize({ a: undefined });

    expect(obj1).not.toBe(obj2);
  });

  it("handles boolean fields", () => {
    const memoize = createTypedObjectMemoizer<{ flag: boolean }>();

    const obj1 = memoize({ flag: true });
    const obj2 = memoize({ flag: true });
    const obj3 = memoize({ flag: false });

    expect(obj1).toBe(obj2);
    expect(obj2).not.toBe(obj3);
  });

  it("handles function references", () => {
    const fn = () => {};
    const memoize = createTypedObjectMemoizer<{ callback: () => void }>();

    const obj1 = memoize({ callback: fn });
    const obj2 = memoize({ callback: fn });

    expect(obj1).toBe(obj2);
  });

  it("returns new reference for different function references", () => {
    const memoize = createTypedObjectMemoizer<{ callback: () => void }>();

    const obj1 = memoize({ callback: () => {} });
    const obj2 = memoize({ callback: () => {} });

    expect(obj1).not.toBe(obj2);
  });

  it("returns the same reference when passing the previous result", () => {
    const memoize = createTypedObjectMemoizer<{ a: number; b: string }>();

    const obj1 = memoize({ a: 1, b: "hello" });
    const obj2 = memoize(obj1);

    expect(obj1).toBe(obj2);
  });
});
