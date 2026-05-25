"use client";

// 메인 화면 (Epic #1 통합) — 검색 → 후보 등록 → 중복 토스트 → 오류 배너 → 삭제의
// 전체 사용자 흐름을 한 페이지로 조립한다. Story #5·#6·#7·#8에서 만든 컴포넌트/훅/모듈을
// 배선만 담당하고, 페이지 자체는 도메인 로직을 갖지 않는다(3계층 준수):
//   - 검색 입력/표시 : SearchInput → useSearchQuery(Business 브릿지) → SearchDropdown
//   - 후보 등록      : addToPool(Business) — 결과로 성공/중복 분기
//   - 후보 목록/삭제 : CandidateList(useCandidates 구독 + removeFromPool 기본 배선)
//   - 오류 안내      : ErrorMessage(useApiError 구독)
//   - 중복 알림      : DuplicateToast(로컬 state로 제어하는 일시적 토스트)
//
// 디자인 기준: docs/03-design/DESIGN.md(getdesign `clickhouse`). 페이지 셸은 4px 간격 스케일·
// 타이포 위계·radius 등 구조 토큰을 따르고, 팔레트는 이미 머지·리뷰된 자식 컴포넌트들과
// 동일하게 neutral 라이트/다크 모드로 통일한다(컴포넌트 재색칠은 본 통합 범위 밖).

import { useCallback, useState } from "react";
import { SearchInput } from "@/components/search/SearchInput";
import { SearchDropdown } from "@/components/search/SearchDropdown";
import { CandidateList } from "@/components/candidate/CandidateList";
import { DuplicateToast } from "@/components/candidate/DuplicateToast";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { useCandidates } from "@/hooks/useCandidates";
import { addToPool } from "@/modules/candidateModule";
import type { IGame } from "@/types/game";

export default function HomePage() {
  // 1) 디바운싱된 검색어 — SearchInput이 통보한다. useSearchQuery의 입력이자 드롭다운 노출 조건.
  const [query, setQuery] = useState("");
  // 2) 드롭다운 열림 상태 — 검색어가 있으면 열고, 후보 선택 직후 닫는다
  //    ("추가 후 드롭다운 닫힘" = Story #7 수용 기준. 개별 Task에서 보류돼 본 통합에서 배선).
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // 3) 중복 등록 토스트 열림 상태 — 일시적(transient) 알림이라 store가 아닌 로컬 state로 제어(#19).
  const [isToastOpen, setIsToastOpen] = useState(false);

  // 4) 검색 실행 — TanStack Query 래핑 훅(Business 브릿지). 결과 미정 시 빈 배열로 폴백한다.
  const { data: results = [], isLoading } = useSearchQuery(query);

  // 5) 후보 목록 — 헤더의 개수 표시에만 사용한다(목록 렌더·삭제는 CandidateList가 자체 구독해 담당).
  const candidates = useCandidates();

  // 6) 디바운싱된 검색어 수신 — 비어있지 않을 때만 드롭다운을 연다.
  //    useCallback으로 정체성을 고정해 SearchInput의 통보 effect가 매 렌더 재실행되지 않게 한다.
  const handleDebouncedChange = useCallback((next: string) => {
    setQuery(next);
    setIsDropdownOpen(next.length > 0);
  }, []);

  // 7) 결과 항목 선택 — Business(addToPool)에 위임하고 반환 결과로 UX를 분기한다.
  //    성공: 드롭다운만 닫음 / 중복: 토스트를 띄우고 드롭다운도 닫음(선택은 이미 처리된 셈).
  const handleSelect = useCallback((game: IGame) => {
    const result = addToPool(game);
    if (result.ok) {
      setIsDropdownOpen(false);
    } else if (result.reason === "duplicate") {
      setIsToastOpen(true);
      setIsDropdownOpen(false);
    }
  }, []);

  // 8) 토스트 닫힘 — DuplicateToast의 자동(타이머)/수동 닫힘 콜백에서 호출된다.
  const handleToastClose = useCallback(() => setIsToastOpen(false), []);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      {/* 헤더 — 서비스명 + 한 줄 안내 */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">GameCup</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          게임을 검색해 후보로 등록하고, 토너먼트로 취향을 가려보세요.
        </p>
      </header>

      {/* 검색 영역 — 입력창 + (오버레이) 드롭다운.
          relative 래퍼 + absolute top-full 드롭다운으로 결과가 아래 후보 목록을 밀어내지 않게 한다. */}
      <section aria-label="게임 검색" className="relative">
        <SearchInput onDebouncedChange={handleDebouncedChange} />
        {/* 드롭다운은 입력창 바로 아래(top-full)에 띄워 다른 콘텐츠 위로 겹치게 한다 */}
        <div className="absolute inset-x-0 top-full z-20">
          <SearchDropdown
            gameArray={results}
            onSelect={handleSelect}
            isLoading={isLoading}
            isOpen={isDropdownOpen}
          />
        </div>
      </section>

      {/* 오류 배너 — API 실패 시 useApiError 구독으로 자동 표시(F-11). 정상 시 아무것도 렌더 안 함. */}
      <div className="mt-4">
        <ErrorMessage />
      </div>

      {/* 후보 목록 영역 — 제목 + 현재 개수 + 목록(각 행에 삭제 버튼 포함). */}
      <section aria-label="후보 목록" className="mt-8">
        <h2 className="mb-3 flex items-baseline gap-2 text-lg font-semibold">
          후보 목록
          {/* 현재 등록된 후보 개수 — 토너먼트 시작 가능 여부(≥2)를 사용자가 가늠하는 보조 정보 */}
          <span className="text-sm font-normal text-neutral-500">{candidates.length}개</span>
        </h2>
        <CandidateList />
      </section>

      {/* 중복 등록 토스트 — 하단 중앙 고정(컴포넌트가 fixed 처리). open일 때만 렌더된다. */}
      <DuplicateToast open={isToastOpen} onClose={handleToastClose} />
    </main>
  );
}
