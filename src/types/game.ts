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

// Supabase Auth 인증 사용자를 표현하는 최소 단위.
// Supabase Session의 User 객체에서 필요한 필드만 추출해 정규화한다.
// Presentation 계층(AuthModule)과 Business 계층 간 전달 단위로 사용되며,
// Supabase SDK 타입에 직접 의존하지 않도록 별도로 정의한다 (UML v2.0 §IUser).
export interface IUser {
  // Supabase가 발급하는 UUID 형식의 사용자 식별자
  id: string;
  // 매직 링크 인증에 사용한 이메일 주소
  email: string;
}
