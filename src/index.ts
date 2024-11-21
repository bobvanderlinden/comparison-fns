export type CompareResult = -1 | 0 | 1;

/**
 * A function that compares two values.
 * @returns
 * 0 if the values are ordered the same
 * -1 if a should be ordered before b.
 * 1 if a should be ordered after b
 */
export type Comparer<T> = (a: T, b: T) => CompareResult;

type Key = string | number | symbol;

function sign(value: number): CompareResult {
  return value > 0 ? 1 : value < 0 ? -1 : 0;
}

function isNullable<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

/**
 * Consideres all values equal, thus this does not change the order.
 */
function compareEqual<T>(a: T, b: T): CompareResult {
  return 0;
}

/**
 * Order values that pass a condition before anything else.
 */
export function conditionFirstComparer<T>(
  condition: (value: T) => boolean,
  trueComparer: Comparer<T> = compareEqual,
  falseComparer: Comparer<T> = compareEqual
) {
  return (a: T, b: T) => {
    const aIsCondition = condition(a);
    const bIsCondition = condition(b);
    return aIsCondition && bIsCondition
      ? trueComparer(a, b)
      : aIsCondition
      ? -1
      : bIsCondition
      ? 1
      : falseComparer(a, b);
  };
}

/**
 * Order values that pass a type guard before anything else.
 * Optionally trueComparer can be provided that is applied to any value that passes the type guard.
 * Optionally falseComparer can be provided that is applied to any value that does not pass the type guard.
 */
export function conditionTypeFirstComparer<TIn, TOut extends TIn = TIn>(
  condition: (value: TIn) => value is TOut,
  trueComparer: Comparer<TOut> = () => 0,
  falseComparer: Comparer<Exclude<TIn, TOut>> = () => 0
): Comparer<TIn> {
  return (a, b) => {
    const aIsCondition = condition(a);
    const bIsCondition = condition(b);
    return aIsCondition && bIsCondition
      ? trueComparer(a, b)
      : aIsCondition
      ? -1
      : bIsCondition
      ? 1
      : falseComparer(a as any, b as any);
  };
}

/**
 * Order a specific constant value before anything else.
 */
export function constFirstComparer<TConstant, TResult extends TConstant>(
  value: TConstant
): Comparer<TResult> {
  return conditionFirstComparer((item) => item === value);
}

/**
 * Order null and undefined values first and use comparer for other cases.
 * null and undefined are considered equal to eachother.
 */
export function nullableFirstComparer<T>(
  comparer: Comparer<T>
): Comparer<T | null | undefined> {
  return conditionTypeFirstComparer<T | null | undefined>(
    isNullable,
    compareEqual,
    comparer
  );
}

/**
 * Order null and undefined values before anything else.
 * null and undefined are considered equal to eachother.
 */
export const compareNullableFirst = nullableFirstComparer(compareEqual);

/**
 * Order NaN values before anything else.
 */
export const compareNanFirst = conditionFirstComparer(isNaN);

/**
 * Order infinity values before anything else.
 */
export const comparePositiveInfinityFirst = constFirstComparer(Infinity);

/**
 * Order negative infinity values before anything else.
 */
export const compareNegativeInfinityFirst = constFirstComparer(-Infinity);

/**
 * Compare finite numbers. NaN, infinity, and negative infinity are considered equal.
 */
export function compareFiniteNumber(a: number, b: number) {
  return isFinite(a) && isFinite(b) ? sign(a - b) : 0;
}

/**
 * Compare numbers from low to high. The order of numbers from low to high:
 * - NaN
 * - Negative infinity
 * - Finite numbers
 * - Positive infinity
 */
export const compareNumber = chainComparers(
  compareNanFirst,
  compareNegativeInfinityFirst,
  invertComparer(comparePositiveInfinityFirst),
  compareFiniteNumber
);

/**
 * Order strings using the current locale.
 */
export function compareString(a: string, b: string): CompareResult {
  return sign(a.localeCompare(b));
}

/**
 * Order strings using a specific locale.
 */
export function localeComparer(locale: string): Comparer<string> {
  return (a, b) => sign(a.localeCompare(b, locale));
}

/**
 * Order older dates before newer dates.
 */
export const compareDate: Comparer<Date> = mapComparer(
  compareFiniteNumber,
  (date) => date.getTime()
);

/**
 * Compare booleans. True is ordered before false.
 */
export function compareBoolean(a: boolean, b: boolean): CompareResult {
  return a === b ? 0 : a ? 1 : -1;
}

/**
 * Invert the order of a comparer.
 */
export function invertComparer<T>(comparer: Comparer<T>): Comparer<T> {
  return (a, b) => comparer(b, a);
}

/**
 * Combine multiple comparers into a single comparer.
 * Comparers are iterated through until a comparer indicates the values are non-equal.
 * If all comparers return values are equal, the items are considered equal.
 */
export function chainComparers<T>(...comparers: Comparer<T>[]): Comparer<T> {
  return (a, b) => {
    for (const comparer of comparers) {
      const result = comparer(a, b);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  };
}

/**
 * Compare strings based on a predefined order.
 */
export function orderComparer<T extends Key>(ordering: T[]): Comparer<T> {
  // Create a reverse lookup table for quickly finding the index of an item.
  const lookup = new Map(ordering.map((item, index) => [item, index]));
  function indexOf(item: T) {
    return lookup.has(item) ? lookup.get(item)! : ordering.length;
  }
  return (a, b) => sign(indexOf(a) - indexOf(b));
}

/**
 * Calls mapper for both values to be compared, calls comparer on the resulting values.
 */
export function mapComparer<TIn, TOut>(
  comparer: Comparer<TOut>,
  mapper: (item: TIn) => TOut
): Comparer<TIn> {
  return (a, b) => comparer(mapper(a), mapper(b));
}

/**
 * Compares values based on groups.
 * Allows doing comparisons specific for each group, while
 * not affecting comparison outside said group.
 *
 * First groups values based on keyFn.
 * Then compares values based on key from keyFn.
 * Then compares using comparison function in compareFns[key].
 */
export function groupComparer<TKey extends Key, TValue>(
  compareFns: Record<TKey, Comparer<TValue>>,
  keyFn: (value: TValue) => TKey,
  keyCompareFn: Comparer<TKey>
): Comparer<TValue> {
  return (a: any, b: any) => {
    const keyA = keyFn(a);
    const keyB = keyFn(b);
    return keyCompareFn(keyA, keyB) || (compareFns[keyA](a, b) ?? 0);
  };
}

/**
 * Compares arrays using a comparer for its individual items.
 * When the first differing item is found, the comparison result is returned.
 * When the items in the overlapping part are equal, the shorter array is ordered before longer ones.
 * @param itemComparer The comparer to use for individual items.
 */
export function arrayComparer<T>(itemComparer: Comparer<T>): Comparer<T[]> {
  return (a, b) => {
    for (let index = 0; index < Math.min(a.length, b.length); index++) {
      const result = itemComparer(a[index], b[index]);
      if (result !== 0) {
        return result;
      }
    }
    return compareNumber(a.length, b.length);
  };
}

/**
 * Order numbers as well as strings using compareNumber and compareString.
 * Numbers are ordered before strings.
 */
export const compareNumberOrString = conditionTypeFirstComparer<
  number | string,
  number
>(isNumber, compareNumber, compareString);

/**
 * Compare strings using a natural order.
 * Numbers inside the string are compared as numbers.
 * Other parts are compared as strings.
 * @example
 * ```js
 * const strings = ["a1", "a10", "a2", "a20"];
 * strings.sort(compareStringNatural);
 * // => ["a1", "a2", "a10", "a20"]
 * ```
 */
export const compareStringNatural = mapComparer(
  arrayComparer(compareNumberOrString),
  (value: string) =>
    [...value.matchAll(/([0-9]+)|([^0-9]+)/g)].map((match) =>
      match[1] ? parseInt(match[1], 10) : match[2]
    )
);
