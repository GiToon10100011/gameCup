"use client";

// TournamentPage — 토너먼트 플레이 화면 (Task #27 시작 버튼, Task #32 선택 핸들러).
//
// 역할:
//   - activeTournament를 기반으로 시작하기 버튼 활성화/비활성화 관리 (Task #27)
//   - 시작하기 클릭 → startTournament() 호출 → 첫 라운드 구성
//   - 진행 중: MatchCard로 현재 미결 대결을 표시 + 선택 핸들러 배선 (Task #32)
//   - NF-02: 선택 처리 시 store 최신 상태로 이중 선택 방지 (Task #32)
//   - 완료 상태: winner 설정 시 /result로 전환 (Task #37에서 정교화)
//   - activeTournament 없이 직접 URL 접근 시 허브(/)로 리다이렉트
//
// 3계층: Presentation → Business(tournamentModule) → Store(stateStore)

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStateStore } from "@/store/stateStore";
import { startTournament, selectWinner } from "@/modules/tournamentModule";
import { MatchCard } from "./MatchCard";
import { tournamentPageVariants } from "./TournamentPage.variants";
import type { IGame, ITournamentPair } from "@/types/game";

export function TournamentPage() {
  const router = useRouter();
  const styles = tournamentPageVariants();

  // 스토어 상태 구독 — 시작 버튼 활성화 조건 계산에 사용
  const activeTournament = useStateStore((s) => s.activeTournament);
  const currentMatches = useStateStore((s) => s.currentMatches);
  const winner = useStateStore((s) => s.winner);

  // activeTournament 없이 진입 시 허브로 리다이렉트 — 직접 URL 접근 방어
  useEffect(() => {
    if (!activeTournament) {
      router.replace("/");
    }
  }, [activeTournament, router]);

  // winner 확정 시 결과 화면으로 전환 (F-10 트리거, Task #37에서 정교화)
  useEffect(() => {
    if (winner !== null) {
      router.replace("/result");
    }
  }, [winner, router]);

  // 시작하기 버튼 활성화 조건 (Task #27 핵심 로직):
  //   - activeTournament 유효 (허브에서 선택 완료)
  //   - 후보 2개 이상 (생성 시 보장되지만 방어적 검사)
  //   - 아직 라운드가 시작되지 않음 (currentMatches === 0)
  //   - 우승자 미확정 (winner === null)
  const canStart =
    activeTournament !== null &&
    activeTournament.candidates.length >= 2 &&
    currentMatches.length === 0 &&
    winner === null;

  // "시작하기" 클릭 핸들러 — startTournament가 activeTournament.candidates를 사용해 첫 라운드를 구성
  const handleStart = useCallback(() => {
    if (!canStart) return;
    startTournament();
  }, [canStart]);

  // 현재 라운드의 미결 대결 — 부전승은 이미 자동 처리되므로 제외 (Task #32)
  const currentMatch: ITournamentPair | null =
    currentMatches.find((m) => m.winner === null && !m.isBye) ?? null;

  // 게임 선택 핸들러 (Task #32, NF-02 이중 선택 방지)
  // WHY: store를 직접 조회해 React 렌더 사이클과 무관하게 최신 winner 상태를 확인한다.
  // 연속 클릭 시 첫 번째 selectWinner 호출로 store가 갱신되므로 두 번째 호출은 차단된다.
  const handleSelect = useCallback((pair: ITournamentPair, game: IGame) => {
    const latestPair = useStateStore.getState().currentMatches.find(
      (m) => m.gameA.id === pair.gameA.id,
    );
    // 이미 winner가 확정된 페어 재선택 방지
    if (!latestPair || latestPair.winner !== null) return;
    selectWinner(pair, game);
  }, []);

  // activeTournament 없으면 리다이렉트 진행 중 — 빈 화면 반환
  if (!activeTournament) return null;

  return (
    <main className={styles.container()}>
      {/* 토너먼트 정보 헤더 */}
      <header className={styles.header()}>
        <h1 className={styles.title()}>{activeTournament.name}</h1>
        <p className={styles.subtitle()}>
          후보 {activeTournament.candidates.length}개
        </p>
      </header>

      {/* 시작 전 — 시작하기 버튼 (canStart 조건 만족 시 활성) */}
      {currentMatches.length === 0 && winner === null && (
        <section className={styles.startSection()} aria-label="토너먼트 시작">
          <button
            type="button"
            className={styles.startButton()}
            onClick={handleStart}
            disabled={!canStart}
            aria-label="토너먼트 시작하기"
          >
            시작하기
          </button>

          {/* 후보 부족 경고 — 정상 흐름에선 미노출, guard 방어용 */}
          {activeTournament.candidates.length < 2 && (
            <p className={styles.warningText()}>
              후보가 2개 이상 필요합니다.
            </p>
          )}
        </section>
      )}

      {/* 진행 중 — MatchCard로 현재 미결 대결 표시 (Task #32) */}
      {currentMatches.length > 0 && winner === null && (
        <section
          className={styles.inProgressSection()}
          aria-label="토너먼트 진행 중"
        >
          {currentMatch ? (
            /* 미결 대결이 있으면 MatchCard 렌더 */
            <MatchCard
              pair={currentMatch}
              onSelect={(game) => handleSelect(currentMatch, game)}
            />
          ) : (
            /* 모든 대결 완료 — Task #35에서 advanceRound() 자동 호출로 교체 */
            <p className={styles.inProgressText()}>
              라운드 완료, 다음 라운드 준비 중…
            </p>
          )}
        </section>
      )}
    </main>
  );
}
