"use client";

// CreatePage (Task #116, F-16) — 토너먼트 생성 화면.
// 기존 검색·후보 컴포넌트를 재사용하고, 이름 입력 + 저장 배선을 추가한다.
//
// 역할:
//   - SearchInput·SearchDropdown·CandidateList·DuplicateToast 재사용 (Epic #1 컴포넌트)
//   - 토너먼트 이름 입력 (필수)
//   - 저장 버튼 — 후보 2개 미만이거나 이름이 비면 비활성화(guard)
//   - tournamentStorageModule.createTournament 호출 → 성공 시 허브로 이동
//
// 3계층: Presentation → Business(tournamentStorageModule) → Data(supabaseClient)

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/search/SearchInput";
import { SearchDropdown } from "@/components/search/SearchDropdown";
import { CandidateList } from "@/components/candidate/CandidateList";
import { DuplicateToast } from "@/components/candidate/DuplicateToast";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { useCandidates } from "@/hooks/useCandidates";
import { addToPool } from "@/modules/candidateModule";
import { tournamentStorageModule } from "@/modules/tournamentStorageModule";
import { createPageVariants } from "./CreatePage.variants";
import type { IGame } from "@/types/game";

export function CreatePage() {
  const router = useRouter();
  const {
    container, header, title, subtitle,
    divider, nameSection, nameLabel, nameInput,
    saveSection, saveButton, errorText, warningText,
  } = createPageVariants();

  // ── 검색 상태 ────────────────────────────────────────────────────────────────
  // 디바운싱된 검색어 — SearchInput이 통보한다
  const [query, setQuery] = useState("");
  // 드롭다운 열림 상태
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // 중복 등록 토스트 열림 상태
  const [isToastOpen, setIsToastOpen] = useState(false);

  // 검색 결과 (TanStack Query 래핑)
  const { data: results = [], isLoading } = useSearchQuery(query);

  // ── 후보 상태 ────────────────────────────────────────────────────────────────
  // 현재 등록된 후보 목록 — 버튼 guard와 createTournament 인자로 사용
  const candidates = useCandidates();

  // ── 토너먼트 이름 상태 ────────────────────────────────────────────────────────
  const [tournamentName, setTournamentName] = useState("");

  // ── 저장 상태 ────────────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── 검색 핸들러 ──────────────────────────────────────────────────────────────

  // 디바운싱된 검색어 수신 — 비어있지 않을 때만 드롭다운을 연다
  const handleDebouncedChange = useCallback((next: string) => {
    setQuery(next);
    setIsDropdownOpen(next.length > 0);
  }, []);

  // 결과 선택 — 중복이면 토스트, 성공이면 드롭다운 닫음
  const handleSelect = useCallback((game: IGame) => {
    const result = addToPool(game);
    if (result.ok) {
      setIsDropdownOpen(false);
    } else if (result.reason === "duplicate") {
      setIsToastOpen(true);
      setIsDropdownOpen(false);
    }
  }, []);

  const handleToastClose = useCallback(() => setIsToastOpen(false), []);

  // ── 저장 핸들러 ──────────────────────────────────────────────────────────────

  // 저장 버튼 활성화 조건: 이름 입력 + 후보 2개 이상 + 저장 중 아님
  const canSave =
    tournamentName.trim().length > 0 &&
    candidates.length >= 2 &&
    !isSaving;

  // createTournament 호출 → 성공 시 허브(/)로 이동
  // WHY: HubPage(Task #120)가 구현되면 /hub로 교체. 현재는 메인(/)로 이동해
  // 사용자가 정상 흐름을 확인할 수 있게 한다.
  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await tournamentStorageModule.createTournament(
        tournamentName.trim(),
        candidates,
      );
      // 저장 성공 → 허브(메인)로 이동
      router.replace("/");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [canSave, tournamentName, candidates, router]);

  return (
    <main className={container()}>
      {/* 페이지 헤더 */}
      <header className={header()}>
        <h1 className={title()}>새 토너먼트 만들기</h1>
        <p className={subtitle()}>
          게임을 검색해 후보로 등록하고, 토너먼트 이름을 붙여 저장하세요.
        </p>
      </header>

      {/* 검색 영역 — SearchInput + (오버레이) SearchDropdown */}
      <section aria-label="게임 검색" className="relative">
        <SearchInput onDebouncedChange={handleDebouncedChange} />
        <div className="absolute inset-x-0 top-full z-20">
          <SearchDropdown
            gameArray={results}
            onSelect={handleSelect}
            isLoading={isLoading}
            isOpen={isDropdownOpen}
          />
        </div>
      </section>

      {/* API 오류 배너 */}
      <div className="mt-4">
        <ErrorMessage />
      </div>

      {/* 후보 목록 */}
      <section aria-label="후보 목록" className="mt-8">
        <h2 className="mb-3 flex items-baseline gap-2 text-lg font-semibold text-white">
          후보 목록
          <span className="text-sm font-normal text-[#888888]">
            {candidates.length}개
          </span>
        </h2>
        <CandidateList />
      </section>

      <div className={divider()} />

      {/* 토너먼트 이름 입력 */}
      <section className={nameSection()} aria-label="토너먼트 이름 입력">
        <label htmlFor="tournament-name" className={nameLabel()}>
          토너먼트 이름
        </label>
        <input
          id="tournament-name"
          type="text"
          className={nameInput()}
          placeholder="예: 2024 최애 FPS 게임"
          value={tournamentName}
          onChange={(e) => setTournamentName(e.target.value)}
          disabled={isSaving}
          maxLength={80}
          aria-describedby={saveError ? "save-error" : undefined}
        />
      </section>

      {/* 저장 버튼 */}
      <div className={saveSection()}>
        <button
          type="button"
          className={saveButton()}
          onClick={handleSave}
          disabled={!canSave}
          aria-busy={isSaving}
        >
          {isSaving ? "저장 중…" : "토너먼트 저장"}
        </button>

        {/* 후보 2개 미만 경고 */}
        {candidates.length < 2 && (
          <p className={warningText()}>
            후보를 2개 이상 등록해야 저장할 수 있어요.
          </p>
        )}

        {/* 저장 에러 메시지 */}
        {saveError && (
          <p id="save-error" className={errorText()} role="alert">
            {saveError}
          </p>
        )}
      </div>

      {/* 중복 등록 토스트 */}
      <DuplicateToast open={isToastOpen} onClose={handleToastClose} />
    </main>
  );
}
