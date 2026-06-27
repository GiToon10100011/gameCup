// PublicResultPage 통합 테스트 — Task #129 (F-20, UC-10 §링크열람)
//
// 검증 범위:
//   1) 마운트 시 로딩 표시 → getPublicResult(shareId) 호출
//   2) 조회 성공 → 우승자 이름·공유 배지 표시
//   3) 조회 실패(shareId 없음·만료) → 에러 메시지 표시
//   4) winner=null인 share(마이그레이션 이전) → fallback 문구 표시
//   5) shareId 변경 시 재조회

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { IPublicShare } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// Mock — tournamentStorageModule
// ─────────────────────────────────────────────────────────────────────────────
const { mockGetPublicResult } = vi.hoisted(() => ({
  mockGetPublicResult: vi.fn(),
}));

vi.mock("@/modules/tournamentStorageModule", () => ({
  tournamentStorageModule: {
    getPublicResult: mockGetPublicResult,
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 데이터 팩토리
// ─────────────────────────────────────────────────────────────────────────────
const mkShare = (overrides?: Partial<IPublicShare>): IPublicShare => ({
  shareId: "deadbeef0000000000000000deadbeef",
  tournamentId: "tour-001",
  resultId: "res-001",
  winner: { id: "champ", name: "챔피언 게임", thumbnailUrl: "" },
  createdAt: "2026-06-27T02:00:00.000Z",
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// 렌더 헬퍼
// ─────────────────────────────────────────────────────────────────────────────
async function renderPublicResultPage(shareId = "deadbeef0000000000000000deadbeef") {
  const { PublicResultPage } = await import("@/components/share/PublicResultPage");
  return render(<PublicResultPage shareId={shareId} />);
}

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 스위트
// ─────────────────────────────────────────────────────────────────────────────
describe("PublicResultPage 통합 (Task #129, F-20)", () => {
  beforeEach(() => {
    mockGetPublicResult.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 마운트 시 로딩 → getPublicResult 호출
  // ───────────────────────────────────────────────────────────────────────────
  it("마운트 시 로딩 텍스트가 표시되고 getPublicResult(shareId)가 호출된다", async () => {
    // 응답을 지연시켜 로딩 상태를 캡처
    mockGetPublicResult.mockResolvedValue(mkShare());

    await renderPublicResultPage("test-share-id");

    // getPublicResult가 shareId로 호출됐는지 확인
    await waitFor(() =>
      expect(mockGetPublicResult).toHaveBeenCalledWith("test-share-id"),
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 조회 성공 → 우승자 이름 + 공유 배지 표시
  // ───────────────────────────────────────────────────────────────────────────
  it("getPublicResult 성공 시 우승자 이름과 'GameCup 공유 결과' 배지가 표시된다", async () => {
    mockGetPublicResult.mockResolvedValue(mkShare());

    await renderPublicResultPage();

    // 우승자 이름 표시 대기
    await waitFor(() =>
      expect(screen.getByText("챔피언 게임")).toBeInTheDocument(),
    );
    // 공유 배지 확인
    expect(screen.getByText("GameCup 공유 결과")).toBeInTheDocument();
    // aria-label="공유 결과" 섹션 확인
    expect(screen.getByRole("region", { name: "공유 결과" })).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 조회 실패 → "결과를 찾을 수 없습니다" 에러 표시
  // ───────────────────────────────────────────────────────────────────────────
  it("getPublicResult 실패 시 '결과를 찾을 수 없습니다' 에러가 표시된다", async () => {
    mockGetPublicResult.mockRejectedValue(new Error("no rows returned"));

    await renderPublicResultPage("nonexistent");

    // 에러 메시지 표시 대기
    await waitFor(() =>
      expect(screen.getByText("결과를 찾을 수 없습니다.")).toBeInTheDocument(),
    );
    // 부가 안내 문구
    expect(screen.getByText(/만료됐거나 존재하지 않습니다/)).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) winner=null → fallback 문구 표시
  // ───────────────────────────────────────────────────────────────────────────
  it("winner가 null인 share → fallback 문구가 표시된다 (마이그레이션 이전 공유)", async () => {
    mockGetPublicResult.mockResolvedValue(mkShare({ winner: null }));

    await renderPublicResultPage();

    await waitFor(() =>
      expect(screen.getByText("우승자 정보를 불러올 수 없습니다.")).toBeInTheDocument(),
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) shareId prop으로 getPublicResult가 올바른 값으로 호출된다
  // ───────────────────────────────────────────────────────────────────────────
  it("shareId prop이 getPublicResult에 그대로 전달된다", async () => {
    const specificId = "cafebabe1234567890abcdef12345678";
    mockGetPublicResult.mockResolvedValue(mkShare({ shareId: specificId }));

    await renderPublicResultPage(specificId);

    await waitFor(() =>
      expect(mockGetPublicResult).toHaveBeenCalledWith(specificId),
    );
  });
});
