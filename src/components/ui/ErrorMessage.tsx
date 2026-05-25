"use client";

// 인라인 API 오류 메시지 컴포넌트 (F-11, Story #6 / Task #15).
// Business 브릿지 훅 `useApiError`를 통해 오류 상태를 받아, 있으면 인라인 alert를 표시하고
// 없으면 아무것도 렌더하지 않는다. View는 store(Data)를 직접 구독하지 않는다 — 3계층 준수
// (PR #88 리뷰 반영: stateStore 직접 구독 제거).
//
// 디자인 기준: docs/03-design/DESIGN.md(getdesign `clickhouse`)의 error 토큰(#ef4444).
// 접근성: role="alert" + aria-live로 스크린리더 즉시 통지, 닫기 버튼은 터치 타겟 ≥44px.

import { useApiError } from "@/hooks/useApiError";
import { errorMessageVariants } from "@/components/ui/ErrorMessage.variants";

// ErrorMessage의 외부 인터페이스 (props 타입). 컨벤션: 모든 `interface`는 `I` 접두사.
interface IErrorMessageProps {
  // 사용자가 직접 닫을 수 있는 ✕ 버튼 노출 여부. 닫으면 store의 clearApiError를 호출한다.
  // 자동으로 사라지는 자리(예: 검색 결과 영역)에서는 false로 끌 수 있다. 기본 true.
  dismissible?: boolean;
}

/**
 * 인라인 오류 메시지.
 * - store.apiError가 null이면 렌더하지 않음(정상 상태에서 DOM 흔적 없음)
 * - 오류가 있으면 메시지 + (있으면)상태코드 + (옵션)닫기 버튼 표시
 */
export function ErrorMessage({ dismissible = true }: IErrorMessageProps) {
  // 1) Business 브릿지 훅으로 오류 상태 구독 — 컴포넌트는 store를 직접 모름(3계층 준수).
  const { error: apiError, clearError } = useApiError();

  // 2) 오류가 없으면 아무것도 렌더하지 않는다 — 정상 흐름에서는 빈 출력
  if (!apiError) return null;

  // 3) variants에서 slot 클래스 추출 (스타일은 ErrorMessage.variants.ts가 단일 소스)
  const { container, icon, body, message, status, dismiss } = errorMessageVariants();

  // 4) 인라인 alert 렌더 — assertive로 즉시 통지(오류는 사용자가 바로 알아야 함)
  return (
    <div role="alert" aria-live="assertive" className={container()}>
      {/* 경고 아이콘 — 순수 장식이라 스크린리더에서 숨김 */}
      <span aria-hidden="true" className={icon()}>
        ⚠
      </span>

      <div className={body()}>
        {/* 사용자용 오류 문구 */}
        <p className={message()}>{apiError.message}</p>

        {/* HTTP 상태코드가 있을 때만 보조 표기. statusCode 0은 네트워크 끊김·키 누락 등 비-HTTP라 숨김 */}
        {apiError.statusCode > 0 && (
          <p className={status()}>오류 코드: {apiError.statusCode}</p>
        )}
      </div>

      {/* 닫기 버튼 — 클릭 시 오류 상태 해제. 터치 타겟 ≥44px(a11y 오버라이드)는 variants에서 보장 */}
      {dismissible && (
        <button
          type="button"
          aria-label="오류 메시지 닫기"
          className={dismiss()}
          onClick={() => clearError()}
        >
          ✕
        </button>
      )}
    </div>
  );
}
