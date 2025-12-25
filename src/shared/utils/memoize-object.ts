import isDeepEqual from "lodash-es/isEqual";

/**
 * Creates a memoization function that returns the same object reference
 * if all fields are equal to the previous call.
 *
 * @param options.deep - If true, uses deep equality (lodash isEqual).
 *                       If false (default), uses shallow equality.
 *
 * Usage:
 *   // Shallow equality (default)
 *   const memoize = createObjectMemoizer();
 *   const obj1 = memoize({ a: 1, b: 2 });
 *   const obj2 = memoize({ a: 1, b: 2 });
 *   obj1 === obj2 // true
 *
 *   // Deep equality
 *   const memoizeDeep = createObjectMemoizer({ deep: true });
 *   const arr1 = memoizeDeep([{ a: 1 }, { b: 2 }]);
 *   const arr2 = memoizeDeep([{ a: 1 }, { b: 2 }]);
 *   arr1 === arr2 // true
 */
export function createObjectMemoizer({ deep = false }: { deep?: boolean } = {}) {
  const isEqual = deep ? isDeepEqual : isShallowEqual;

  let previous: object | undefined;

  return function <T extends object = object>(obj: T): T {
    if (previous === undefined) {
      previous = obj;
      return obj;
    }

    if (isEqual(previous, obj)) {
      return previous as T;
    }

    previous = obj;
    return obj;
  };
}

/**
 * Shallow equality check for objects
 */
function isShallowEqual<T extends object>(a: T, b: T): boolean {
  if (a === b) return true;

  const keysA = Object.keys(a) as (keyof T)[];
  const keysB = Object.keys(b) as (keyof T)[];

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }

  return true;
}
