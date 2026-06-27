// GameCup 도메인 핵심 타입 정의.
// 모든 모듈·스토어·컴포넌트가 이 파일의 인터페이스를 import해서 사용한다.
// 컨벤션: 모든 `interface`는 `I` 접두사 (`type` alias는 영향 없음).

// 게임 한 건을 표현하는 최소 단위.
// 외부 API(RAWG) 응답을 정규화한 후 항상 이 형태로 변환된다.
export interface IGame {
  // 외부 API id를 string으로 정규화한 식별자 (검색 캐시·후보 등록 시 중복 판정 키)
  id: string;
  // 사용자에게 표시되는 게임명
  name: string;
  // 카드 썸네일 URL. 비어 있으면 placeholder UI를 보여준다.
  thumbnailUrl: string;
}

// 토너먼트 한 라운드의 1:1 대결을 표현.
// `isBye=true`이면 짝이 없는 부전승 페어이며 `gameB`는 null, `winner`는 자동으로 `gameA`가 된다.
export interface ITournamentPair {
  gameA: IGame;
  gameB: IGame | null;
  winner: IGame | null;
  isBye: boolean;
}

// 외부 API 호출 실패 시 던지는 표준 에러 형태.
// 실제 구현은 `lib/externalApiClient.ts::ExternalApiError` 클래스가 implements한다.
export interface IApiError {
  message: string;
  statusCode: number;
}

// 저장된 토너먼트(설문) 단위.
// 사용자가 이름을 붙여 저장한 후보 세트이며, Supabase `tournaments` 테이블과 1:1 대응한다.
// UML v2.0 §ITournament — F-16(생성·저장) · F-17(목록·관리) 핵심 엔티티.
export interface ITournament {
  // Supabase가 발급하는 UUID
  id: string;
  // 사용자가 붙인 토너먼트 이름 (예: "2024 최애 FPS 게임")
  name: string;
  // 소유 사용자의 Supabase UUID (auth.users.id와 동일)
  ownerId: string;
  // 이 토너먼트에 등록된 후보 게임 목록 (DB에 JSONB로 저장됨)
  candidates: IGame[];
  // ISO 8601 생성 시각 (Supabase가 자동 설정)
  createdAt: string;
}

// 플레이 완료 후 저장되는 결과 이력.
// 우승자·플레이 시각·대진 요약을 보관하며, `tournament_results` 테이블과 1:1 대응한다.
// UML v2.0 §ITournamentResult — F-19(결과 이력 저장·조회) 핵심 엔티티.
export interface ITournamentResult {
  // Supabase가 발급하는 UUID
  id: string;
  // 결과가 속한 토너먼트 UUID
  tournamentId: string;
  // 최종 우승 게임
  winner: IGame;
  // 플레이 완료 시각 (ISO 8601)
  playedAt: string;
  // 대진표 요약 JSON 문자열. 선택 저장(null 가능).
  bracketSummary: string | null;
}

// 공개 URL 공유 메타데이터.
// shareId(32자 hex)를 접근 토큰으로 사용해 비로그인 결과 열람을 지원한다.
// UML v2.0 §IPublicShare — F-20(결과 공유 링크) 핵심 엔티티.
export interface IPublicShare {
  // Supabase DB의 공유 레코드 UUID (내부 참조용)
  shareId: string;
  // 공유 대상 토너먼트 UUID
  tournamentId: string;
  // 공유 대상 결과 이력 UUID
  resultId: string;
  // 최종 우승 게임 — 비로그인 열람을 위해 public_shares에 비정규화 저장.
  // tournament_results는 RLS로 인증 필요하므로 공유 생성 시점에 함께 저장한다.
  // 마이그레이션(20260627) 이전에 생성된 공유 레코드는 null일 수 있다.
  winner: IGame | null;
  // 공유 링크 생성 시각 (ISO 8601)
  createdAt: string;
}

// Supabase Auth 인증 사용자를 표현하는 최소 단위.
// Supabase Session의 User 객체에서 필요한 필드만 추출해 정규화한다.
// Presentation 계층(AuthModule)과 Business 계층 간 전달 단위로 사용되며,
// Supabase SDK 타입에 직접 의존하지 않도록 별도로 정의한다 (UML v2.0 §IUser).
export interface IUser {
  // Supabase가 발급하는 UUID 형식의 사용자 식별자
  id: string;
  // OTP 인증에 사용한 이메일 주소
  email: string;
}
