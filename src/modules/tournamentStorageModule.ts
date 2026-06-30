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
import type { IGame, IPublicShare, ITournament, ITournamentResult } from "@/types/game";

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
// 내부 헬퍼 — DB row → ITournamentResult 정규화
// ─────────────────────────────────────────────────────────────────────────────
// WHY: tournament_results 테이블의 snake_case 컬럼을 camelCase 도메인 타입으로 변환해
// Business/Presentation 계층이 DB 컬럼명에 의존하지 않도록 캡슐화한다.
function toITournamentResult(row: {
  id: string;
  tournament_id: string;
  winner: IGame;
  played_at: string;
  bracket_summary: string | null;
}): ITournamentResult {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    winner: row.winner,
    playedAt: row.played_at,
    bracketSummary: row.bracket_summary,
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

  // DB row → 도메인 ITournament 정규화
  const tournament = toITournament(data);

  // 생성된 토너먼트를 활성으로 표시 — HubPage 이동 후 바로 플레이 진입 가능하게 (UML 시퀀스)
  useStateStore.getState().setActive(tournament);

  return tournament;
}

// ─────────────────────────────────────────────────────────────────────────────
// listMyTournaments — 로그인 사용자의 토너먼트 목록 조회 (F-17)
// ─────────────────────────────────────────────────────────────────────────────
// WHY: RLS `owner_id = auth.uid()` 정책이 자동으로 본인 행만 반환한다.
// 앱 계층 인증 확인은 RLS에 위임하지 않고 조기 실패로 네트워크 비용을 줄인다.
// 최신순 정렬(created_at DESC)로 허브에서 가장 최근 토너먼트가 먼저 보인다.
async function listMyTournaments(): Promise<ITournament[]> {
  const supabase = createBrowserSupabaseClient();

  // 인증 확인 — 비로그인 상태에서 조회 시도를 조기 차단
  const currentUser = useStateStore.getState().getUser();
  if (!currentUser) {
    throw new Error("토너먼트 목록을 조회하려면 로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    // 최신 생성 순 정렬 — 허브 목록에서 가장 최근 토너먼트가 상단에 위치
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // 배열 전체를 도메인 ITournament[]로 정규화
  const tournaments = (data ?? []).map(toITournament);

  // 목록 캐시 갱신 — HubPage가 API 재호출 없이 캐시를 구독해 렌더한다 (TournamentLibrarySlice)
  useStateStore.getState().setList(tournaments);

  return tournaments;
}

// ─────────────────────────────────────────────────────────────────────────────
// getTournament — 단건 토너먼트 조회 (F-17, HubPage에서 선택 → 플레이 진입)
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 허브에서 특정 토너먼트를 선택하면 해당 후보 세트를 불러와 플레이를 시작해야 한다.
// RLS가 타인의 레코드 접근을 차단하므로 소유자 검증은 DB 계층에 위임한다.
async function getTournament(id: string): Promise<ITournament> {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .single();

  // .single()은 행이 0개이면 에러를 반환한다(RLS에 의한 타인 레코드 차단 포함).
  if (error) {
    throw new Error(error.message);
  }

  const tournament = toITournament(data);

  // 조회된 토너먼트를 활성으로 설정 — HubPage 선택 후 플레이 진입 전 상태 (UML 시퀀스)
  useStateStore.getState().setActive(tournament);

  return tournament;
}

// ─────────────────────────────────────────────────────────────────────────────
// deleteTournament — 토너먼트 삭제 (F-17)
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 허브에서 더 이상 필요 없는 토너먼트를 삭제한다.
// DB의 ON DELETE CASCADE로 연결된 tournament_results·public_shares도 함께 삭제된다.
// RLS `owner_id = auth.uid()` 정책이 타인의 토너먼트 삭제를 차단한다.
async function deleteTournament(id: string): Promise<void> {
  const supabase = createBrowserSupabaseClient();

  // 인증 확인 — 비로그인 상태에서 삭제 시도를 조기 차단
  const currentUser = useStateStore.getState().getUser();
  if (!currentUser) {
    throw new Error("토너먼트를 삭제하려면 로그인이 필요합니다.");
  }

  const { error } = await supabase
    .from("tournaments")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  // 삭제된 토너먼트를 목록 캐시에서 제거 — HubPage가 즉시 반영
  const current = useStateStore.getState().getList();
  useStateStore.getState().setList(current.filter((t) => t.id !== id));

  // 삭제된 토너먼트가 활성 상태였으면 해제
  if (useStateStore.getState().getActive()?.id === id) {
    useStateStore.getState().clearActive();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// saveResult — 플레이 완료 결과(우승자·대진요약) 저장 (F-19)
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 토너먼트 완료 시점에 ResultPage가 자동으로 호출한다. winner(IGame)는 jsonb로 저장되어
// 나중에 이력 조회 시 전체 IGame 구조체를 그대로 복원할 수 있다.
// RLS `owner_id = auth.uid()` 정책이 DB 수준에서 타인 데이터 저장을 차단한다.
async function saveResult(
  tournamentId: string,
  winner: IGame,
  bracketSummary: string | null = null,
): Promise<ITournamentResult> {
  const supabase = createBrowserSupabaseClient();

  // 인증 확인 — 비로그인 상태에서 저장 시도를 조기 차단
  const currentUser = useStateStore.getState().getUser();
  if (!currentUser) {
    throw new Error("결과를 저장하려면 로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("tournament_results")
    .insert({
      tournament_id: tournamentId,
      // RLS owner_id 정책과 일치: insert 시 현재 사용자 id 명시
      owner_id: currentUser.id,
      winner,
      bracket_summary: bracketSummary,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toITournamentResult(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// listResults — 특정 토너먼트의 플레이 이력 목록 조회 (F-19)
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 토너먼트 상세 화면에서 과거 플레이 결과 이력을 최신순으로 보여준다.
// RLS `owner_id = auth.uid()` 정책이 자동으로 본인 이력만 반환하므로
// 앱 계층 소유자 검증을 별도로 추가하지 않는다.
async function listResults(tournamentId: string): Promise<ITournamentResult[]> {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("tournament_results")
    .select("*")
    // tournament_id로 필터 — 해당 토너먼트의 이력만 조회
    .eq("tournament_id", tournamentId)
    // 최신 플레이 순 정렬 — 이력 목록에서 가장 최근 결과가 상단에 위치
    .order("played_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toITournamentResult);
}

// ─────────────────────────────────────────────────────────────────────────────
// 내부 헬퍼 — DB row → IPublicShare 정규화
// ─────────────────────────────────────────────────────────────────────────────
// WHY: public_shares 테이블의 snake_case 컬럼을 camelCase 도메인 타입으로 변환.
// DB 내부 uuid(id)는 외부에 노출하지 않고 share_id(32자 hex 토큰)만 노출한다.
function toIPublicShare(row: {
  share_id: string;
  tournament_id: string;
  result_id: string;
  winner?: IGame | null;
  created_at: string;
}): IPublicShare {
  return {
    shareId: row.share_id,
    tournamentId: row.tournament_id,
    resultId: row.result_id,
    winner: row.winner ?? null,
    createdAt: row.created_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// createPublicShare — 결과에 대한 공개 공유 링크 발급 (F-20)
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 토너먼트 완료 후 결과를 공개 URL로 공유하기 위해 예측 불가한 32자 hex share_id를
// DB에서 자동 발급한다. share_id가 접근 토큰 역할을 해 비로그인 방문자도 링크로 열람 가능.
// tournament_id는 store의 activeTournament에서 가져와 API 계층 조회를 줄인다.
async function createPublicShare(resultId: string): Promise<IPublicShare> {
  const supabase = createBrowserSupabaseClient();

  // 인증 확인 — 본인 소유 결과만 공유 생성 가능 (RLS 심층 방어 + 앱 계층 조기 실패)
  const currentUser = useStateStore.getState().getUser();
  if (!currentUser) {
    throw new Error("공유 링크를 생성하려면 로그인이 필요합니다.");
  }

  // activeTournament에서 tournament_id 획득 — ResultPage 컨텍스트에서 항상 설정돼 있다
  const activeTournament = useStateStore.getState().getActive();
  if (!activeTournament) {
    throw new Error("활성 토너먼트가 없습니다. 허브에서 토너먼트를 선택하세요.");
  }

  // 비인증 열람을 위해 winner를 함께 저장 — tournament_results는 RLS 인증 필요
  const currentWinner = useStateStore.getState().getWinner();

  const { data, error } = await supabase
    .from("public_shares")
    .insert({
      result_id: resultId,
      tournament_id: activeTournament.id,
      winner: currentWinner,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toIPublicShare(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// getPublicResult — share_id로 공개 결과 조회 (F-20)
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 비로그인 방문자가 공유 링크(/share/[shareId])로 접근했을 때 결과를 가져온다.
// RLS `using (true)` 정책으로 누구나 조회 가능하며, share_id의 예측 불가성이 접근 제어 역할.
// 인증 확인 없음 — 의도적 공개 열람 경로.
async function getPublicResult(shareId: string): Promise<IPublicShare> {
  const supabase = createBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("public_shares")
    .select("*")
    // share_id(hex 토큰)로 필터 — id(uuid PK)가 아닌 공개 접근 토큰으로 조회
    .eq("share_id", shareId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toIPublicShare(data);
}

// ─────────────────────────────────────────────────────────────────────────────
// 모듈 객체 export — 함수형 모듈 방식 (authModule 패턴 통일)
// ─────────────────────────────────────────────────────────────────────────────
// WHY: 클래스 인스턴스 대신 단순 객체로 묶어 export하면 tree-shaking이 유리하고
// 테스트에서 vi.spyOn으로 특정 함수만 교체하기 쉽다.
export const tournamentStorageModule = {
  createTournament,
  listMyTournaments,
  getTournament,
  deleteTournament,
  saveResult,
  listResults,
  createPublicShare,
  getPublicResult,
};
