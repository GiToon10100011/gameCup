"use client";

/**
 * Next.js 최적화 이미지 컴포넌트.
 * - width/height 명시 + 외부 도메인은 next.config 등록 필요
 */
import Image from "next/image";

/**
 * 스타일 variants — 컴포넌트 파일과 분리해 관리 (PR #64 리뷰).
 * 같은 폴더 형제 파일이지만 컨벤션(§5 Path alias)에 따라 `@/*`로 통일.
 */
import { dropdownVariants } from "@/components/search/SearchDropdown.variants";

/**
 * 도메인 게임 타입 — 검색 결과 한 건은 IGame으로 표현됨.
 */
import type { IGame } from "@/types/game";

/**
 * SearchDropdown 컴포넌트의 외부 인터페이스 (props 타입).
 * 컨벤션: 모든 `interface`는 `I` 접두사 필수.
 */
interface ISearchDropdownProps {
  /**
   * 표시할 게임 배열. 리뷰 피드백("복수형 대신 자료형 명시")에 따라 `gameArray`로 명명.
   * readonly로 받아 호출자 측 의도치 않은 변형을 차단.
   */
  gameArray: readonly IGame[];
  /** 항목 선택 시 부모로 통보 — 후보 등록 등 다음 단계를 부모가 결정 */
  onSelect: (game: IGame) => void;
  /** 진행 중 로딩 인디케이터 표시 여부 (외부 API 호출 중) */
  isLoading?: boolean;
  /** 드롭다운 자체의 열림/닫힘 — 외부 클릭 등으로 부모가 제어 */
  isOpen?: boolean;
}

/**
 * 검색 결과 드롭다운.
 *
 * 4가지 상태 분리 렌더링:
 *   - 닫힘: 아무것도 렌더하지 않음
 *   - 로딩 중: aria-busy=true로 보조 기술 안내
 *   - 빈 결과: 안내 문구
 *   - 결과 있음: listbox/option 패턴 (PR #74 리뷰: button 중첩 제거)
 *
 * ARIA 규칙: listbox > option 안에 별도 interactive descendant(button)을 두지 않는다.
 * option(<li>) 자체에 tabIndex·onClick·onKeyDown을 부여해 키보드/마우스 모두 처리.
 */
export function SearchDropdown({
  gameArray,
  onSelect,
  isLoading = false,
  isOpen = true,
}: ISearchDropdownProps) {
  /* 1) 부모가 닫음 — 아예 렌더링하지 않음 */
  if (!isOpen) return null;

  /* 2) slot 별 클래스 사전 계산 — JSX 가독성 + 재계산 비용 절감 */
  const { container, message, item, thumb, name } = dropdownVariants();

  /* 3) 로딩 상태 — aria-busy로 보조 기술에 진행 중임을 알린다 */
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

  /* 4) 빈 결과 — 사용자가 의미를 이해할 수 있도록 안내 문구 (검색어는 있으나 매치 없음) */
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

  /**
   * 5) 결과 있음 — listbox/option 패턴으로 접근성 확보.
   *    `<li role="option">` 자체에 키보드/클릭 핸들러를 부여 (button 중첩 제거).
   */
  return (
    <ul role="listbox" aria-label="검색 결과" className={container()}>
      {gameArray.map((game) => (
        <li
          key={game.id}
          role="option"
          aria-selected="false"
          tabIndex={0}
          className={item()}
          onClick={() => onSelect(game)}
          onKeyDown={(event) => {
            /* Enter/Space는 listbox option의 표준 선택 키 */
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect(game);
            }
          }}
        >
          {game.thumbnailUrl ? (
            /* 썸네일 있음 — Next.js Image로 lazy 로딩 + remote 도메인 (next.config 등록).
               unoptimized: RAWG 외부 URL을 최적화 파이프라인 없이 그대로 사용. */
            <Image
              src={game.thumbnailUrl}
              alt=""
              width={48}
              height={48}
              className={thumb({ thumbKind: "image" })}
              unoptimized
            />
          ) : (
            /* 썸네일 없음 — 동일 크기의 회색 placeholder로 레이아웃 일관성 유지 */
            <div
              aria-hidden="true"
              className={thumb({ thumbKind: "placeholder" })}
            />
          )}
          {/* 게임명 — 한 줄 노출, 길면 ellipsis는 부모 컨테이너에서 처리 가능 */}
          <span className={name()}>{game.name}</span>
        </li>
      ))}
    </ul>
  );
}
