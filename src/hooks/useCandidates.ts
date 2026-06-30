"use client";

// 후보 목록을 View에 노출하는 어댑터 훅 (Story #7 / Task #20).
//
// 목적: 컴포넌트(Presentation)가 `stateStore`(Data)를 직접 구독하면 3계층 호출 방향
//       (Presentation → Business → Data)을 건너뛴다(PR #88 리뷰 교훈). 본 훅이 store 접근을
//       캡슐화해 CandidateList는 후보 배열만 의존하게 한다. (useApiError와 동일한 브릿지 패턴.)

import { useStateStore } from "@/store/stateStore";
import type { IGame } from "@/types/game";

/**
 * 현재 후보 목록을 구독해 반환한다.
 * - candidates 슬라이스만 선택 구독 → 무관한 상태 변화엔 리렌더 안 함
 * - 등록/삭제로 목록이 바뀌면 구독 컴포넌트가 자동 리렌더
 */
export function useCandidates(): IGame[] {
  return useStateStore((state) => state.candidates);
}
