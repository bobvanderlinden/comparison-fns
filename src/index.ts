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

function isNonNullable<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

/**
 * Consideres all values equal, thus this does not change the order.
 * @example
 * ```js
 * [1, 2, 3].sort(compareEqual) // [1, 2, 3]
 * ```
 */
function compareEqual<T>(a: T, b: T): CompareResult {
  return 0;
}

/**
 * Order values that pass a condition before anything else.
 * @example
 * The following will order NaN values first, followed by the remaining values sorted in ascending order.
 * NaN values are considered equal to eachother, so `compareEqual` is used for them.
 *
 * ```js
 * [3, 1, NaN, 2].sort(conditionFirstComparer(isNaN, compareEqual, compareNumber)) // [NaN, 1, 2, 3]
 * ```
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
 * This operates equal to `conditionFirstComparer`, but with a type guard instead of a condition.
 * Optionally trueComparer can be provided that is applied to any value that passes the type guard.
 * Optionally falseComparer can be provided that is applied to any value that does not pass the type guard.
 * @example
 * The following will order non-null values first, followed by null values.
 * When one of the compared values is a string, it is ordered higher than null.
 * When both compared values are strings, they are ordered using `compareString`.
 * When both compared values are not strings (thus null), they are compared using `compareEqual`.
 *
 * ```js
 * const comparer: Comparer<string | null> = conditionTypeFirstComparer(
 *   (value: string | null): value is string => value !== null,
 *   compareString, // This is of type Comparer<string>
 *   compareEqual
 * );
 * ["a", null, "b"].sort(comparer); // ["a", "b", null]
 * ```
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
 * @example
 * This will order a single value first. The rest will remain in their original order.
 *
 * ```js
 * [3, 5, 2, 1, 4].sort(constFirstComparer(3)); // [3, 1, 2, 5, 4]
 * ```
 */
export function constFirstComparer<TConstant, TResult extends TConstant>(
  value: TConstant
): Comparer<TResult> {
  return conditionFirstComparer((item) => item === value);
}

/**
 * Order null and undefined values first and use comparer for other cases.
 * null and undefined are considered equal to eachother.
 * @example
 * The following will order null and undefined values first, the remaining items are ordered using `compareNumber`.
 * Note that the null and undefined values remain in their original order.
 *
 * ```js
 * [3, undefined, null, 2, undefined, 1].sort(nullableFirstComparer(compareNumber)); // [undefined, null, undefined, 1, 2, 3]
 * ```
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
 * Order null and undefined values last and use comparer for other cases.
 * null and undefined are considered equal to eachother.
 * @example
 * The following will order null and undefined values last, the remaining items are ordered using `compareNumber`.
 * Note that the null and undefined values remain in their original order.
 *
 * ```js
 * [3, undefined, null, 2, undefined, 1].sort(nullableLastComparer(compareNumber)); // [3, 2, 1, undefined, null, undefined]
 * ```
 */
export function nullableLastComparer<T>(
  comparer: Comparer<T>
): Comparer<T | null | undefined> {
  return conditionTypeFirstComparer<T | null | undefined, T>(
    isNonNullable,
    comparer,
    compareEqual
  );
}

/**
 * Order null and undefined values before anything else.
 * null and undefined are considered equal to eachother.
 * Other values remain in their original order.
 * @example
 * The following will order null and undefined values first.
 *
 * ```js
 * [3, undefined, null, 2, undefined, 1].sort(compareNullableFirst); // [undefined, null, undefined, 3, 2, 1]
 * ```
 */
export const compareNullableFirst = nullableFirstComparer(compareEqual);

/**
 * Order NaN values before anything else.
 * Other values remain in their original order.
 * @example
 *
 * ```js
 * [3, 1, NaN, 2].sort(compareNanFirst); // [NaN, 3, 1, 2]
 * ```
 */
export const compareNanFirst = conditionFirstComparer(isNaN);

/**
 * Order infinity values before anything else.
 * Other values remain in their original order.
 * @example
 *
 * ```js
 * [3, 1, Infinity, 2].sort(comparePositiveInfinityFirst); // [Infinity, 3, 1, 2]
 * ```
 */
export const comparePositiveInfinityFirst = constFirstComparer(Infinity);

/**
 * Order negative infinity values before anything else.
 * Other values remain in their original order.
 * @example
 *
 * ```js
 * [3, 1, -Infinity, 2].sort(compareNegativeInfinityFirst); // [-Infinity, 3, 1, 2]
 * ```
 */
export const compareNegativeInfinityFirst = constFirstComparer(-Infinity);

/**
 * Compare finite numbers. NaN, infinity, and negative infinity are considered equal.
 * @example
 *
 * ```js
 * [3, 1, NaN, 2].sort(compareFiniteNumber); // [1, 2, 3, NaN]
 * ```
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
 *
 * @example
 *
 * ```js
 * [3, Infinity, 1, NaN, 2, -Infinity].sort(compareNumber); // [NaN, -Infinity, 1, 2, 3, Infinity]
 * ```
 */
export const compareNumber = chainComparers(
  compareNanFirst,
  compareNegativeInfinityFirst,
  invertComparer(comparePositiveInfinityFirst),
  compareFiniteNumber
);

/**
 * Order strings using the current locale.
 * @example
 *
 * ```js
 * ["a", "b", "c"].sort(compareString); // ["a", "b", "c"]
 * ```
 */
export function compareString(a: string, b: string): CompareResult {
  return sign(a.localeCompare(b));
}

/**
 * Order strings using a specific locale.
 * @deprecated Use `collatorComparer` instead.
 * @example
 *
 * ```js
 * ['Z', 'a', 'z', 'ä'].sort(localeComparer("de")); // ["a", "ä", "z", "Z"]
 * ['Z', 'a', 'z', 'ä'].sort(localeComparer("sv")); // ["a", "z", "Z", "ä"]
 * ```
 */
export function localeComparer(locale: string): Comparer<string> {
  return (a, b) => sign(a.localeCompare(b, locale));
}

/**
 * Order strings using a specific collator to control language-specific comparison rules.
 * @example
 *
 * ```js
 * const collator = new Intl.Collator('de', { caseFirst: 'upper' });
 * ['z', 'a', 'Z', 'ä'].sort(collatorComparer(collator)); // ["a", "ä", "Z", "z"]
 * ```
 */
export function collatorComparer(collator: Intl.Collator): Comparer<string> {
  return (a, b) => sign(collator.compare(a, b));
}

/**
 * Order older dates before newer dates.
 * @example
 *
 * ```js
 * [new Date(2024, 2, 1), new Date(2024, 1, 1)].sort(compareDate); // [new Date(2024, 1, 1), new Date(2024, 2, 1)]
 * ```
 */
export const compareDate: Comparer<Date> = mapComparer(
  compareFiniteNumber,
  (date) => date.getTime()
);

/**
 * Compare booleans. True is ordered before false.
 * @example
 *
 * ```js
 * [false, true, false].sort(compareBoolean); // [true, false, false]
 * ```
 */
export function compareBoolean(a: boolean, b: boolean): CompareResult {
  return a === b ? 0 : a ? 1 : -1;
}

/**
 * Invert the order of a comparer.
 * @example
 *
 * ```js
 * [1, 2, 3].sort(invertComparer(compareNumber)); // [3, 2, 1]
 * ```
 */
export function invertComparer<T>(comparer: Comparer<T>): Comparer<T> {
  return (a, b) => comparer(b, a);
}

/**
 * Combine multiple comparers into a single comparer.
 * Comparers are iterated through until a comparer indicates the values are non-equal.
 * If all comparers return values are equal, the items are considered equal.
 * @example
 *
 * ```js
 * [{
 *   name: "a",
 *   country: "US"
 * }, {
 *   name: "c",
 *   country: "DE"
 * }, {
 *   name: "b",
 *   country: "DE"
 * }].sort(
 *   chainComparers(
 *     mapComparer(compareString, (item) => item.country),
 *     mapComparer(compareString, (item) => item.name),
 *   )
 * );
 * // [{name: "b", country: "DE"}, {name: "c", country: "DE"}, {name: "a", country: "US"}]
 * ```
 */
export function chainComparers<T>(
  ...comparers: readonly Comparer<T>[]
): Comparer<T> {
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
 * @example
 *
 * ```js
 * const preferredOrder = ["high", "medium", "low"];
 * ["low", "high", "medium", "high"].sort(orderComparer(preferredOrder)); // ["high", "high", "medium", "low"]
 * ```
 */
export function orderComparer<T>(ordering: readonly T[]): Comparer<T> {
  // Create a reverse lookup table for quickly finding the index of an item.
  const lookup = new Map(ordering.map((item, index) => [item, index]));
  function indexOf(item: T) {
    return lookup.has(item) ? lookup.get(item)! : ordering.length;
  }
  return (a, b) => sign(indexOf(a) - indexOf(b));
}

/**
 * Calls mapper for both values to be compared, calls comparer on the resulting values.
 * @example
 *
 * ```js
 * [{ name: "Bob" }, { name: "Charlie" }, { name: "Alice" }].sort(
 *   mapComparer(compareString, (item) => item.name)
 * );
 * // [{ name: "Alice" }, { name: "Bob" }, { name: "Charlie" }]
 * ```
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
 *
 * @example
 *
 * ```js
 * [1, 2, 3, 4, 5, 6].sort(
 *   groupComparer({
 *     even: compareNumber,
 *     odd: invertComparer(compareNumber),
 *   }, (value) => (value % 2 ? "odd" : "even"))
 * );
 * // [2, 4, 6, 5, 3, 1]
 * ```
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
 * @example
 * We can interpret versions as arrays of numbers to sort them.
 *
 * ```js
 * const versions = ["1.2.3", "1.2", "1.2.1", "1"];
 * const compare = mapCompare(
 *   arrayComparer(compareNumber),
 *   version => version.split('.').map(parseInt)
 * );
 * versions.sort(compare);
 * // => ["1", "1.2", "1.2.1", "1.2.3"]
 * ```
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
 * @example
 *
 * ```js
 * ["b", 1, "a", 3].sort(compareNumberOrString); // [1, 3, "a", "b"]
 * ```
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
 * const strings = ["b1", "a1", "a10", "a2", "a20"];
 * strings.sort(compareStringNatural);
 * // => ["a1", "a2", "a10", "a20", "b1"]
 * ```
 */
export const compareStringNatural = mapComparer(
  arrayComparer(compareNumberOrString),
  (value: string) =>
    [...value.matchAll(/([0-9]+)|([^0-9]+)/g)].map((match) =>
      match[1] ? parseInt(match[1], 10) : match[2]
    )
);
