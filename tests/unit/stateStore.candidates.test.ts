// `stateStore`의 후보 목록 상태(candidates)의 단위 테스트.
// Issue #17 — 후보 목록 상태 관리 구현 (Zustand store).
//
// 검증 범위:
//   1) 초기 상태에서 후보 목록은 빈 배열
//   2) addCandidate 성공 시 true 반환 + 목록에 추가
//   3) addCandidate 중복(같은 id) 시 false 반환 + 추가 안 함 (F-04 중복 방지)
//   4) 서로 다른 id는 독립적으로 누적
//   5) addCandidate는 새 배열 인스턴스로 갱신 (불변 업데이트 → React 리렌더 트리거)
//   6) removeCandidate는 해당 id만 제거 (F-05), 없는 id는 무변화
//   7) resetAll 시 후보 목록 초기화 + 이후 정상 동작
//
// stateStore는 외부 의존성 없는 메모리 store이므로 mock 없이 직접 호출한다.

import { beforeEach, describe, expect, it } from "vitest";
import { useStateStore } from "@/store/stateStore";
import type { IGame } from "@/types/game";

// 최소 IGame 팩토리 — id만 다르게 찍어 중복/독립 케이스를 만든다.
const mkGame = (id: string): IGame => ({ id, name: `Game ${id}`, thumbnailUrl: "" });

describe("stateStore.candidates (Issue #17, 후보 목록 상태)", () => {
  // 각 테스트는 깨끗한 store에서 시작 — 이전 테스트의 후보가 새지 않도록 reset
  beforeEach(() => {
    useStateStore.getState().resetAll();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 초기 상태
  // ───────────────────────────────────────────────────────────────────────────
  it("초기 상태에서 후보 목록은 빈 배열이다", () => {
    expect(useStateStore.getState().getCandidates()).toEqual([]);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 등록 성공
  // ───────────────────────────────────────────────────────────────────────────
  it("addCandidate는 성공 시 true를 반환하고 목록에 추가한다", () => {
    const added = useStateStore.getState().addCandidate(mkGame("1"));

    expect(added).toBe(true);
    const list = useStateStore.getState().getCandidates();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("1");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 중복 방지 (F-04)
  // ───────────────────────────────────────────────────────────────────────────
  it("같은 id를 다시 등록하면 false를 반환하고 추가하지 않는다", () => {
    const store = useStateStore.getState();
    expect(store.addCandidate(mkGame("1"))).toBe(true);
    // 동일 id 재등록 — 부모(candidateModule)가 중복 알림을 띄울 수 있도록 false를 돌려줌
    expect(store.addCandidate(mkGame("1"))).toBe(false);

    // 목록은 1개로 유지되어야 함 (중복 미추가)
    expect(useStateStore.getState().getCandidates()).toHaveLength(1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) 서로 다른 id 누적
  // ───────────────────────────────────────────────────────────────────────────
  it("서로 다른 id는 모두 누적된다", () => {
    const store = useStateStore.getState();
    store.addCandidate(mkGame("1"));
    store.addCandidate(mkGame("2"));
    store.addCandidate(mkGame("3"));

    expect(useStateStore.getState().getCandidates().map((c) => c.id)).toEqual(["1", "2", "3"]);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) 불변 업데이트 (새 배열 인스턴스)
  // ───────────────────────────────────────────────────────────────────────────
  it("addCandidate는 새 배열 인스턴스로 갱신해 참조가 바뀐다", () => {
    // 갱신 전 배열 참조 캡처
    const before = useStateStore.getState().candidates;
    useStateStore.getState().addCandidate(mkGame("1"));

    // 같은 배열을 mutate하면 selector subscriber가 리렌더되지 않으므로 참조가 달라야 함
    const after = useStateStore.getState().candidates;
    expect(after).not.toBe(before);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6) 삭제 (F-05)
  // ───────────────────────────────────────────────────────────────────────────
  it("removeCandidate는 해당 id만 제거하고, 없는 id는 무변화", () => {
    const store = useStateStore.getState();
    store.addCandidate(mkGame("1"));
    store.addCandidate(mkGame("2"));

    // "1"만 제거 → "2"만 남음
    useStateStore.getState().removeCandidate("1");
    expect(useStateStore.getState().getCandidates().map((c) => c.id)).toEqual(["2"]);

    // 존재하지 않는 id 제거는 아무 영향 없음
    useStateStore.getState().removeCandidate("999");
    expect(useStateStore.getState().getCandidates().map((c) => c.id)).toEqual(["2"]);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7) resetAll 후 상태
  // ───────────────────────────────────────────────────────────────────────────
  it("resetAll 호출 후 후보 목록이 비워지고 이후 등록이 정상 동작한다", () => {
    const store = useStateStore.getState();
    store.addCandidate(mkGame("1"));
    store.addCandidate(mkGame("2"));

    store.resetAll();
    expect(useStateStore.getState().getCandidates()).toEqual([]);

    // reset 직후에도 다시 등록 가능해야 함
    expect(useStateStore.getState().addCandidate(mkGame("9"))).toBe(true);
    expect(useStateStore.getState().getCandidates()).toHaveLength(1);
  });
});
