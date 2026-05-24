// 결과 화면 — Phase 3에서 우승자 카드(F-10)와 "새 토너먼트 시작" 버튼(F-13)을 조립한다.
// 현재는 placeholder 상태이며, 실제 구현은 Story #3 통합 PR에서 다룬다.

export default function ResultPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* 페이지 타이틀 */}
      <h1 className="text-3xl font-bold">Result</h1>

      {/* 임시 안내 — Phase 3 구현 시 ResultScreen으로 교체 */}
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        결과 화면 (F-10, F-13) — TODO: Phase 3 구현
      </p>
    </main>
  );
}
