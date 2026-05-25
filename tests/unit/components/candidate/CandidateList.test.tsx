// CandidateList 컴포넌트(#20)의 단위 테스트.
// 빈 상태 안내 / 목록 렌더(이름) / 썸네일·placeholder 분기 / 삭제 버튼 onDelete(id) 위임을 검증.
//
// CandidateList는 useCandidates(→ stateStore)로 목록을 구독하므로, store에 후보를 미리 넣고 렌더한다.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CandidateList } from "@/components/candidate/CandidateList";
import { useStateStore } from "@/store/stateStore";
import type { IGame } from "@/types/game";

// 최소 IGame 팩토리 — thumbnailUrl 유무로 image/placeholder 케이스를 나눈다.
const mkGame = (id: string, thumbnailUrl = ""): IGame => ({
  id,
  name: `Game ${id}`,
  thumbnailUrl,
});

describe("CandidateList (#20, F-05)", () => {
  // 각 테스트는 깨끗한 store에서 시작
  beforeEach(() => {
    useStateStore.getState().resetAll();
  });

  // 마운트 정리 — 테스트 간 DOM 누수 방지
  afterEach(() => cleanup());

  // ───────────────────────────────────────────────────────────────────────────
  // 1) 빈 상태
  // ───────────────────────────────────────────────────────────────────────────
  it("후보가 없으면 빈 안내 문구를 표시하고 목록은 렌더하지 않는다", () => {
    render(<CandidateList onDelete={() => {}} />);

    expect(screen.getByText("등록된 후보가 없습니다.")).toBeInTheDocument();
    // 목록(<ul role=list>)은 없어야 함
    expect(screen.queryByRole("list")).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) 목록 렌더 (이름)
  // ───────────────────────────────────────────────────────────────────────────
  it("후보가 있으면 role=list로 각 후보 이름을 표시한다", () => {
    useStateStore.getState().addCandidate(mkGame("1"));
    useStateStore.getState().addCandidate(mkGame("2"));
    render(<CandidateList onDelete={() => {}} />);

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByText("Game 1")).toBeInTheDocument();
    expect(screen.getByText("Game 2")).toBeInTheDocument();
    // 항목 수 = 후보 수
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) 썸네일 / placeholder 분기
  // ───────────────────────────────────────────────────────────────────────────
  it("thumbnailUrl이 있으면 img, 없으면 placeholder로 렌더한다", () => {
    // 1개는 썸네일 있음, 1개는 없음 → img 1개 + placeholder 1개로 두 분기 모두 검증
    useStateStore.getState().addCandidate(mkGame("1", "https://media.rawg.io/x.jpg"));
    useStateStore.getState().addCandidate(mkGame("2"));
    const { container } = render(<CandidateList onDelete={() => {}} />);

    // image 분기: img 정확히 1개
    expect(container.querySelectorAll("img")).toHaveLength(1);
    // placeholder 분기: 직접 존재 검증 (img 개수만으로는 placeholder 누락을 못 잡음)
    expect(screen.getAllByTestId("candidate-thumb-placeholder")).toHaveLength(1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) 삭제 버튼 — onDelete(id) 오버라이드
  // ───────────────────────────────────────────────────────────────────────────
  it("커스텀 onDelete를 넘기면 해당 후보 id로 그 핸들러가 호출된다(기본 연결 대신)", () => {
    useStateStore.getState().addCandidate(mkGame("42"));
    const onDelete = vi.fn();
    render(<CandidateList onDelete={onDelete} />);

    // 접근성 라벨(게임명 포함)으로 삭제 버튼을 찾는다
    const delBtn = screen.getByRole("button", { name: "후보에서 삭제: Game 42" });
    fireEvent.click(delBtn);

    // 커스텀 onDelete가 정확한 id로 호출되고, 기본 removeFromPool은 안 타므로 store는 그대로
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("42");
    expect(useStateStore.getState().getCandidates()).toHaveLength(1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) 삭제 버튼 — onDelete 미지정 시 기본 연결(removeFromPool) 동작 (#22)
  // ───────────────────────────────────────────────────────────────────────────
  it("onDelete 미지정 시 삭제 버튼이 removeFromPool로 실제 후보를 제거한다", () => {
    useStateStore.getState().addCandidate(mkGame("1"));
    useStateStore.getState().addCandidate(mkGame("2"));

    // onDelete 없이 렌더 — 기본 연결(candidateModule.removeFromPool) 사용
    render(<CandidateList />);

    // "Game 1" 삭제 버튼 클릭 → 실제 store에서 제거 → useCandidates 구독으로 목록 리렌더
    fireEvent.click(screen.getByRole("button", { name: "후보에서 삭제: Game 1" }));

    expect(useStateStore.getState().getCandidates().map((c) => c.id)).toEqual(["2"]);
    expect(screen.queryByText("Game 1")).toBeNull();
    expect(screen.getByText("Game 2")).toBeInTheDocument();
  });
});
