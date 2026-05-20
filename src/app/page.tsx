// 메인(검색 + 후보 등록) 화면 — Phase 1에서 SearchInput·SearchDropdown·CandidateList를 조립한다.
// 현재는 placeholder 상태이며, 실제 사용자 흐름 통합은 Story #5/#7 PR에서 다룬다.

export default function HomePage() {
  // 페이지 컨테이너 — 본문 폭 제한 + 좌우 여백 + 상하 padding
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* 페이지 타이틀 */}
      <h1 className="text-3xl font-bold">GameCup</h1>

      {/* 임시 안내 문구 — Phase 1 구현 시 SearchInput/SearchDropdown/CandidateList로 교체 예정 */}
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        검색 + 후보 등록 화면 (F-01~F-05, F-11~F-12) — TODO: Phase 1 구현
      </p>
    </main>
  );
}
