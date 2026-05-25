// 후보 등록·삭제·시작 조건 검증 모듈의 단위 테스트.
// addToPool(등록, #18)·removeFromPool(삭제, #21)을 구현. canStartTournament(토너먼트)는 todo 유지.

import { beforeEach, describe, expect, it } from "vitest";
import { addToPool, removeFromPool } from "@/modules/candidateModule";
import { useStateStore } from "@/store/stateStore";
import type { IGame } from "@/types/game";

// 최소 IGame 팩토리 — id만 다르게 찍어 등록/중복 케이스를 만든다.
const mkGame = (id: string): IGame => ({ id, name: `Game ${id}`, thumbnailUrl: "" });

describe("candidateModule (UT-10)", () => {
  // 각 테스트는 깨끗한 store에서 시작 — 이전 테스트의 후보가 새지 않도록 reset
  beforeEach(() => {
    useStateStore.getState().resetAll();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // addToPool — 후보 등록 액션 (#18, F-03 등록 · F-04 중복 방지)
  // ───────────────────────────────────────────────────────────────────────────
  describe("addToPool — 후보 등록 (#18)", () => {
    it("새 게임 등록 시 { ok: true }를 반환하고 후보에 추가한다 (F-03)", () => {
      const result = addToPool(mkGame("1"));

      // 성공은 discriminated union의 ok:true로 표현 — UI는 이걸로 분기
      expect(result).toEqual({ ok: true });
      expect(useStateStore.getState().getCandidates().map((c) => c.id)).toEqual(["1"]);
    });

    it("동일 게임 중복 추가 시 { ok: false, reason: 'duplicate' }를 반환하고 무시한다 (F-04)", () => {
      // 1차 등록 성공
      expect(addToPool(mkGame("1"))).toEqual({ ok: true });

      // 2차 동일 id — 중복으로 거부되고 사유를 명시(UI가 토스트/인라인 알림 띄움)
      const dup = addToPool(mkGame("1"));
      expect(dup).toEqual({ ok: false, reason: "duplicate" });

      // 후보는 1개로 유지 (중복 미추가)
      expect(useStateStore.getState().getCandidates()).toHaveLength(1);
    });

    it("서로 다른 게임은 연속 등록이 모두 성공한다", () => {
      // 서로 다른 id는 중복이 아니므로 등록이 모두 성공하고 순서대로 누적되어야 한다.
      expect(addToPool(mkGame("1"))).toEqual({ ok: true });
      expect(addToPool(mkGame("2"))).toEqual({ ok: true });

      expect(useStateStore.getState().getCandidates().map((c) => c.id)).toEqual(["1", "2"]);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // removeFromPool — 후보 삭제 액션 (#21, F-05)
  // ───────────────────────────────────────────────────────────────────────────
  describe("removeFromPool — 후보 삭제 (#21)", () => {
    it("주어진 id의 후보만 제거한다 (F-05)", () => {
      // 두 후보 등록 후 하나만 삭제 → 나머지 하나만 남아야 함
      addToPool(mkGame("1"));
      addToPool(mkGame("2"));

      removeFromPool("1");

      expect(useStateStore.getState().getCandidates().map((c) => c.id)).toEqual(["2"]);
    });

    it("존재하지 않는 id 삭제는 목록을 변경하지 않는다", () => {
      addToPool(mkGame("1"));

      // 없는 id 삭제 — 방어적으로 무변화여야 함(에러 없이)
      removeFromPool("999");

      expect(useStateStore.getState().getCandidates().map((c) => c.id)).toEqual(["1"]);
    });

    it("삭제 후 같은 게임을 다시 등록할 수 있다", () => {
      // 삭제는 중복 판정 키(id)를 풀어주므로, 삭제 후 재등록이 성공해야 함
      addToPool(mkGame("1"));
      removeFromPool("1");

      expect(addToPool(mkGame("1"))).toEqual({ ok: true });
      expect(useStateStore.getState().getCandidates()).toHaveLength(1);
    });
  });

  // 토너먼트 시작 조건 — 후보 ≥ 2 (F-06 시작 가드, 토너먼트 Task에서 구현)
  it.todo("canStartTournament는 후보가 2개 이상일 때만 true를 반환한다");
});
