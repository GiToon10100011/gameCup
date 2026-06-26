// 결과 라우트 — 비로그인 접근 시 /auth 리다이렉트.
// 실제 결과·저장·이력 렌더는 ResultPage(client) 컴포넌트가 담당한다.

import { requireAuth } from "@/modules/requireAuth";
import { ResultPage } from "@/components/result/ResultPage";

// WHY server component: requireAuth()는 next/headers(서버 전용 쿠키 접근)가 필요하다.
export default async function ResultRoute() {
  await requireAuth();
  return <ResultPage />;
}
