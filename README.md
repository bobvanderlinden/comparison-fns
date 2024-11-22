# comparison-fns

Composable comparison functions for use in sorting.

## Installation

```console
$ npm install comparison-fns
```

## Usage

```ts
import {
  compareString,
  mapComparer,
  orderComparer,
  chainComparers,
} from "comparison-fns";

// Basic alphabetical sorting.
["b", "c", "a"].sort(compareString);
//=> ["a", "b", "c"]

// Sorting people by name.
[{ name: "Bob" }, { name: "Charlie" }, { name: "Alice" }].sort(
  mapComparer(compareString, (person) => name)
);
//=> [{ name: "Alice" }, { name: "Bob" }, { name: "Charlie" }]

// Sorting priority with pre-defined ordering.
["medium", "high", "low"].sort(orderComparer(["high", "medium", "low"]));
//=> ["high", "medium", "low"]

// Sorting by category and title.
const compareGenre = orderComparer(["horror", "fantasy", "mystery"]);
const compareBook = chainComparers(
  mapComparer(compareGenre, (book) => book.genre),
  mapComparer(compareString, (book) => book.title)
);
[
  { title: "Frankenstein", genre: "horror" },
  { title: "Dune", genre: "fantasy" },
  { title: "Dracula", genre: "horror" },
].sort(compareBook);
//=> [
//     { title: "Dracula", genre: "horror" },
//     { title: "Frankenstein", genre: "horror" },
//     { title: "Dune", genre: "fantasy" }
//   ]
```

### compareEqual

Considers all values equal, thus this does not change the order.

```js
[1, 2, 3].sort(compareEqual); // [1, 2, 3]
```

### conditionFirstComparer

Order values that pass a condition before anything else.

```js
// The following will order NaN values first, followed by the remaining values sorted in ascending order.
// NaN values are considered equal to eachother, so `compareEqual` is used for them.
[3, 1, NaN, 2].sort(conditionFirstComparer(isNaN, compareEqual, compareNumber)); // [NaN, 1, 2, 3]
```

### conditionTypeFirstComparer

Order values that pass a type guard before anything else.

```js
const comparer: Comparer<string | null> = conditionTypeFirstComparer(
  (value: string | null): value is string => value !== null,
  compareString, // This is of type Comparer<string>
  compareEqual
);
["a", null, "b"].sort(comparer); // ["a", "b", null]
```

### constFirstComparer

Order a specific constant value before anything else.

```js
[3, 5, 2, 1, 4].sort(constFirstComparer(3)); // [3, 1, 2, 5, 4]
```

### nullableFirstComparer

Order null and undefined values first and use comparer for other cases.

```js
[3, undefined, null, 2, undefined, 1].sort(
  nullableFirstComparer(compareNumber)
); // [undefined, null, undefined, 1, 2, 3]
```

### nullableLastComparer

Order null and undefined values last and use comparer for other cases.

```js
[3, undefined, null, 2, undefined, 1].sort(nullableLastComparer(compareNumber)); // [3, 2, 1, undefined, null, undefined]
```

### compareNullableFirst

Order null and undefined values before anything else.

```js
[3, undefined, null, 2, undefined, 1].sort(compareNullableFirst); // [undefined, null, undefined, 3, 2, 1]
```

### compareNanFirst

Order NaN values before anything else.

```js
[3, 1, NaN, 2].sort(compareNanFirst); // [NaN, 3, 1, 2]
```

### comparePositiveInfinityFirst

Order infinity values before anything else.

```js
[3, 1, Infinity, 2].sort(comparePositiveInfinityFirst); // [Infinity, 3, 1, 2]
```

### compareNegativeInfinityFirst

Order negative infinity values before anything else.

```js
[3, 1, -Infinity, 2].sort(compareNegativeInfinityFirst); // [-Infinity, 3, 1, 2]
```

### compareFiniteNumber

Compare finite numbers. NaN, infinity, and negative infinity are considered equal.

```js
[3, 1, NaN, 2].sort(compareFiniteNumber); // [1, 2, 3, NaN]
```

### compareNumber

Compare numbers from low to high.

```js
[3, Infinity, 1, NaN, 2, -Infinity].sort(compareNumber); // [NaN, -Infinity, 1, 2, 3, Infinity]
```

### compareString

Order strings using the current locale.

```js
["a", "b", "c"].sort(compareString); // ["a", "b", "c"]
```

### collatorComparer

Order strings using a specific collator to control language-specific comparison rules.

```js
const collator = new Intl.Collator("de", { caseFirst: "upper" });
["z", "a", "Z", "ä"].sort(collatorComparer(collator)); // ["a", "ä", "Z", "z"]
```

### compareDate

Order older dates before newer dates.

```js
[new Date(2024, 2, 1), new Date(2024, 1, 1)].sort(compareDate); // [new Date(2024, 1, 1), new Date(2024, 2, 1)]
```

### compareBoolean

Compare booleans. True is ordered before false.

```js
[false, true, false].sort(compareBoolean); // [true, false, false]
```

### invertComparer

Invert the order of a comparer.

```js
[1, 2, 3].sort(invertComparer(compareNumber)); // [3, 2, 1]
```

### chainComparers

Combine multiple comparers into a single comparer.

```js
[
  {
    name: "a",
    country: "US",
  },
  {
    name: "c",
    country: "DE",
  },
  {
    name: "b",
    country: "DE",
  },
].sort(
  chainComparers(
    mapComparer(compareString, (item) => item.country),
    mapComparer(compareString, (item) => item.name)
  )
);
// [{name: "b", country: "DE"}, {name: "c", country: "DE"}, {name: "a", country: "US"}]
```

### orderComparer

Compare strings based on a predefined order.

```js
const preferredOrder = ["high", "medium", "low"];
["low", "high", "medium", "high"].sort(orderComparer(preferredOrder)); // ["high", "high", "medium", "low"]
```

### mapComparer

Calls mapper for both values to be compared, calls comparer on the resulting values.

```js
[{ name: "Bob" }, { name: "Charlie" }, { name: "Alice" }].sort(
  mapComparer(compareString, (item) => item.name)
);
// [{ name: "Alice" }, { name: "Bob" }, { name: "Charlie" }]
```

### groupComparer

Compares values based on groups.

```js
[1, 2, 3, 4, 5, 6].sort(
  groupComparer(
    {
      even: compareNumber,
      odd: invertComparer(compareNumber),
    },
    (value) => (value % 2 ? "odd" : "even")
  )
);
// [2, 4, 6, 5, 3, 1]
```

### arrayComparer

Compares arrays using a comparer for its individual items.

```js
const versions = ["1.2.3", "1.2", "1.2.1", "1"];
const compare = mapCompare(arrayComparer(compareNumber), (version) =>
  version.split(".").map(parseInt)
);
versions.sort(compare);
// => ["1", "1.2", "1.2.1", "1.2.3"]
```

### compareNumberOrString

Order numbers as well as strings using compareNumber and compareString.

```js
["b", 1, "a", 3].sort(compareNumberOrString); // [1, 3, "a", "b"]
```

### compareStringNatural

Compare strings using a natural order.

```js
const strings = ["b1", "a1", "a10", "a2", "a20"];
strings.sort(compareStringNatural);
// => ["a1", "a2", "a10", "a20", "b1"]
```
