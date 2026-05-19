// Vitest 단언 API
import { describe, expect, it } from "vitest";
// 테스트 대상: Fisher-Yates 셔플 유틸
import { shuffle } from "@/utils/shuffle";

// 셔플의 정확성(요소 보존)·경계 케이스·불변성을 검증한다.
describe("shuffle (Fisher-Yates)", () => {
  it("UT-01: 10개 배열을 셔플해도 동일 요소 집합을 유지한다", () => {
    // 0~9 입력 배열 준비
    const input = Array.from({ length: 10 }, (_, i) => i);
    // 셔플 실행
    const result = shuffle(input);
    // 길이와 요소 집합이 동일한지 확인 (순서는 다를 수 있음)
    expect(result).toHaveLength(input.length);
    expect([...result].sort((a, b) => a - b)).toEqual(input);
  });

  it("UT-02: 단일 요소 배열은 동일한 배열을 반환한다", () => {
    // 셔플할 게 없으므로 그대로 반환되어야 함
    expect(shuffle([42])).toEqual([42]);
  });

  it("UT-03: 빈 배열은 빈 배열을 반환한다", () => {
    // 경계값 — 빈 입력 → 빈 출력
    expect(shuffle([])).toEqual([]);
  });

  it("입력 배열은 변형되지 않는다 (불변성)", () => {
    // 원본 스냅샷을 저장한 뒤 셔플 호출
    const input = [1, 2, 3, 4, 5];
    const snapshot = input.slice();
    shuffle(input);
    // 원본이 그대로 보존되었는지 확인
    expect(input).toEqual(snapshot);
  });
});
