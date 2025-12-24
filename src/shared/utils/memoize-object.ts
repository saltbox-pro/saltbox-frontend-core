/**
 * Creates a memoization function that returns the same object reference
 * if all fields are shallowly equal to the previous call.
 * Useful for passing objects as props.
 *
 * Usage:
 *   const memoize = createObjectMemoizer();
 *   const obj1 = memoize({ a: 1, b: 2 });
 *   const obj2 = memoize({ a: 1, b: 2 });
 *   obj1 === obj2 // true
 */
export function createObjectMemoizer() {
  let previous: object | undefined;

  return function <T extends object = object>(obj: T): T {
    if (previous === undefined) {
      previous = obj;
      return obj;
    }

    if (shallowEqual(previous, obj)) {
      return previous as T;
    }

    previous = obj;
    return obj;
  };
}

/**
 * For the cases of predefined types
 */
export function createTypedObjectMemoizer<T extends object>() {
  return createObjectMemoizer() as (obj: T) => T;
}

/**
 * Shallow equality check for objects
 */
function shallowEqual<T extends object>(a: T, b: T): boolean {
  if (a === b) return true;

  const keysA = Object.keys(a) as (keyof T)[];
  const keysB = Object.keys(b) as (keyof T)[];

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }

  return true;
}
