// 공개 결과 공유 라우트 — 인증 불필요 (F-20, UC-10 §링크열람).
// 비로그인 방문자도 shareId 토큰으로 결과를 열람할 수 있다.
// 실제 데이터 조회·렌더는 PublicResultPage(client)가 담당한다.

import { PublicResultPage } from "@/components/share/PublicResultPage";

interface ISharePageProps {
  params: Promise<{ shareId: string }>;
}

export default async function ShareRoute({ params }: ISharePageProps) {
  const { shareId } = await params;
  return <PublicResultPage shareId={shareId} />;
}
