"use client";

// API 오류 상태를 View에 노출하는 어댑터 훅 (Story #6 / PR #88 리뷰 반영).
//
// 목적: 컴포넌트(Presentation)가 `stateStore`(Data)를 **직접** 구독하면 3계층 호출 방향
//       (Presentation → Business → Data)을 건너뛰게 된다. 본 훅이 store 접근을 캡슐화해
//       컴포넌트는 작은 view-model 인터페이스만 의존하도록 분리한다.
//       (검색의 useSearchQuery와 동일한 hooks/ 브릿지 패턴.)

import { useStateStore } from "@/store/stateStore";
import type { IApiError } from "@/types/game";

// View가 사용할 최소 인터페이스 — 현재 오류 + 해제 핸들러. 컨벤션: interface는 `I` 접두사.
interface IUseApiError {
  // 현재 API 오류. 정상 상태면 null.
  error: IApiError | null;
  // 오류 배너를 닫을 때 호출 — store의 apiError를 해제한다.
  clearError: () => void;
}

/**
 * 현재 API 오류 상태를 구독해 반환한다.
 * - 필드별 selector로 apiError·clearApiError만 구독 → 무관한 상태 변화엔 리렌더 안 함
 * - apiError가 바뀌면 구독 컴포넌트가 자동 리렌더
 */
export function useApiError(): IUseApiError {
  const error = useStateStore((state) => state.apiError);
  const clearError = useStateStore((state) => state.clearApiError);
  return { error, clearError };
}
