import { describe, expect, it } from "vitest";
import { shuffle } from "@/utils/shuffle";

describe("shuffle (Fisher-Yates)", () => {
  it("UT-01: 10개 배열을 셔플해도 동일 요소 집합을 유지한다", () => {
    const input = Array.from({ length: 10 }, (_, i) => i);
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
    expect([...result].sort((a, b) => a - b)).toEqual(input);
  });

  it("UT-02: 단일 요소 배열은 동일한 배열을 반환한다", () => {
    expect(shuffle([42])).toEqual([42]);
  });

  it("UT-03: 빈 배열은 빈 배열을 반환한다", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("입력 배열은 변형되지 않는다 (불변성)", () => {
    const input = [1, 2, 3, 4, 5];
    const snapshot = input.slice();
    shuffle(input);
    expect(input).toEqual(snapshot);
  });
});
