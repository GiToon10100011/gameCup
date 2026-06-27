// 메인 허브 라우트 — 비로그인 접근 시 /auth로 리다이렉트.
// 이전 검색·후보 등록 흐름은 /create 라우트(app/create/page.tsx)로 이동됨 (Task #116).

import { requireAuth } from "@/modules/requireAuth";
import { HubPage } from "@/components/hub/HubPage";

// WHY server component: requireAuth()는 next/headers(서버 전용 쿠키 접근)가 필요하다.
// 로그인 여부는 서버 렌더 시점에 확인하고, 실제 목록 렌더는 HubPage(client)가 담당한다.
export default async function HubRoute() {
  await requireAuth();
  return <HubPage />;
}
