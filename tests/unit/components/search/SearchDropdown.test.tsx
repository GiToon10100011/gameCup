import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SearchDropdown } from "@/components/search/SearchDropdown";
import type { Game } from "@/types/game";

const mkGame = (id: string, opts: Partial<Game> = {}): Game => ({
  id,
  name: `Game ${id}`,
  thumbnailUrl: opts.thumbnailUrl ?? "",
});

describe("SearchDropdown (#10)", () => {
  afterEach(() => cleanup());

  it("isOpen=false면 아무것도 렌더링하지 않는다", () => {
    const { container } = render(
      <SearchDropdown games={[]} onSelect={() => {}} isOpen={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("isLoading=true면 로딩 메시지를 listbox로 표시한다", () => {
    render(<SearchDropdown games={[]} onSelect={() => {}} isLoading />);
    const box = screen.getByRole("listbox", { name: /로딩 중/ });
    expect(box).toBeInTheDocument();
    expect(box).toHaveAttribute("aria-busy", "true");
    expect(box).toHaveTextContent(/불러오는 중/);
  });

  it("games가 비어있으면 '결과가 없습니다' 메시지를 표시한다", () => {
    render(<SearchDropdown games={[]} onSelect={() => {}} />);
    expect(screen.getByText(/결과가 없습니다/)).toBeInTheDocument();
  });

  it("games 배열을 항목으로 렌더링한다 (F-02 썸네일+이름)", () => {
    const games = [mkGame("1"), mkGame("2"), mkGame("3")];
    render(<SearchDropdown games={games} onSelect={() => {}} />);
    expect(screen.getByRole("listbox", { name: /검색 결과/ })).toBeInTheDocument();
    expect(screen.getByText("Game 1")).toBeInTheDocument();
    expect(screen.getByText("Game 2")).toBeInTheDocument();
    expect(screen.getByText("Game 3")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("항목 클릭 시 onSelect가 해당 game 객체로 호출된다", () => {
    const handler = vi.fn();
    const games = [mkGame("1"), mkGame("2")];
    render(<SearchDropdown games={games} onSelect={handler} />);
    fireEvent.click(screen.getByText("Game 2"));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(games[1]);
  });

  it("thumbnailUrl이 비어있으면 이미지 대신 placeholder가 렌더링된다", () => {
    const games = [mkGame("1", { thumbnailUrl: "" })];
    const { container } = render(<SearchDropdown games={games} onSelect={() => {}} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("thumbnailUrl이 있으면 img 태그가 렌더링된다", () => {
    const games = [mkGame("1", { thumbnailUrl: "https://media.rawg.io/abc.jpg" })];
    const { container } = render(<SearchDropdown games={games} onSelect={() => {}} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
  });
});
