"use client";

// 메인 허브 페이지 컴포넌트 (F-17 목록·관리).
// 로그인 사용자의 토너먼트 목록을 조회해 카드 형태로 표시한다.
// 각 카드에서 토너먼트를 선택(시작하기)하거나 삭제할 수 있다.
// 빈 상태에서는 새 토너먼트 생성 CTA를 노출한다 (Task #122에서 OnboardingEmptyState로 확장).
//
// 3계층 위치: Presentation
//   - Business 방향: tournamentStorageModule (list/get/deleteTournament)
//   - Store 구독: useStateStore (myTournaments — TournamentLibrarySlice)

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStateStore } from "@/store/stateStore";
import { tournamentStorageModule } from "@/modules/tournamentStorageModule";
import { hubPageVariants } from "./HubPage.variants";
import { OnboardingEmptyState } from "./OnboardingEmptyState";

export function HubPage() {
  const router = useRouter();
  // TournamentLibrarySlice 구독 — listMyTournaments() 성공 후 채워지는 캐시
  const myTournaments = useStateStore((s) => s.myTournaments);

  // 초기 목록 조회 중 여부 — 마운트 직후 true, listMyTournaments 완료/실패 후 false
  const [isLoading, setIsLoading] = useState(true);
  // API 에러 메시지 — null이면 정상 상태
  const [error, setError] = useState<string | null>(null);
  // 시작하기 진행 중인 토너먼트 id — null이면 선택 전
  const [selectingId, setSelectingId] = useState<string | null>(null);
  // 삭제 진행 중인 토너먼트 id — null이면 삭제 전
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 마운트 시 목록 조회 — listMyTournaments()가 stateStore.setList()를 호출해 캐시를 채운다
  useEffect(() => {
    // 언마운트 전 비동기 결과 반영 방지 플래그
    let cancelled = false;

    async function load() {
      try {
        await tournamentStorageModule.listMyTournaments();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "목록 조회에 실패했습니다.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // 시작하기 — getTournament로 후보를 불러와 activeTournament에 설정 후 /tournament로 이동.
  // resetAll로 이전 플레이 세션 상태(winner·currentMatches 등)를 초기화해 TournamentPage가
  // 이전 winner를 감지해 /result로 튕기지 않도록 방어한다 (Task #30).
  const handlePlay = useCallback(
    async (id: string) => {
      setSelectingId(id);
      setError(null);
      try {
        await tournamentStorageModule.getTournament(id);
        // activeTournament를 보존(F-13)하면서 play state만 초기화
        useStateStore.getState().resetAll();
        router.push("/tournament");
      } catch (e) {
        setError(e instanceof Error ? e.message : "토너먼트 불러오기에 실패했습니다.");
        setSelectingId(null);
      }
    },
    [router],
  );

  // 삭제 — deleteTournament 호출 후 스토어 캐시도 자동 갱신됨 (tournamentStorageModule 내부)
  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await tournamentStorageModule.deleteTournament(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }, []);

  const styles = hubPageVariants();

  // 목록 조회 중 — 로딩 인디케이터만 표시
  if (isLoading) {
    return (
      <main className={styles.container()}>
        <div className={styles.loadingContainer()}>
          <p className={styles.loadingText()}>목록을 불러오는 중…</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container()}>
      {/* 헤더 — 페이지 타이틀 + 부제목 */}
      <header className={styles.header()}>
        <h1 className={styles.title()}>내 토너먼트</h1>
        <p className={styles.subtitle()}>
          저장된 토너먼트를 선택해 플레이하거나 삭제할 수 있어요.
        </p>
      </header>

      {/* 에러 배너 — API 실패 시 role=alert로 접근성 지원 */}
      {error && (
        <p role="alert" className={styles.errorText()}>
          {error}
        </p>
      )}

      {/* 목록 또는 빈 상태 — 토너먼트 유무에 따라 분기 (UC-08) */}
      {myTournaments.length === 0 ? (
        /* 빈 상태 — OnboardingEmptyState(F-18) 컴포넌트로 위임 */
        <OnboardingEmptyState />
      ) : (
        <>
          {/* 목록 상단 — 새 토너먼트 만들기 버튼 */}
          <div className={styles.listHeader()}>
            <Link href="/create" className={styles.newButton()}>
              + 새 토너먼트
            </Link>
          </div>

          {/* 토너먼트 카드 목록 */}
          <ul className={styles.grid()} aria-label="토너먼트 목록">
            {myTournaments.map((t) => (
              <li key={t.id} className={styles.card()}>
                {/* 카드 헤더 — 토너먼트 이름 */}
                <div className={styles.cardHeader()}>
                  <h2 className={styles.cardName()}>{t.name}</h2>
                </div>

                {/* 메타 정보 — 후보 개수 + 생성일 */}
                <div className={styles.cardMeta()}>
                  <span className={styles.cardMetaItem()}>
                    🎮 후보 {t.candidates.length}개
                  </span>
                  <span className={styles.cardMetaItem()}>
                    {new Date(t.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>

                {/* 카드 액션 — 시작하기 + 삭제 */}
                <div className={styles.cardActions()}>
                  <button
                    type="button"
                    className={styles.playButton()}
                    onClick={() => void handlePlay(t.id)}
                    disabled={selectingId === t.id || deletingId === t.id}
                    aria-busy={selectingId === t.id}
                  >
                    {selectingId === t.id ? "불러오는 중…" : "시작하기"}
                  </button>
                  <button
                    type="button"
                    className={styles.deleteButton()}
                    onClick={() => void handleDelete(t.id)}
                    disabled={deletingId === t.id || selectingId === t.id}
                    aria-busy={deletingId === t.id}
                    aria-label={`${t.name} 삭제`}
                  >
                    {deletingId === t.id ? "삭제 중…" : "삭제"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
