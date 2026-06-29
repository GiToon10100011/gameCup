"use client";

// RoundProgressIndicator — 라운드 진행 상황 표시 컴포넌트 (Task #33, F-07).
//
// 역할:
//   - 현재 라운드 번호 표시 (Task #36에서 "8강"·"4강" 등 명칭으로 교체 예정)
//   - 현재 라운드의 경기 진행 현황(N/M 경기) 표시
//   - 시각적 진행 막대(progress bar)로 완료율 표현
//   - 부전승(isBye) 경기는 사용자 경기 수에서 제외
//
// 3계층: Presentation — store를 직접 구독(currentRound, currentMatches)

import { useStateStore } from "@/store/stateStore";
import { roundProgressIndicatorVariants } from "./RoundProgressIndicator.variants";

export function RoundProgressIndicator() {
  const styles = roundProgressIndicatorVariants();

  // 진행 중인 라운드 번호와 현재 대결 목록을 구독
  const currentRound = useStateStore((s) => s.currentRound);
  const currentMatches = useStateStore((s) => s.currentMatches);

  // 라운드가 시작되지 않으면 미표시
  if (currentRound === 0 || currentMatches.length === 0) return null;

  // 부전승 제외 — 사용자가 직접 선택하는 경기 수만 카운트 (F-07 AC)
  const userMatches = currentMatches.filter((m) => !m.isBye);
  const totalMatches = userMatches.length;
  const completedMatches = userMatches.filter((m) => m.winner !== null).length;
  // 현재 경기 번호 — 완료 수 + 1 (1-based), 모두 완료 시 totalMatches를 넘지 않도록 클램프
  const currentMatchIndex = Math.min(completedMatches + 1, totalMatches);

  // 진행율(%) — progress bar width 계산
  const progressPct =
    totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  return (
    <div className={styles.root()} role="status" aria-label="라운드 진행 상황">
      {/* 라운드 레이블 + 경기 카운터 */}
      <div className={styles.infoRow()}>
        {/* Task #36에서 라운드 명칭 유틸로 교체 예정 */}
        <span className={styles.roundLabel()}>라운드 {currentRound}</span>
        <span className={styles.matchCounter()}>
          {currentMatchIndex}/{totalMatches} 경기
        </span>
      </div>

      {/* 진행 막대 */}
      <div className={styles.progressTrack()} aria-hidden="true">
        <div
          className={styles.progressFill()}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
