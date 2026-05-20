// useDebounce 훅 단위 테스트.
// 현재는 명세만 todo로 잡아두고, 실제 구현은 #9 SearchInput 검증과 묶어 별도 PR에서 다룬다.
// (SearchInput 테스트가 디바운싱 동작을 간접 검증하므로 별도 훅 단위 테스트는 후순위)

import { describe, it } from "vitest";

describe("useDebounce (UT-09)", () => {
  // 연속 입력 시 마지막 값만 살아남아야 함 — fake timer 기반 검증 예정
  it.todo("300ms 내 연속 입력 시 마지막 값만 반환한다");
});
