// `stateStore`의 AuthSlice(인증 세션 상태) 단위 테스트.
// Task #106 — AuthSlice 추가 (인증 세션 상태)
//
// 검증 범위:
//   1) 초기 상태: currentUser가 null이다
//   2) setUser: IUser를 저장하면 getUser()로 조회된다
//   3) clearUser: 저장된 사용자를 지우면 null이 반환된다
//   4) resetAll: 토너먼트 플레이 상태만 초기화되고 currentUser는 유지된다
//   5) setUser → clearUser → setUser: 연속 조작이 정상 동작한다
//
// stateStore는 외부 의존성 없는 메모리 store이므로 mock 없이 직접 호출한다.

import { beforeEach, describe, expect, it } from "vitest";
import { useStateStore } from "@/store/stateStore";
import type { IUser } from "@/types/game";

// 테스트용 IUser 팩토리 — 최소 필드만 채워 반환한다.
// 실제 Supabase UUID 형식을 모방하지만, 단위 테스트에서는 형식 무관.
const mkUser = (id: string, email = `${id}@example.com`): IUser => ({ id, email });

describe("stateStore — AuthSlice (Task #106, 인증 세션 상태)", () => {
  // 각 테스트 전에 전체 store를 초기화하되, currentUser는 resetAll 동작 검증이 있어
  // 명시적으로 clearUser()까지 호출해 깨끗한 상태를 보장한다.
  beforeEach(() => {
    useStateStore.getState().resetAll();
    useStateStore.getState().clearUser();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 초기 상태
  // ───────────────────────────────────────────────────────────────────────────
  it("초기 상태: currentUser가 null이다", () => {
    // 앱 최초 로드 시 인증 정보는 없으므로 null이어야 한다.
    expect(useStateStore.getState().currentUser).toBeNull();
    // getUser() 메서드도 동일하게 null을 반환해야 한다 (UML §AuthSlice.getUser).
    expect(useStateStore.getState().getUser()).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) setUser 저장 및 getUser 조회
  // ───────────────────────────────────────────────────────────────────────────
  it("setUser: IUser를 저장하면 getUser()로 조회된다", () => {
    const user = mkUser("user-001");

    // 로그인 성공 시 AuthModule이 호출하는 흐름을 시뮬레이션
    useStateStore.getState().setUser(user);

    // getUser()와 직접 필드 접근 모두 일치해야 한다
    expect(useStateStore.getState().getUser()).toEqual(user);
    expect(useStateStore.getState().currentUser).toEqual(user);

    // 개별 필드 검증
    expect(useStateStore.getState().getUser()?.id).toBe("user-001");
    expect(useStateStore.getState().getUser()?.email).toBe("user-001@example.com");
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) clearUser 후 null 반환
  // ───────────────────────────────────────────────────────────────────────────
  it("clearUser: 저장된 사용자를 지우면 null이 반환된다", () => {
    // 먼저 사용자를 저장한다
    useStateStore.getState().setUser(mkUser("user-002"));
    expect(useStateStore.getState().getUser()).not.toBeNull();

    // 로그아웃·세션 만료 시 AuthModule이 호출하는 흐름을 시뮬레이션
    useStateStore.getState().clearUser();

    // 세션이 비워졌으므로 null이어야 한다
    expect(useStateStore.getState().getUser()).toBeNull();
    expect(useStateStore.getState().currentUser).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) resetAll은 플레이 데이터만 초기화 — currentUser 유지
  // ───────────────────────────────────────────────────────────────────────────
  it("resetAll: 토너먼트 플레이 상태만 초기화되고 currentUser는 유지된다", () => {
    const user = mkUser("user-003");

    // 로그인 상태에서 게임 후보를 등록하고 토너먼트를 시작한 상황을 시뮬레이션
    useStateStore.getState().setUser(user);
    useStateStore
      .getState()
      .addCandidate({ id: "game-1", name: "Game 1", thumbnailUrl: "" });

    // 새 토너먼트 시작(F-13) — resetAll 호출
    useStateStore.getState().resetAll();

    // 플레이 데이터(후보 목록, 라운드, 우승자 등)는 초기화돼야 한다
    expect(useStateStore.getState().candidates).toHaveLength(0);
    expect(useStateStore.getState().currentRound).toBe(0);
    expect(useStateStore.getState().winner).toBeNull();

    // 로그인 세션은 유지돼야 한다 — 새 토너먼트를 시작해도 재로그인은 불필요
    expect(useStateStore.getState().getUser()).toEqual(user);
    expect(useStateStore.getState().currentUser).toEqual(user);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) 연속 조작 (setUser → clearUser → setUser)
  // ───────────────────────────────────────────────────────────────────────────
  it("setUser → clearUser → setUser: 연속 조작이 정상 동작한다", () => {
    const userA = mkUser("user-004", "a@example.com");
    const userB = mkUser("user-005", "b@example.com");

    // 첫 번째 로그인
    useStateStore.getState().setUser(userA);
    expect(useStateStore.getState().getUser()?.id).toBe("user-004");

    // 로그아웃
    useStateStore.getState().clearUser();
    expect(useStateStore.getState().getUser()).toBeNull();

    // 두 번째 로그인 — 다른 사용자로도 정상 동작해야 한다
    useStateStore.getState().setUser(userB);
    expect(useStateStore.getState().getUser()?.id).toBe("user-005");
    expect(useStateStore.getState().getUser()?.email).toBe("b@example.com");
  });
});
