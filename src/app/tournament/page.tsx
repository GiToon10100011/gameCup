// 토너먼트 진행 화면 — Phase 2에서 1:1 대결 UI(MatchCard)와 라운드 자동 진행을 조립한다.
// 현재는 placeholder 상태이며, 실제 구현은 Story #6 통합 PR에서 다룬다.

export default function TournamentPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* 페이지 타이틀 */}
      <h1 className="text-3xl font-bold">Tournament</h1>

      {/* 임시 안내 — Phase 2 구현 시 MatchCard 등으로 교체 */}
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        토너먼트 진행 화면 (F-06~F-09) — TODO: Phase 2 구현
      </p>
    </main>
  );
}
