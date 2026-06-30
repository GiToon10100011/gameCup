// ErrorMessage 컴포넌트(#15)의 단위 테스트.
// store.apiError 구독 → 표시/비표시, 상태코드 보조 표기, 닫기 버튼(clearApiError) 동작을 검증.
//
// ─────────────────────────────────────────────────────────────────────────────
// Vitest / RTL import — 역할 요약 (학습용)
//   beforeEach : 각 it() 실행 직전 호출 — store를 깨끗한 상태로 초기화하는 데 사용
//   afterEach  : 각 it() 직후 — 마운트된 DOM 정리(cleanup)
//   render     : 컴포넌트를 가상 DOM에 마운트
//   screen     : role/label 기반 전역 쿼리 (실제 사용자 흐름과 유사하게 검증)
//   fireEvent  : DOM 이벤트(click) 디스패치
// ─────────────────────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useStateStore } from "@/store/stateStore";
import type { IApiError } from "@/types/game";

// 테스트용 샘플 에러 — searchModule.toApiError가 정규화하면 이런 형태가 된다.
const httpError: IApiError = { message: "RAWG 서버 오류", statusCode: 503 };
const nonHttpError: IApiError = { message: "네트워크 연결을 확인하세요", statusCode: 0 };

describe("ErrorMessage (#15, F-11)", () => {
  // 각 테스트는 깨끗한 store에서 시작 — 이전 테스트의 apiError가 새지 않도록 초기화
  beforeEach(() => {
    useStateStore.getState().resetAll();
  });

  // 마운트된 DOM이 다음 테스트로 새지 않도록 정리
  afterEach(() => cleanup());

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 오류 없음 → 렌더 안 함
  // ───────────────────────────────────────────────────────────────────────────
  it("apiError가 null이면 아무것도 렌더하지 않는다", () => {
    // 초기 상태(apiError=null)에서는 alert가 DOM에 없어야 함
    const { container } = render(<ErrorMessage />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 오류 있음 → 메시지 + role="alert"
  // ───────────────────────────────────────────────────────────────────────────
  it("apiError가 있으면 role=alert로 메시지를 표시한다", () => {
    // 사전에 store에 오류를 반영한 뒤 렌더 (컴포넌트가 마운트 시 구독값을 읽음)
    useStateStore.getState().setApiError(httpError);
    render(<ErrorMessage />);

    // 스크린리더 통지용 role="alert"가 존재하고 메시지가 보여야 함
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText("RAWG 서버 오류")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 상태코드 보조 표기 — >0이면 표시, 0이면 숨김
  // ───────────────────────────────────────────────────────────────────────────
  it("statusCode가 0보다 크면 '오류 코드'를 함께 표시한다", () => {
    useStateStore.getState().setApiError(httpError);
    render(<ErrorMessage />);

    // 503 같은 실제 HTTP 코드는 보조 정보로 노출
    expect(screen.getByText(/오류 코드: 503/)).toBeInTheDocument();
  });

  it("statusCode가 0이면 '오류 코드'를 표시하지 않는다", () => {
    // 네트워크 끊김·키 누락 등 비-HTTP(0)는 코드 표기를 숨긴다
    useStateStore.getState().setApiError(nonHttpError);
    render(<ErrorMessage />);

    expect(screen.getByText("네트워크 연결을 확인하세요")).toBeInTheDocument();
    expect(screen.queryByText(/오류 코드/)).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) 닫기 버튼 — clearApiError 호출 → alert 사라짐
  // ───────────────────────────────────────────────────────────────────────────
  it("기본(dismissible) 상태에서 닫기 버튼을 누르면 오류가 해제되어 사라진다", () => {
    useStateStore.getState().setApiError(httpError);
    render(<ErrorMessage />);

    // 접근성 라벨로 닫기 버튼을 찾는다 (실제 사용자/스크린리더 흐름과 동일)
    const dismissBtn = screen.getByRole("button", { name: "오류 메시지 닫기" });
    fireEvent.click(dismissBtn);

    // 클릭 → clearApiError → store.apiError=null → 컴포넌트 리렌더 → alert 사라짐
    expect(useStateStore.getState().apiError).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) dismissible=false → 닫기 버튼 없음
  // ───────────────────────────────────────────────────────────────────────────
  it("dismissible=false면 닫기 버튼을 렌더하지 않는다", () => {
    useStateStore.getState().setApiError(httpError);
    render(<ErrorMessage dismissible={false} />);

    // 메시지는 보이되 닫기 버튼은 없어야 함
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "오류 메시지 닫기" })).toBeNull();
  });
});
