import { describe, expect, it } from "vitest";
import {
  Comparer,
  arrayComparer,
  compareBoolean,
  compareDate,
  compareNumber,
  compareString,
  compareStringNatural,
  conditionFirstComparer,
  conditionTypeFirstComparer,
  groupComparer,
  mapComparer,
  nullableFirstComparer,
  orderComparer,
} from "./index";

function rotatePermutations<T>(items: T[]): T[][] {
  const result = [];
  for (let i = 0; i < items.length; i++) {
    result.push(items.slice(i).concat(items.slice(0, i)));
  }
  return result;
}

describe("compareNumber", () => {
  const orderedNumbers = [NaN, -Infinity, -10, -2, -1, 0, 1, 2, 10, Infinity];
  it.each(rotatePermutations(orderedNumbers).map((numbers) => [numbers]))(
    "should sort correctly %",
    (unorderedNumbers) => {
      expect(unorderedNumbers.toSorted(compareNumber)).toStrictEqual(
        orderedNumbers
      );
    }
  );
});

describe("compareString", () => {
  const orderedStrings = ["-1", "1", "a", "b", "c", "d"];
  it.each(rotatePermutations(orderedStrings).map((strings) => [strings]))(
    "should sort correctly %",
    (unorderedStrings) => {
      expect(unorderedStrings.toSorted(compareString)).toStrictEqual(
        orderedStrings
      );
    }
  );
});

describe("compareBoolean", () => {
  it.each([
    [true, true, 0],
    [false, true, -1],
    [true, false, 1],
    [false, false, 0],
  ])("compareBoolean(%p, %p) -> %p", (a, b, expected) => {
    expect(compareBoolean(a, b)).toBe(expected);
  });
});

describe("compareDate", () => {
  it.each([
    [new Date("2024-06-27"), new Date("2024-06-27"), 0],
    [new Date("2024-06-27"), new Date("2023-06-27"), 1],
    [new Date("2023-06-27"), new Date("2024-06-27"), -1],
  ])("(%p, %p) -> %p", (a, b, expected) => {
    expect(compareDate(a, b)).toBe(expected);
  });
});

describe("nullableFirstComparer", () => {
  const compare = nullableFirstComparer(compareNumber);
  it.each([
    [null, null, 0],
    [null, 1, -1],
    [1, null, 1],
    [1, 1, 0],
    [undefined, undefined, 0],
    [undefined, 1, -1],
    [1, undefined, 1],
    [1, 1, 0],
    [null, undefined, 0],
    [undefined, null, 0],
  ])("(compareNumber)(%p, %p) -> %p", (a, b, expected) => {
    expect(compare(a, b)).toBe(expected);
  });
});

describe("conditionFirstComparer", () => {
  const compare: Comparer<number> = conditionFirstComparer(
    (value) => value % 2 === 0
  );
  it.each([
    [1, 1, 0],
    [1, 2, 1],
    [2, 1, -1],
    [1, 3, 0],
    [3, 1, 0],
  ])("(isEven)(%p, %p) -> %p", (a, b, expected) => {
    expect(compare(a, b)).toBe(expected);
  });
});

describe("conditionTypeFirstComparer", () => {
  function isNumber(value: unknown): value is number {
    return typeof value === "number";
  }
  const comparer = conditionTypeFirstComparer<number | string, number>(
    isNumber,
    compareNumber,
    compareString
  );
  const orderedItems = [1, 2, "a", "b"];
  it.each(rotatePermutations(orderedItems).map((items) => [items]))(
    "should sort correctly %",
    (unorderedItems) => {
      expect(unorderedItems.toSorted(comparer)).toStrictEqual(orderedItems);
    }
  );
});

describe("orderComparer", () => {
  const order = ["a", 1, "b", 2, "c"];
  const compare = orderComparer(order);
  const orderedItems = ["a", "a", 1, "b", "b", 2, "c", "c", "d"];
  it.each(rotatePermutations(orderedItems).map((items) => [items]))(
    "should sort correctly %",
    (unorderedItems) => {
      expect(unorderedItems.toSorted(compare)).toStrictEqual(orderedItems);
    }
  );

  it("sorts different types of values", () => {
    expect(
      [1, null, undefined, "a"].toSorted(
        orderComparer([null, "a", 1, undefined])
      )
    ).toStrictEqual([null, "a", 1, undefined]);
  });
});

describe("mapComparer", () => {
  const nameCompare = mapComparer<{ age: number }, number>(
    compareNumber,
    (item) => item.age
  );

  it.each([
    [{ age: 10 }, { age: 10 }, 0],
    [{ age: 10 }, { age: 20 }, -1],
    [{ age: 20 }, { age: 10 }, 1],
  ])(`(%p, %p) -> %p`, (a, b, expected) => {
    expect(nameCompare(a, b)).toBe(expected);
  });
});

describe("groupComparer", () => {
  const groupCompare = groupComparer(
    {
      even: compareNumber,
      odd: compareNumber,
    },
    (item: number) => (item % 2 === 0 ? "even" : "odd"),
    orderComparer(["even", "odd"])
  );

  const orderedItems = [2, 4, 1, 3];
  it.each(rotatePermutations(orderedItems).map((items) => [items]))(
    "should sort correctly %",
    (unorderedItems) => {
      expect(unorderedItems.toSorted(groupCompare)).toStrictEqual(orderedItems);
    }
  );
});

describe("arrayComparer", () => {
  const orderedItems = [[], [1], [1, 1], [1, 2], [2], [2, 2]];
  const compare = arrayComparer(compareNumber);
  it.each(rotatePermutations(orderedItems).map((items) => [items]))(
    "should sort correctly %",
    (unorderedItems) => {
      expect(unorderedItems.toSorted(compare)).toStrictEqual(orderedItems);
    }
  );
});

describe("compareStringNatural", () => {
  const orderedItems = [
    "1",
    "1a",
    "a1",
    "a2",
    "a10",
    "a11",
    "a20",
    "a21",
    "b1",
    "b2",
  ];
  it.each(rotatePermutations(orderedItems).map((items) => [items]))(
    "should sort correctly %",
    (unorderedItems) => {
      expect(unorderedItems.toSorted(compareStringNatural)).toStrictEqual(
        orderedItems
      );
    }
  );
});
