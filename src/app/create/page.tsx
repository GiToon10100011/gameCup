// /create 라우트 — 토너먼트 생성 페이지 (Task #116, F-16).
// 서버 컴포넌트에서 requireAuth()로 비로그인 차단 후 CreatePage 클라이언트 컴포넌트를 렌더한다.

import { requireAuth } from "@/modules/requireAuth";
import { CreatePage } from "@/components/create/CreatePage";

export default async function CreateRoute() {
  // 비로그인 상태이면 /auth로 즉시 리다이렉트 — 이후 코드는 실행되지 않는다
  await requireAuth();

  return <CreatePage />;
}
