"use client";

// 결과 화면 클라이언트 컴포넌트 (F-10, F-13, F-19 · UC-09).
// stateStore에서 winner·activeTournament를 읽어 playout 완료 즉시 saveResult를 호출하고,
// listResults로 해당 토너먼트의 플레이 이력을 조회해 표시한다.
//
// 3계층 위치: Presentation
//   - Business 방향: tournamentStorageModule (saveResult·listResults), resultModule (startNewTournament)
//   - Store 구독: useStateStore (winner, activeTournament — TournamentLibrarySlice/play state)

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStateStore } from "@/store/stateStore";
import { tournamentStorageModule } from "@/modules/tournamentStorageModule";
import { startNewTournament } from "@/modules/resultModule";
import { resultPageVariants } from "./ResultPage.variants";
import type { ITournamentResult } from "@/types/game";

// 현재 origin을 안전하게 가져오는 헬퍼 — SSR 환경(window 미정의)에서 빈 문자열 반환
function getOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function ResultPage() {
  const router = useRouter();
  // 플레이 결과에서 읽는 상태들
  const winner = useStateStore((s) => s.winner);
  const activeTournament = useStateStore((s) => s.activeTournament);

  // 자동 저장 후 이력 목록
  const [results, setResults] = useState<ITournamentResult[]>([]);
  // 방금 저장된 결과 — 공유 링크 생성 시 resultId 공급원
  const [savedResult, setSavedResult] = useState<ITournamentResult | null>(null);
  // 저장 진행 중 여부
  const [isSaving, setIsSaving] = useState(false);
  // 저장·조회 에러
  const [saveError, setSaveError] = useState<string | null>(null);
  // StrictMode·재렌더 시 중복 저장 방지 — ref는 렌더를 유발하지 않아 안전하다
  const hasSavedRef = useRef(false);
  // 공유 링크 (생성 후 설정)
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  // 공유 링크 생성 진행 중
  const [isSharing, setIsSharing] = useState(false);
  // 공유 링크 생성 에러
  const [shareError, setShareError] = useState<string | null>(null);
  // 복사 성공 피드백 여부
  const [isCopied, setIsCopied] = useState(false);

  // 마운트 시 자동 저장 (UC-09 §기본 흐름 2: 시스템이 플레이 완료 결과를 자동 저장)
  // winner·activeTournament가 모두 설정된 경우에만 실행한다.
  useEffect(() => {
    if (!winner || !activeTournament || hasSavedRef.current) return;
    hasSavedRef.current = true;

    let cancelled = false;
    setIsSaving(true);

    async function saveAndLoad() {
      try {
        // F-19: 결과 저장 — tournamentId·winner·bracketSummary(미구현, null)
        const saved = await tournamentStorageModule.saveResult(activeTournament!.id, winner!, null);
        // 저장된 결과를 보관 — 공유 링크 생성 시 resultId 공급 (F-20 UC-10)
        if (!cancelled) setSavedResult(saved);
        // 저장 직후 이력 조회 — 방금 저장한 항목이 상단에 위치한다(played_at DESC)
        const history = await tournamentStorageModule.listResults(activeTournament!.id);
        if (!cancelled) setResults(history);
      } catch (e) {
        if (!cancelled) {
          setSaveError(e instanceof Error ? e.message : "결과 저장에 실패했습니다.");
        }
      } finally {
        if (!cancelled) setIsSaving(false);
      }
    }

    void saveAndLoad();
    return () => {
      cancelled = true;
    };
  }, [winner, activeTournament]);

  // 공유 링크 생성 — createPublicShare 호출 후 공개 URL을 화면에 표시 (F-20 UC-10 §기본흐름2)
  const handleShare = useCallback(async () => {
    if (!savedResult) return;
    setIsSharing(true);
    setShareError(null);
    try {
      const share = await tournamentStorageModule.createPublicShare(savedResult.id);
      setShareUrl(`${getOrigin()}/share/${share.shareId}`);
    } catch (e) {
      setShareError(e instanceof Error ? e.message : "공유 링크 생성에 실패했습니다.");
    } finally {
      setIsSharing(false);
    }
  }, [savedResult]);

  // URL 클립보드 복사 — 2초 후 피드백 초기화
  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [shareUrl]);

  // 새 토너먼트 시작 — 플레이 데이터 초기화 후 허브로 이동
  const handleNewTournament = useCallback(() => {
    startNewTournament();
    router.push("/");
  }, [router]);

  const styles = resultPageVariants();

  // 우승자·활성 토너먼트 없음 — 직접 URL 접근 또는 페이지 새로고침으로 store 유실
  if (!winner || !activeTournament) {
    return (
      <main className={styles.container()}>
        <div className={styles.emptyContainer()}>
          <p className={styles.emptyTitle()}>표시할 결과가 없어요.</p>
          <button
            type="button"
            className={styles.hubButton()}
            onClick={() => router.push("/")}
          >
            허브로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container()}>
      {/* 헤더 — 결과 타이틀 + 토너먼트 이름 */}
      <header className={styles.header()}>
        <h1 className={styles.title()}>결과</h1>
        <p className={styles.subtitle()}>{activeTournament.name}</p>
      </header>

      {/* 우승자 카드 — 황금 테두리로 강조 */}
      <section aria-label="우승자" className={styles.winnerSection()}>
        <p className={styles.winnerLabel()}>우승</p>
        <p className={styles.winnerName()}>{winner.name}</p>
        {/* 저장 중 표시 — 자동 저장 진행 상태 */}
        {isSaving && <p className={styles.savingText()}>결과 저장 중…</p>}
        {/* 에러 배너 — role=alert로 접근성 보장 */}
        {saveError && (
          <p role="alert" className={styles.errorText()}>
            {saveError}
          </p>
        )}
      </section>

      {/* 이력 섹션 — listResults 결과가 있을 때만 표시 */}
      {results.length > 0 && (
        <section aria-label="플레이 이력" className={styles.historySection()}>
          <h2 className={styles.historyTitle()}>이전 플레이 이력</h2>
          <ul className={styles.historyList()}>
            {results.map((r) => (
              <li key={r.id} className={styles.historyItem()}>
                <span className={styles.historyWinner()}>{r.winner.name}</span>
                <span className={styles.historyDate()}>
                  {new Date(r.playedAt).toLocaleDateString("ko-KR")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 공유 섹션 — 저장 완료 후 표시 (F-20 UC-10) */}
      {savedResult && (
        <div className={styles.shareSection()}>
          {/* 공유 링크가 아직 생성되지 않은 경우 생성 버튼 표시 */}
          {!shareUrl && (
            <button
              type="button"
              className={styles.shareButton()}
              onClick={() => void handleShare()}
              disabled={isSharing}
            >
              {isSharing ? "링크 생성 중…" : "공유 링크 생성"}
            </button>
          )}
          {/* 공유 에러 */}
          {shareError && (
            <p role="alert" className={styles.shareErrorText()}>
              {shareError}
            </p>
          )}
          {/* 생성된 공유 URL + 복사 버튼 */}
          {shareUrl && (
            <div>
              <div className={styles.shareUrlRow()}>
                <span className={styles.shareUrlText()}>{shareUrl}</span>
                <button
                  type="button"
                  className={styles.copyButton()}
                  onClick={() => void handleCopy()}
                >
                  {isCopied ? "복사됨!" : "복사"}
                </button>
              </div>
              {isCopied && (
                <p className={styles.copySuccessText()}>링크가 클립보드에 복사됐습니다.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 액션 — 새 토너먼트 시작 (F-13) */}
      <div className={styles.actions()}>
        <button
          type="button"
          className={styles.newButton()}
          onClick={handleNewTournament}
        >
          새 토너먼트 시작
        </button>
      </div>
    </main>
  );
}
