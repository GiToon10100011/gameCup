"use client";

// TournamentPage — 토너먼트 플레이 화면 (Task #27, F-06 시작 조건·시작 버튼).
//
// 역할:
//   - activeTournament를 기반으로 시작하기 버튼 활성화/비활성화 관리 (Task #27)
//   - 시작하기 클릭 → startTournament() 호출 → 첫 라운드 구성
//   - 진행 중 상태: 대결 UI placeholder (Task #31~#40 에서 MatchCard로 교체)
//   - 완료 상태: winner 설정 시 /result로 전환 (Task #37에서 정교화)
//   - activeTournament 없이 직접 URL 접근 시 허브(/)로 리다이렉트
//
// 3계층: Presentation → Business(tournamentModule) → Store(stateStore)

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStateStore } from "@/store/stateStore";
import { startTournament } from "@/modules/tournamentModule";
import { tournamentPageVariants } from "./TournamentPage.variants";

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

      {/* 진행 중 — Task #31~#40 에서 MatchCard·진행 표시로 교체 */}
      {currentMatches.length > 0 && winner === null && (
        <section
          className={styles.inProgressSection()}
          aria-label="토너먼트 진행 중"
        >
          <p className={styles.inProgressText()}>
            토너먼트 진행 중… (대결 UI 구현 예정)
          </p>
        </section>
      )}
    </main>
  );
}
