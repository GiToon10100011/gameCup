// 토너먼트 플레이 라우트 — 서버 컴포넌트 래퍼.
// F-15: requireAuth()로 비로그인 접근을 차단하고, 실제 UI는 TournamentPage(client)에 위임한다.

import { requireAuth } from "@/modules/requireAuth";
import { TournamentPage } from "@/components/tournament/TournamentPage";

export default async function TournamentRoute() {
  // 비로그인 상태이면 /auth로 즉시 리다이렉트 — 이후 코드는 실행되지 않는다
  await requireAuth();

  return <TournamentPage />;
}
