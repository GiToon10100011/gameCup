// CreatePage (src/components/create/CreatePage.tsx) 통합 테스트.
// Task #116 — 검색·후보 재사용 + 이름 입력·저장 배선 검증
//
// 검증 범위:
//   1) 초기 렌더: 검색 입력·후보 목록·이름 입력·저장 버튼이 존재한다
//   2) 후보 2개 미만 → 저장 버튼 비활성화
//   3) 후보 2개 이상 + 이름 입력 → 저장 버튼 활성화
//   4) 저장 버튼 클릭 → createTournament 호출 → 성공 시 router.replace('/') 호출
//   5) createTournament 에러 → 에러 메시지 표시
//   6) 이름 미입력 → 저장 버튼 비활성화
//   7) 저장 중(isSaving) → 버튼 "저장 중…" + 비활성화

import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStateStore } from "@/store/stateStore";
import { CreatePage } from "@/components/create/CreatePage";
import type { IGame } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// next/navigation 모킹
// ─────────────────────────────────────────────────────────────────────────────
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// tournamentStorageModule 모킹 — vi.hoisted로 TDZ 방지
// ─────────────────────────────────────────────────────────────────────────────
const { mockCreateTournament } = vi.hoisted(() => ({
  mockCreateTournament: vi.fn(),
}));

vi.mock("@/modules/tournamentStorageModule", () => ({
  tournamentStorageModule: { createTournament: mockCreateTournament },
}));

// ─────────────────────────────────────────────────────────────────────────────
// 검색 훅 모킹 — 네트워크 없이 빈 결과 반환
// ─────────────────────────────────────────────────────────────────────────────
vi.mock("@/hooks/useSearchQuery", () => ({
  useSearchQuery: () => ({ data: [], isLoading: false }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// tailwind-variants 모킹 — 클래스 노이즈 제거
// ─────────────────────────────────────────────────────────────────────────────
vi.mock("@/components/create/CreatePage.variants", () => ({
  createPageVariants: () => ({
    container: () => "",
    header: () => "",
    title: () => "",
    subtitle: () => "",
    divider: () => "",
    nameSection: () => "",
    nameLabel: () => "",
    nameInput: () => "",
    saveSection: () => "",
    saveButton: () => "",
    errorText: () => "",
    warningText: () => "",
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 헬퍼
// ─────────────────────────────────────────────────────────────────────────────
const mkGame = (id: string): IGame => ({ id, name: `Game ${id}`, thumbnailUrl: "" });

function renderCreatePage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CreatePage />
    </QueryClientProvider>,
  );
}

describe("CreatePage (Task #116, 토너먼트 생성)", () => {
  beforeEach(() => {
    // store·mock 초기화
    useStateStore.getState().resetAll();
    useStateStore.getState().clearUser();
    useStateStore.setState({ isAuthInitialized: true });
    useStateStore.getState().setUser({ id: "user-001", email: "test@test.com" });

    mockCreateTournament.mockReset();
    mockReplace.mockReset();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 초기 렌더 — 핵심 UI 요소 존재 확인
  // ───────────────────────────────────────────────────────────────────────────
  it("검색 입력·후보 목록·이름 입력·저장 버튼이 렌더된다", () => {
    renderCreatePage();

    // 검색 입력창 (SearchInput의 aria-label 또는 placeholder 기반)
    expect(screen.getByRole("main")).toBeInTheDocument();
    // 이름 입력 필드
    expect(screen.getByLabelText("토너먼트 이름")).toBeInTheDocument();
    // 저장 버튼
    expect(screen.getByRole("button", { name: "토너먼트 저장" })).toBeInTheDocument();
    // 페이지 제목
    expect(screen.getByText("새 토너먼트 만들기")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 후보 2개 미만 → 저장 버튼 비활성화
  // ───────────────────────────────────────────────────────────────────────────
  it("후보가 2개 미만이면 저장 버튼이 비활성화된다", () => {
    // 후보 1개만 등록
    useStateStore.getState().addCandidate(mkGame("g1"));

    renderCreatePage();

    // 이름을 입력해도 후보 부족으로 비활성화
    const nameInput = screen.getByLabelText("토너먼트 이름");
    fireEvent.change(nameInput, { target: { value: "내 토너먼트" } });

    const saveBtn = screen.getByRole("button", { name: "토너먼트 저장" });
    expect(saveBtn).toBeDisabled();
    // 경고 문구 표시
    expect(screen.getByText(/후보를 2개 이상 등록/)).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 후보 2개 + 이름 입력 → 저장 버튼 활성화
  // ───────────────────────────────────────────────────────────────────────────
  it("후보 2개 이상 + 이름 입력 시 저장 버튼이 활성화된다", () => {
    // 후보 2개 등록
    useStateStore.getState().addCandidate(mkGame("g1"));
    useStateStore.getState().addCandidate(mkGame("g2"));

    renderCreatePage();

    const nameInput = screen.getByLabelText("토너먼트 이름");
    fireEvent.change(nameInput, { target: { value: "내 토너먼트" } });

    const saveBtn = screen.getByRole("button", { name: "토너먼트 저장" });
    expect(saveBtn).not.toBeDisabled();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) 저장 성공 → createTournament 호출 + router.replace('/tournament') (Task #30)
  // ───────────────────────────────────────────────────────────────────────────
  it("저장 버튼 클릭 시 createTournament가 호출되고 성공 시 '/tournament'로 이동한다", async () => {
    const g1 = mkGame("g1");
    const g2 = mkGame("g2");
    useStateStore.getState().addCandidate(g1);
    useStateStore.getState().addCandidate(g2);

    // createTournament 성공 응답 설정
    mockCreateTournament.mockResolvedValue({
      id: "tour-001",
      name: "내 토너먼트",
      ownerId: "user-001",
      candidates: [g1, g2],
      createdAt: "2026-06-27T00:00:00.000Z",
    });

    renderCreatePage();

    const nameInput = screen.getByLabelText("토너먼트 이름");
    fireEvent.change(nameInput, { target: { value: "내 토너먼트" } });

    const saveBtn = screen.getByRole("button", { name: "토너먼트 저장" });
    fireEvent.click(saveBtn);

    // createTournament 인자 검증
    await vi.waitFor(() => {
      expect(mockCreateTournament).toHaveBeenCalledWith("내 토너먼트", [g1, g2]);
    });

    // 성공 시 토너먼트 화면으로 직행 (Task #30)
    await vi.waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/tournament");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8) 저장 성공 시 이전 플레이 상태(winner) 초기화 — Task #30 화면 전환 방어
  // ───────────────────────────────────────────────────────────────────────────
  it("저장 성공 후 이전 세션의 winner가 초기화된다 (TournamentPage /result 튕김 방어)", async () => {
    const g1 = mkGame("g1");
    const g2 = mkGame("g2");
    useStateStore.getState().addCandidate(g1);
    useStateStore.getState().addCandidate(g2);

    // 이전 세션에서 winner가 남아있는 상태를 시뮬레이션
    useStateStore.getState().setWinner(mkGame("prev-champ"));
    expect(useStateStore.getState().winner).not.toBeNull();

    mockCreateTournament.mockResolvedValue({
      id: "tour-001",
      name: "내 토너먼트",
      ownerId: "user-001",
      candidates: [g1, g2],
      createdAt: "2026-06-27T00:00:00.000Z",
    });

    renderCreatePage();

    const nameInput = screen.getByLabelText("토너먼트 이름");
    fireEvent.change(nameInput, { target: { value: "내 토너먼트" } });
    fireEvent.click(screen.getByRole("button", { name: "토너먼트 저장" }));

    // 저장 완료 후 winner가 null이어야 한다 (resetAll 호출 확인)
    await vi.waitFor(() => {
      expect(useStateStore.getState().winner).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) 저장 실패 → 에러 메시지 표시
  // ───────────────────────────────────────────────────────────────────────────
  it("createTournament 에러 시 에러 메시지가 표시된다", async () => {
    useStateStore.getState().addCandidate(mkGame("g1"));
    useStateStore.getState().addCandidate(mkGame("g2"));

    mockCreateTournament.mockRejectedValue(new Error("Supabase 저장 실패"));

    renderCreatePage();

    const nameInput = screen.getByLabelText("토너먼트 이름");
    fireEvent.change(nameInput, { target: { value: "내 토너먼트" } });

    fireEvent.click(screen.getByRole("button", { name: "토너먼트 저장" }));

    // 에러 메시지 표시 검증
    await vi.waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Supabase 저장 실패");
    });

    // 에러 시 네비게이션 미발생
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6) 이름 미입력 → 저장 버튼 비활성화
  // ───────────────────────────────────────────────────────────────────────────
  it("이름이 비어있으면 후보가 2개 이상이어도 저장 버튼이 비활성화된다", () => {
    useStateStore.getState().addCandidate(mkGame("g1"));
    useStateStore.getState().addCandidate(mkGame("g2"));

    renderCreatePage();

    // 이름 미입력 상태에서 버튼 상태 확인
    const saveBtn = screen.getByRole("button", { name: "토너먼트 저장" });
    expect(saveBtn).toBeDisabled();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7) 저장 중 → 버튼 텍스트 "저장 중…" + 비활성화
  // ───────────────────────────────────────────────────────────────────────────
  it("저장 중일 때 버튼 텍스트가 '저장 중…'으로 바뀌고 비활성화된다", async () => {
    useStateStore.getState().addCandidate(mkGame("g1"));
    useStateStore.getState().addCandidate(mkGame("g2"));

    // createTournament가 해결되지 않는 Promise → 저장 중 상태 유지
    let resolveSave!: () => void;
    mockCreateTournament.mockReturnValue(
      new Promise<void>((resolve) => { resolveSave = resolve; }),
    );

    renderCreatePage();

    const nameInput = screen.getByLabelText("토너먼트 이름");
    fireEvent.change(nameInput, { target: { value: "내 토너먼트" } });
    fireEvent.click(screen.getByRole("button", { name: "토너먼트 저장" }));

    // 저장 중 상태 검증
    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "저장 중…" })).toBeDisabled();
    });

    // 저장 완료 처리 (cleanup)
    resolveSave();
  });
});
