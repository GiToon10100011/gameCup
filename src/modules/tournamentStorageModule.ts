// Business 계층 — 토너먼트 저장·조회 모듈.
// UML v2.0 §TournamentStorageModule 정의를 구현한다.
//
// 책임: Supabase `tournaments` 테이블 CRUD를 래핑해 도메인 타입(ITournament 등)으로 정규화.
// CandidateModule(후보 등록)과 협력해 후보 세트를 토너먼트로 영속화한다.
//
// 구현 단계별 Task 매핑:
//   Task #115 — createTournament (F-16)
//   Task #118 — list/get/deleteTournament (F-17)
//   Task #124 — saveResult·listResults (F-19)
//   Task #127 — createPublicShare·getPublicResult (F-20)
//
// 3계층 위치: Business (modules/)
//   - Data 방향: src/lib/supabaseClient.ts (createBrowserSupabaseClient)
//   - Data Store 방향: src/store/stateStore.ts (getUser)
//   - TournamentLibrarySlice setActive는 Task #119(TournamentLibrarySlice) 구현 후 배선한다.

import { createBrowserSupabaseClient } from "@/lib/supabaseClient";
import { useStateStore } from "@/store/stateStore";
import type { IGame, ITournament } from "@/types/game";

// ─────────────────────────────────────────────────────────────────────────────
// 내부 헬퍼 — DB row → ITournament 정규화
// ─────────────────────────────────────────────────────────────────────────────
// WHY: Supabase가 반환하는 snake_case 컬럼을 camelCase 도메인 타입으로 변환해
// Business/Presentation 계층이 DB 컬럼명에 의존하지 않도록 캡슐화한다.
function toITournament(row: {
  id: string;
  name: string;
  owner_id: string;
  candidates: IGame[];
  created_at: string;
}): ITournament {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    candidates: row.candidates,
    createdAt: row.created_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// createTournament — 후보 세트에 이름을 붙여 Supabase에 저장 (F-16)
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 단일 세션 → 멀티 토너먼트 모델 전환의 핵심 액션(CL-03).
// 사용자가 후보 등록 후 이름을 지정하면 이 함수가 Supabase에 영속화한다.
// RLS 정책(owner_id = auth.uid())이 DB 수준에서 타인의 데이터 접근을 차단한다.
async function createTournament(
  name: string,
  candidates: IGame[],
): Promise<ITournament> {
  const supabase = createBrowserSupabaseClient();

  // 인증 확인 — RLS를 통과하더라도 앱 계층에서도 조기 검증한다
  const currentUser = useStateStore.getState().getUser();
  if (!currentUser) {
    throw new Error("토너먼트를 생성하려면 로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      name,
      // RLS owner_id 정책과 일치: insert 시 현재 사용자 id를 명시
      owner_id: currentUser.id,
      candidates,
    })
    .select()
    .single();

  // Supabase 에러(RLS 위반·네트워크 오류 등)는 즉시 throw해 호출 측이 처리하도록 위임
  if (error) {
    throw new Error(error.message);
  }

  // DB row → 도메인 ITournament 정규화 후 반환
  return toITournament(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// 모듈 객체 export — 함수형 모듈 방식 (authModule 패턴 통일)
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 클래스 인스턴스 대신 단순 객체로 묶어 export하면 tree-shaking이 유리하고
// 테스트에서 vi.spyOn으로 특정 함수만 교체하기 쉽다.
export const tournamentStorageModule = {
  createTournament,
};
