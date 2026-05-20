// Vitest 단언 API
import { describe, expect, it } from "vitest";
// 테스트 대상: 1:1 페어 구성 유틸
import { buildPairs } from "@/utils/buildPairs";
// 도메인 타입 — IGame (인터페이스, I 접두사 컨벤션)
import type { IGame } from "@/types/game";

// 테스트용 IGame 객체 팩토리 — 실제 RAWG 응답 없이 최소 필드만 채워 사용
const mkGame = (id: string): IGame => ({ id, name: `Game ${id}`, thumbnailUrl: "" });

// 짝수/홀수 후보·빈 입력 등 경계 케이스에서 페어 구성이 올바른지 검증한다.
describe("buildPairs", () => {
  it("UT-04: 짝수(6개) 후보로 3개 페어를 생성한다", () => {
    // 6개 게임 → 3개 페어, 모두 부전승 아님
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
    // 5개 → 페어 2개 + 부전승 1개 (마지막 게임)
    const games = ["1", "2", "3", "4", "5"].map(mkGame);
    const pairs = buildPairs(games);
    expect(pairs).toHaveLength(3);

    // 부전승/일반 페어 분류 후 개별 속성 검증
    const byes = pairs.filter((p) => p.isBye);
    const nonByes = pairs.filter((p) => !p.isBye);
    expect(byes).toHaveLength(1);
    expect(nonByes).toHaveLength(2);
    // 부전승 페어의 자동 승자는 마지막 게임이어야 함
    expect(byes[0].winner?.id).toBe("5");
    expect(byes[0].gameB).toBeNull();
  });

  it("빈 입력은 빈 페어를 반환한다", () => {
    // 경계값 — 후보가 없으면 페어도 없음
    expect(buildPairs([])).toEqual([]);
  });

  it("단일 게임은 부전승 한 개를 반환한다", () => {
    // 1개 후보 → 부전승 1개 (자동 승자)
    const pairs = buildPairs([mkGame("1")]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].isBye).toBe(true);
    expect(pairs[0].winner?.id).toBe("1");
  });
});
