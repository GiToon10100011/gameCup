// MatchCard 컴포넌트 단위 테스트 — Task #31 (F-07 1:1 대결 UI)
//
// 검증 범위:
//   1) 두 게임 이름이 모두 렌더된다
//   2) "VS" 구분자가 표시된다
//   3) gameA 선택 버튼 클릭 → onSelect(gameA) 호출
//   4) gameB 선택 버튼 클릭 → onSelect(gameB) 호출
//   5) disabled=true → 두 선택 버튼 모두 비활성화 (NF-02)
//   6) isBye=true → VS·gameB 미표시, gameA에 "자동 진출" 뱃지
//   7) thumbnailUrl 없으면 img 미렌더 (placeholder)
//   8) thumbnailUrl 있으면 img 렌더

import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MatchCard } from "@/components/tournament/MatchCard";
import type { IGame, ITournamentPair } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// next/image 모킹 — 테스트 환경에서 Next.js Image를 단순 img로 대체
// ─────────────────────────────────────────────────────────────────────────────
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  }) => <img src={src} alt={alt} className={className} />,
}));

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 데이터 팩토리
// ─────────────────────────────────────────────────────────────────────────────
const mkGame = (id: string, thumbnailUrl = ""): IGame => ({
  id,
  name: `Game ${id}`,
  thumbnailUrl,
});

const mkPair = (overrides?: Partial<ITournamentPair>): ITournamentPair => ({
  gameA: mkGame("A"),
  gameB: mkGame("B"),
  winner: null,
  isBye: false,
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 스위트
// ─────────────────────────────────────────────────────────────────────────────
describe("MatchCard (Task #31, F-07)", () => {
  // ───────────────────────────────────────────────────────────────────────────
  // 1) 두 게임 이름 렌더
  // ───────────────────────────────────────────────────────────────────────────
  it("두 게임 이름이 모두 화면에 표시된다", () => {
    const pair = mkPair();
    render(<MatchCard pair={pair} onSelect={vi.fn()} />);

    expect(screen.getByText("Game A")).toBeInTheDocument();
    expect(screen.getByText("Game B")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2) VS 구분자
  // ───────────────────────────────────────────────────────────────────────────
  it("두 카드 사이에 VS 텍스트가 표시된다", () => {
    render(<MatchCard pair={mkPair()} onSelect={vi.fn()} />);

    expect(screen.getByText("VS")).toBeInTheDocument();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3) gameA 선택 → onSelect(gameA)
  // ───────────────────────────────────────────────────────────────────────────
  it("'Game A 선택' 버튼을 클릭하면 onSelect(gameA)가 호출된다", () => {
    const pair = mkPair();
    const onSelect = vi.fn();
    render(<MatchCard pair={pair} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Game A 선택" }));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(pair.gameA);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4) gameB 선택 → onSelect(gameB)
  // ───────────────────────────────────────────────────────────────────────────
  it("'Game B 선택' 버튼을 클릭하면 onSelect(gameB)가 호출된다", () => {
    const pair = mkPair();
    const onSelect = vi.fn();
    render(<MatchCard pair={pair} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Game B 선택" }));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(pair.gameB);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5) disabled=true → 두 버튼 모두 비활성화 (NF-02 연속 클릭 방지)
  // ───────────────────────────────────────────────────────────────────────────
  it("disabled=true이면 두 선택 버튼이 모두 비활성화된다 (NF-02)", () => {
    render(<MatchCard pair={mkPair()} onSelect={vi.fn()} disabled />);

    expect(screen.getByRole("button", { name: "Game A 선택" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Game B 선택" })).toBeDisabled();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6) isBye=true → VS·gameB 미표시, gameA에 "자동 진출" 뱃지
  // ───────────────────────────────────────────────────────────────────────────
  it("isBye=true이면 VS와 gameB 카드가 없고 gameA에 '자동 진출' 뱃지가 표시된다", () => {
    const pair = mkPair({ gameB: null, isBye: true });
    render(<MatchCard pair={pair} onSelect={vi.fn()} />);

    // VS 미표시
    expect(screen.queryByText("VS")).toBeNull();
    // gameB 이름 미표시
    expect(screen.queryByText("Game B")).toBeNull();
    // gameA 이름은 표시
    expect(screen.getByText("Game A")).toBeInTheDocument();
    // 자동 진출 뱃지 표시
    expect(screen.getByText("자동 진출")).toBeInTheDocument();
    // 선택 버튼 미표시
    expect(screen.queryByRole("button", { name: "Game A 선택" })).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7) thumbnailUrl 없으면 img 미렌더 (placeholder)
  // ───────────────────────────────────────────────────────────────────────────
  it("thumbnailUrl이 없으면 img가 렌더되지 않는다 (placeholder 사용)", () => {
    // 기본 mkGame은 thumbnailUrl = "" 이므로 이미지 없음
    const { container } = render(<MatchCard pair={mkPair()} onSelect={vi.fn()} />);

    expect(container.querySelector("img")).toBeNull();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8) thumbnailUrl 있으면 img 렌더
  // ───────────────────────────────────────────────────────────────────────────
  it("thumbnailUrl이 있으면 해당 URL로 img가 렌더된다", () => {
    const pair = mkPair({
      gameA: mkGame("A", "https://example.com/game-a.jpg"),
      gameB: mkGame("B", "https://example.com/game-b.jpg"),
    });
    const { container } = render(<MatchCard pair={pair} onSelect={vi.fn()} />);

    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toHaveAttribute("src", "https://example.com/game-a.jpg");
    expect(imgs[1]).toHaveAttribute("src", "https://example.com/game-b.jpg");
  });
});
