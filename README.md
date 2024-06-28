# comparison-fns

Composable comparison functions for use in sorting.

## Installation

```console
$ npm install comparison-fns
```

## Usage

```js
import { compareString } from "comparison-fns";

["b", "c", "a"].sort(compareString);
// => ["a", "b", "c"]
```

```js
import { compareString, nullableFirstComparer } from "comparison-fns";

["b", null, "c", "a", undefined].sort(nullableFirstComparer(compareString));
// => [null, undefined, "a", "b", "c"]
```

```js
import { compareString, mapComparer } from "comparison-fns";

[{ name: "John" }, { name: "Hank" }].sort(
  mapComparer((person) => person.name, compareString)
);
// => [{ name: "Hank" }, { name: "John" }]
```

```js
import { orderComparer } from "comparison-fns";

const weekdayComparer = orderComparer(["mon", "tue", "wed", "thu", "fri"]);
["fri", "tue", "wed"].sort(weekdayComparer);
// => ["tue", "wed", "fri"]
```

```js
import { compareNumber, arrayComparer } from "comparison-fns";

const comparer = arrayComparer(compareNumber);
[[1, 2], [2, 3], [2, 2, 1][(2, 2)]].sort(comparer);
// => [[1, 2], [2, 2], [2, 2, 1] [2, 3]]
```

```js
import { chainComparer, mapComparer, compareString } from "comparison-fns";

const personComparer = chainComparer([
  mapComparer((person) => person.city, compareString),
  mapComparer((person) => person.name, compareString),
]);
[
  { name: "bob", city: "berlin" },
  { name: "hank", city: "amsterdam" },
  { name: "alice", city: "amsterdam" },
].sort(personComparer);
// => [
//  { name: "alice", city: "amsterdam" },
//  { name: "hank", city: "amsterdam" },
//  { name: "bob", city: "berlin" },
// ]
```
