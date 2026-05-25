// ─────────────────────────────────────────────────────────────────────────────
// Vitest API import — 각 심볼의 역할 (학습용 주석)
// ─────────────────────────────────────────────────────────────────────────────
//   afterEach : 같은 describe 안의 각 it() 실행 직후 호출되는 라이프사이클 훅. 정리(teardown) 용.
//   describe  : 관련된 테스트들을 하나의 그룹으로 묶는 컨테이너. 보고서에서 트리 형태로 표시됨.
//   expect    : 단언(assertion) 함수. 실제 값(value) → matcher(toBe, toEqual …)로 기대를 표현.
//   it        : 개별 테스트 케이스. (별칭 test). 동기/비동기 함수를 인자로 받음.
//   vi        : Vitest의 모킹/스파이 네임스페이스. `vi.fn()`은 호출 추적 가능한 더미 함수 생성.
import { afterEach, describe, expect, it, vi } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// React Testing Library — 각 유틸의 역할 (학습용 주석)
// ─────────────────────────────────────────────────────────────────────────────
//   cleanup   : 이전 render의 DOM을 언마운트. 같은 파일 안 다음 테스트에 영향을 주지 않게 함.
//   fireEvent : DOM 이벤트를 직접 디스패치 (click·change 등). userEvent보다 저수준이라 빠르지만,
//               포커스·키 시퀀스 같은 사용자 경험까지 시뮬레이트하지 않는다.
//   render    : 컴포넌트를 가상 DOM에 마운트. `container`(root) 와 `unmount` 등을 반환.
//   screen    : render 후 전역적으로 접근 가능한 쿼리 모음 (getByRole, getByText …).
//               접근성(role/aria-label) 기반 쿼리를 우선 사용해 실제 사용자 흐름과 비슷하게 검증.
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
  // 한 테스트의 DOM이 다음 테스트로 새지 않도록 정리.
  // afterEach 자체는 "각 it() 종료 직후" 자동 호출되는 라이프사이클 훅.
  afterEach(() => cleanup());

  it("isOpen=false면 아무것도 렌더링하지 않는다", () => {
    // 부모가 외부 클릭으로 드롭다운을 닫은 경우 — DOM에 그 어떤 child도 노출되어선 안 됨.
    // render(...)는 가상 DOM에 마운트하고 root container를 돌려준다.
    const { container } = render(
      <SearchDropdown gameArray={[]} onSelect={() => {}} isOpen={false} />,
    );
    // `container.firstChild === null`은 렌더 결과가 비었음을 의미.
    expect(container.firstChild).toBeNull();
  });

  it("isLoading=true면 로딩 메시지를 listbox로 표시한다", () => {
    // 외부 API 호출 진행 중 — aria-busy로 보조 기술에 신호.
    render(<SearchDropdown gameArray={[]} onSelect={() => {}} isLoading />);
    // getByRole(...) : ARIA role 기준으로 요소를 찾는다. name은 aria-label/innerText 매칭.
    const box = screen.getByRole("listbox", { name: /로딩 중/ });
    // toBeInTheDocument: jest-dom 제공 매처. 노드가 실제로 마운트되어 있는지 확인.
    expect(box).toBeInTheDocument();
    // toHaveAttribute: jest-dom 매처. 속성·값 페어를 단언.
    expect(box).toHaveAttribute("aria-busy", "true");
    // toHaveTextContent: 정규식·문자열 모두 받아 부분 일치 검사.
    expect(box).toHaveTextContent(/불러오는 중/);
  });

  it("gameArray가 비어있으면 '결과가 없습니다' 메시지를 표시한다", () => {
    // 검색어는 있으나 매치 결과 0건 — 사용자에게 명확히 알림.
    render(<SearchDropdown gameArray={[]} onSelect={() => {}} />);
    // getByText: 텍스트 내용으로 요소 검색. 안 보이면 즉시 throw → fail.
    expect(screen.getByText(/결과가 없습니다/)).toBeInTheDocument();
  });

  it("gameArray를 항목으로 렌더링한다 (F-02 썸네일+이름)", () => {
    // 3건 결과 — listbox 컨테이너 + option 3개가 정확히 노출되어야 함.
    const gameArray = [mkGame("1"), mkGame("2"), mkGame("3")];
    render(<SearchDropdown gameArray={gameArray} onSelect={() => {}} />);
    expect(screen.getByRole("listbox", { name: /검색 결과/ })).toBeInTheDocument();
    expect(screen.getByText("Game 1")).toBeInTheDocument();
    expect(screen.getByText("Game 2")).toBeInTheDocument();
    expect(screen.getByText("Game 3")).toBeInTheDocument();
    // getAllByRole: 동일 role을 가진 모든 요소를 배열로 반환.
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("항목 클릭 시 onSelect가 해당 game 객체로 호출된다", () => {
    // 부모는 후보 등록·상세 보기 등 다음 단계를 결정 — 본 컴포넌트는 위임만 한다.
    // vi.fn(): 호출 횟수·인자를 추적 가능한 mock 함수 생성.
    const handler = vi.fn();
    const gameArray = [mkGame("1"), mkGame("2")];
    render(<SearchDropdown gameArray={gameArray} onSelect={handler} />);
    // fireEvent.click: 합성 click 이벤트 디스패치. 실제 키보드 흐름은 시뮬레이트 안 함.
    fireEvent.click(screen.getByText("Game 2"));
    // toHaveBeenCalledTimes / toHaveBeenCalledWith: vi.fn() 호출 검증 매처.
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(gameArray[1]);
  });

  it("항목에서 Enter/Space 키 입력 시 onSelect가 호출된다 (키보드 선택 경로)", () => {
    // listbox/option 패턴은 키보드 사용자도 마우스와 동일하게 선택할 수 있어야 한다(접근성).
    // <li role="option">이 onKeyDown으로 Enter·Space를 모두 표준 선택 키로 처리하므로 둘 다 검증.
    const handler = vi.fn();
    const gameArray = [mkGame("1"), mkGame("2")];
    render(<SearchDropdown gameArray={gameArray} onSelect={handler} />);
    const options = screen.getAllByRole("option");

    // Enter — 첫 항목 선택
    fireEvent.keyDown(options[0], { key: "Enter" });
    expect(handler).toHaveBeenNthCalledWith(1, gameArray[0]);

    // Space(" ") — 둘째 항목 선택. preventDefault로 스크롤이 발생하지 않아야 하지만
    // 여기서는 onSelect 위임 자체를 핵심 계약으로 검증한다.
    fireEvent.keyDown(options[1], { key: " " });
    expect(handler).toHaveBeenNthCalledWith(2, gameArray[1]);

    // 다른 키(예: 화살표)는 선택을 트리거하지 않아야 함 — 회귀 방지
    fireEvent.keyDown(options[0], { key: "ArrowDown" });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("thumbnailUrl이 비어있으면 이미지 대신 placeholder가 렌더링된다", () => {
    // 빈 썸네일 — Next.js Image의 빈 src 에러를 피하기 위해 placeholder div로 대체.
    const gameArray = [mkGame("1", { thumbnailUrl: "" })];
    const { container } = render(
      <SearchDropdown gameArray={gameArray} onSelect={() => {}} />,
    );
    // querySelector: 표준 DOM API. role 기반 쿼리가 어려운 케이스에서 보조적으로 사용.
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("thumbnailUrl이 있으면 img 태그가 렌더링된다", () => {
    // 정상 썸네일 URL이 있으면 Next.js Image가 결국 <img> 태그로 렌더링.
    const gameArray = [mkGame("1", { thumbnailUrl: "https://media.rawg.io/abc.jpg" })];
    const { container } = render(
      <SearchDropdown gameArray={gameArray} onSelect={() => {}} />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
  });
});
