import { describe, expect, it } from "vitest";
import { buildPairs } from "@/utils/buildPairs";
import type { Game } from "@/types/game";

const mkGame = (id: string): Game => ({ id, name: `Game ${id}`, thumbnailUrl: "" });

describe("buildPairs", () => {
  it("UT-04: 짝수(6개) 후보로 3개 페어를 생성한다", () => {
    const games = ["1", "2", "3", "4", "5", "6"].map(mkGame);
    const pairs = buildPairs(games);
    expect(pairs).toHaveLength(3);
    pairs.forEach((p) => {
      expect(p.isBye).toBe(false);
      expect(p.gameB).not.toBeNull();
      expect(p.winner).toBeNull();
    });
  });

  it("UT-05: 홀수(5개) 후보로 2 페어 + 1 부전승을 생성한다", () => {
    const games = ["1", "2", "3", "4", "5"].map(mkGame);
    const pairs = buildPairs(games);
    expect(pairs).toHaveLength(3);
    const byes = pairs.filter((p) => p.isBye);
    const nonByes = pairs.filter((p) => !p.isBye);
    expect(byes).toHaveLength(1);
    expect(nonByes).toHaveLength(2);
    expect(byes[0].winner?.id).toBe("5");
    expect(byes[0].gameB).toBeNull();
  });

  it("빈 입력은 빈 페어를 반환한다", () => {
    expect(buildPairs([])).toEqual([]);
  });

  it("단일 게임은 부전승 한 개를 반환한다", () => {
    const pairs = buildPairs([mkGame("1")]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].isBye).toBe(true);
    expect(pairs[0].winner?.id).toBe("1");
  });
});
