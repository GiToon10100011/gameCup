"use client";

// 허브 빈 상태 온보딩 컴포넌트 (F-18 · UC-08).
// myTournaments.length === 0인 HubPage에서 렌더된다.
// "첫 토너먼트 만들기" CTA를 클릭하면 /create(CreatePage)로 이동해 UC-06 흐름으로 연결된다.
//
// 3계층 위치: Presentation — HubPage에서 조건부 렌더
//   라우팅은 next/link(Link)를 통해 CSR 방식으로 처리

import Link from "next/link";
import { onboardingEmptyStateVariants } from "./OnboardingEmptyState.variants";

export function OnboardingEmptyState() {
  const styles = onboardingEmptyStateVariants();

  return (
    // UC-08 §사전조건: HubPage에서 myTournaments.length === 0이 감지된 상태
    <div className={styles.container()}>
      {/* 트로피 아이콘 — GameCup 서비스 정체성 시각화 */}
      <span className={styles.iconWrap()} aria-hidden="true">
        🏆
      </span>

      {/* 빈 상태 안내 메시지 */}
      <p className={styles.title()}>아직 토너먼트가 없어요.</p>
      <p className={styles.subtitle()}>
        좋아하는 게임들로 나만의 토너먼트를 만들고
        <br />
        취향을 가려보세요!
      </p>

      {/* UC-08 §기본 흐름 3 — '첫 토너먼트 만들기' 클릭 → CreatePage(UC-06) 진입 */}
      <Link href="/create" className={styles.ctaLink()}>
        첫 토너먼트 만들기
      </Link>
    </div>
  );
}
