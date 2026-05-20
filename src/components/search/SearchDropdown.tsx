"use client";

// Next.js 최적화 이미지 컴포넌트 — width/height 명시 + 외부 도메인은 next.config 등록 필요
import Image from "next/image";
// tailwind-variants — variant·slots 기반 스타일 모듈화. 4가지 상태에서 공통 외곽을 재사용하기 위해 도입.
// PR #64 리뷰 피드백("themes 정의 + 동적 스타일링") 반영.
import { tv } from "tailwind-variants";
// 도메인 게임 타입 — 검색 결과 한 건 한 건은 IGame으로 표현됨
import type { IGame } from "@/types/game";

// SearchDropdown 컴포넌트의 외부 인터페이스 (props 타입).
// 컨벤션: 모든 `interface`는 `I` 접두사 필수.
interface ISearchDropdownProps {
  // 표시할 게임 배열. 리뷰 피드백("복수형 대신 자료형 명시")에 따라 `gameArray`로 명명.
  // readonly로 받아 호출자 측 의도치 않은 변형을 차단.
  gameArray: readonly IGame[];
  // 항목 클릭 시 부모로 통보하는 콜백 — 후보 등록 등 다음 단계를 부모가 결정
  onSelect: (game: IGame) => void;
  // 진행 중 로딩 인디케이터 표시 여부 (외부 API 호출 중)
  isLoading?: boolean;
  // 드롭다운 자체의 열림/닫힘 — 외부 클릭 등으로 부모가 제어
  isOpen?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 스타일 정의 (tailwind-variants 기반 "themes")
// ─────────────────────────────────────────────────────────────────────────────
// slots: 컴포넌트 내부 영역별 클래스 키.
//   container : 외곽 박스 (4가지 상태 공통 모양 — 둥근 모서리·테두리·스크롤·다크 모드)
//   message   : 안내 문구용 패딩·텍스트 (로딩/빈 결과 상태에서 사용)
//   item      : 각 결과 행(<button>) — hover·focus 시각 피드백
//   thumb     : 썸네일 또는 placeholder 공통 크기(48×48)
//   name      : 게임명 텍스트
// variants.state: 닫힘은 null 반환이라 변형 대상이 아니지만, 로딩/빈/리스트 3종을 의도적으로 분기.
const dropdown = tv({
  slots: {
    container:
      "mt-2 max-h-72 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900",
    message: "px-4 py-3 text-sm text-neutral-500",
    item:
      "flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none dark:hover:bg-neutral-800 dark:focus:bg-neutral-800",
    thumb: "h-12 w-12 flex-none rounded",
    name: "text-sm font-medium text-neutral-800 dark:text-neutral-100",
  },
  variants: {
    // 썸네일이 있을 때만 object-cover, 없을 때는 회색 placeholder 배경.
    thumbKind: {
      image: { thumb: "object-cover" },
      placeholder: { thumb: "bg-neutral-200 dark:bg-neutral-800" },
    },
  },
});

/**
 * 검색 결과 드롭다운.
 * - 닫힘 / 로딩 중 / 빈 결과 / 결과 있음 4가지 상태를 분리해 렌더링
 * - 각 항목은 button으로 감싸 키보드 접근성 확보
 * - 썸네일이 없는 경우 placeholder div로 동일한 레이아웃 유지
 */
export function SearchDropdown({
  gameArray,
  onSelect,
  isLoading = false,
  isOpen = true,
}: ISearchDropdownProps) {
  // 1) 부모가 닫음 — 아예 렌더링하지 않음
  if (!isOpen) return null;

  // 2) slot 별 클래스 사전 계산 — JSX 가독성 확보 + 재계산 비용 절감
  const { container, message, item, thumb, name } = dropdown();

  // 3) 로딩 상태 — aria-busy로 보조 기술에 진행 중임을 알린다
  if (isLoading) {
    return (
      <div
        role="listbox"
        aria-label="게임 검색 결과 로딩 중"
        aria-busy="true"
        className={`${container()} ${message()}`}
      >
        불러오는 중...
      </div>
    );
  }

  // 4) 빈 결과 — 사용자가 의미를 이해할 수 있도록 안내 문구 (검색어 자체가 매치 없는 경우)
  if (gameArray.length === 0) {
    return (
      <div
        role="listbox"
        aria-label="검색 결과 없음"
        className={`${container()} ${message()}`}
      >
        결과가 없습니다.
      </div>
    );
  }

  // 5) 결과 있음 — listbox/option 패턴으로 접근성 확보
  return (
    <ul role="listbox" aria-label="검색 결과" className={container()}>
      {gameArray.map((game) => (
        // 각 항목 — option role + 키보드 포커스 가능한 button으로 클릭/엔터/스페이스 모두 지원
        <li key={game.id} role="option" aria-selected="false">
          <button type="button" onClick={() => onSelect(game)} className={item()}>
            {game.thumbnailUrl ? (
              // 썸네일 있음 — Next.js Image로 lazy 로딩 + remote 도메인 (next.config 등록)
              // unoptimized: RAWG 외부 URL을 Next.js 이미지 최적화 파이프라인 없이 그대로 사용
              <Image
                src={game.thumbnailUrl}
                alt=""
                width={48}
                height={48}
                className={thumb({ thumbKind: "image" })}
                unoptimized
              />
            ) : (
              // 썸네일 없음 — 동일 크기의 회색 placeholder로 레이아웃 일관성 유지
              <div
                aria-hidden="true"
                className={thumb({ thumbKind: "placeholder" })}
              />
            )}
            {/* 게임명 — 한 줄 노출, 길면 ellipsis는 부모 컨테이너에서 처리 가능 */}
            <span className={name()}>{game.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
