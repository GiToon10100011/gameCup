// Vitest API: 단언·모킹 + 라이프사이클 훅
import { afterEach, describe, expect, it, vi } from "vitest";
// React 테스트 유틸: render·screen·fireEvent + 후처리용 cleanup
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
// 테스트 대상 컴포넌트
import { SearchDropdown } from "@/components/search/SearchDropdown";
// 도메인 타입 — IGame (I 접두사 컨벤션)
import type { IGame } from "@/types/game";

// 테스트용 IGame 객체 팩토리 — RAWG 실제 호출 없이 최소 필드만 채워 사용.
// 옵션으로 thumbnailUrl을 덮어쓸 수 있어 썸네일 유무 케이스를 한 헬퍼로 모두 다룬다.
const mkGame = (id: string, opts: Partial<IGame> = {}): IGame => ({
  id,
  name: `Game ${id}`,
  thumbnailUrl: opts.thumbnailUrl ?? "",
});

// SearchDropdown(#10)의 4가지 상태(닫힘·로딩·빈 결과·결과있음) + 클릭 위임 + 썸네일 분기를 검증한다.
describe("SearchDropdown (#10)", () => {
  // 한 테스트의 DOM이 다음 테스트로 새지 않도록 정리
  afterEach(() => cleanup());

  it("isOpen=false면 아무것도 렌더링하지 않는다", () => {
    // 부모가 외부 클릭으로 드롭다운을 닫은 경우 — DOM에 그 어떤 child도 노출되어선 안 됨
    const { container } = render(
      <SearchDropdown games={[]} onSelect={() => {}} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("isLoading=true면 로딩 메시지를 listbox로 표시한다", () => {
    // 외부 API 호출 진행 중 — aria-busy로 보조 기술에 신호
    render(<SearchDropdown games={[]} onSelect={() => {}} isLoading />);
    const box = screen.getByRole("listbox", { name: /로딩 중/ });
    expect(box).toBeInTheDocument();
    expect(box).toHaveAttribute("aria-busy", "true");
    expect(box).toHaveTextContent(/불러오는 중/);
  });

  it("games가 비어있으면 '결과가 없습니다' 메시지를 표시한다", () => {
    // 검색어는 있으나 매치 결과 0건 — 사용자에게 명확히 알림
    render(<SearchDropdown games={[]} onSelect={() => {}} />);
    expect(screen.getByText(/결과가 없습니다/)).toBeInTheDocument();
  });

  it("games 배열을 항목으로 렌더링한다 (F-02 썸네일+이름)", () => {
    // 3건 결과 — listbox 컨테이너 + option 3개가 정확히 노출되어야 함
    const games = [mkGame("1"), mkGame("2"), mkGame("3")];
    render(<SearchDropdown games={games} onSelect={() => {}} />);
    expect(screen.getByRole("listbox", { name: /검색 결과/ })).toBeInTheDocument();
    expect(screen.getByText("Game 1")).toBeInTheDocument();
    expect(screen.getByText("Game 2")).toBeInTheDocument();
    expect(screen.getByText("Game 3")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("항목 클릭 시 onSelect가 해당 game 객체로 호출된다", () => {
    // 부모는 후보 등록·상세 보기 등 다음 단계를 결정 — 본 컴포넌트는 위임만 한다
    const handler = vi.fn();
    const games = [mkGame("1"), mkGame("2")];
    render(<SearchDropdown games={games} onSelect={handler} />);
    fireEvent.click(screen.getByText("Game 2"));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(games[1]);
  });

  it("thumbnailUrl이 비어있으면 이미지 대신 placeholder가 렌더링된다", () => {
    // 빈 썸네일 — Next.js Image의 빈 src 에러를 피하기 위해 placeholder div로 대체
    const games = [mkGame("1", { thumbnailUrl: "" })];
    const { container } = render(<SearchDropdown games={games} onSelect={() => {}} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("thumbnailUrl이 있으면 img 태그가 렌더링된다", () => {
    // 정상 썸네일 URL이 있으면 Next.js Image가 결국 <img> 태그로 렌더링
    const games = [mkGame("1", { thumbnailUrl: "https://media.rawg.io/abc.jpg" })];
    const { container } = render(<SearchDropdown games={games} onSelect={() => {}} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
  });
});
