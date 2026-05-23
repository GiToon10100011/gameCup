// 후보 등록·삭제·시작 조건 검증 모듈의 단위 테스트.
// 현재는 인터페이스 명세만 todo로 잡아두고, 실제 구현은 #17·#18·#21 Task에서 채운다.

import { describe, it } from "vitest";

describe("candidateModule (UT-10)", () => {
  // 중복 등록 시 두 번째 추가가 무시되어야 함 (F-04)
  it.todo("동일 게임 중복 추가 시 두 번째 추가는 무시된다");

  // ID 기반 삭제 — 동일 id 게임만 정확히 제거되어야 함
  it.todo("removeFromPool은 ID로 후보를 제거한다");

  // 토너먼트 시작 조건 — 후보 ≥ 2 (F-06 시작 가드)
  it.todo("canStartTournament는 후보가 2개 이상일 때만 true를 반환한다");
});
