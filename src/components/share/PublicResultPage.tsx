"use client";

// 공개 결과 열람 클라이언트 컴포넌트 (F-20, UC-10 §기본흐름 링크열람).
// 비로그인 방문자가 공유 링크(/share/[shareId])로 접근했을 때 우승 게임 결과를 표시한다.
//
// 3계층 위치: Presentation
//   - Business 방향: tournamentStorageModule (getPublicResult)
//   - 인증 불필요 — 공개 읽기 전용 (RLS public_shares: using(true))

import { useEffect, useState } from "react";
import { tournamentStorageModule } from "@/modules/tournamentStorageModule";
import { publicResultPageVariants } from "./PublicResultPage.variants";
import type { IPublicShare } from "@/types/game";

interface IPublicResultPageProps {
  // URL 파라미터에서 넘어오는 공유 토큰 (32자 hex)
  shareId: string;
}

export function PublicResultPage({ shareId }: IPublicResultPageProps) {
  // 공유 결과 데이터
  const [share, setShare] = useState<IPublicShare | null>(null);
  // 로딩 중 여부
  const [isLoading, setIsLoading] = useState(true);
  // 조회 에러 (share 없음·만료 등)
  const [error, setError] = useState<string | null>(null);

  // 마운트 시 공유 결과 조회 (UC-10 §기본흐름 링크열람 2: getPublicResult 호출)
  useEffect(() => {
    let cancelled = false;

    async function loadShare() {
      try {
        const result = await tournamentStorageModule.getPublicResult(shareId);
        if (!cancelled) setShare(result);
      } catch {
        if (!cancelled) setError("결과를 찾을 수 없습니다.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadShare();
    return () => { cancelled = true; };
  }, [shareId]);

  const styles = publicResultPageVariants();

  // 로딩 중
  if (isLoading) {
    return (
      <main className={styles.container()}>
        <div className={styles.loadingContainer()}>
          <p className={styles.loadingText()}>결과 불러오는 중…</p>
        </div>
      </main>
    );
  }

  // 에러 (UC-10 §예외 2b: 존재하지 않거나 만료된 shareId)
  if (error || !share) {
    return (
      <main className={styles.container()}>
        <div className={styles.errorContainer()}>
          <p className={styles.errorTitle()}>결과를 찾을 수 없습니다.</p>
          <p className={styles.errorSubtitle()}>
            공유 링크가 만료됐거나 존재하지 않습니다.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container()}>
      {/* 공유 출처 배지 */}
      <span className={styles.badge()}>GameCup 공유 결과</span>

      {/* 우승자 카드 */}
      <section aria-label="공유 결과" className={styles.winnerSection()}>
        <p className={styles.winnerLabel()}>우승</p>
        {share.winner ? (
          <p className={styles.winnerName()}>{share.winner.name}</p>
        ) : (
          <p className={styles.noWinnerText()}>우승자 정보를 불러올 수 없습니다.</p>
        )}
        <p className={styles.sharedAt()}>
          공유됨: {new Date(share.createdAt).toLocaleDateString("ko-KR")}
        </p>
      </section>
    </main>
  );
}
