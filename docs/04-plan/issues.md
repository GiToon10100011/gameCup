# GameCup GitHub Projects 이슈 분해

기준 문서: [[../GameCup]]

---

## 1. 프로젝트 개요

**프로젝트명:** GameCup — 게임 이상형 월드컵 서비스

**목표:** 게임 취향 확인을 위한 인터랙티브 이상형 월드컵 서비스. 외부 게임 데이터베이스 기반의 빠른 검색과 토너먼트 방식의 직관적인 취향 선별 경험 제공.

**주요 사용자:**
- 게임 커뮤니티 사용자 (Steam 등 플랫폼 경험자)
- SNS 공유 사용자 (취향을 콘텐츠로 공유하는 사용자)

**핵심 기능 요약:**
- 게임 검색 (외부 API 연동, 캐싱, 빈 검색어 처리)
- 후보 목록 관리 (등록, 삭제, 중복 방지)
- 토너먼트 진행 (1:1 대결, 라운드 자동 진행, 부전승 처리)
- 결과 표시 및 재시작

**범위 외 (Backlog):**
- 결과 데이터 서버 저장 / 심층 취향 설문
- 결과 이미지 생성 / SNS 공유
- 게임별 토너먼트 랭킹 통계
- 사용자 인증 / 소셜 로그인

---

## 2. 기술 스택 (추정)

PRD에 기술 스택이 명시되지 않아 프론트엔드 위주 MVP 기준으로 추정한다.

| 분류 | 기술 |
| --- | --- |
| 프레임워크 | React + TypeScript |
| 상태 관리 | Zustand 또는 Context API (기능 단위 분리, NF-04 요건) |
| 스타일링 | Tailwind CSS |
| 외부 API | RAWG / IGDB 등 게임 데이터베이스 API |
| API 캐싱 | 세션 내 Map 또는 React Query (NF-05 요건) |
| 빌드 | Vite |
| 테스트 | Vitest + Testing Library |
| 배포 | Vercel 또는 GitHub Pages |

---

## 3. Sprint 계획

스프린트 단위: **1주**
전체 MVP 기간: **4주 (Sprint 1~4)**

| Iteration | 기간 | 목표 | 포함 Epic | 포함 범위 |
| --- | --- | --- | --- | --- |
| Sprint 1 | 1주 | 프로젝트 뼈대 + 게임 검색 구현 | EPIC-00, EPIC-01 | 프로젝트 초기 설정, 외부 API 연동, 검색 UI, 후보 등록/삭제 |
| Sprint 2 | 1주 | 토너먼트 핵심 로직 구현 | EPIC-02 | 토너먼트 시작 조건, 1:1 대결 UI, 라운드 자동 진행, 부전승 처리 |
| Sprint 3 | 1주 | 결과 화면 + 안정성 | EPIC-03, EPIC-04 | 결과 표시, 재시작, 비정상 입력 방지, API 오류 처리, 캐싱 |
| Sprint 4 | 1주 | QA + 배포 | EPIC-04 (계속) | 브라우저 호환성 검증, 접근성, 배포 파이프라인, 최종 점검 |
| Backlog | - | MVP 이후 기능 | EPIC-05 | SNS 공유, 랭킹, 결과 저장, 소셜 로그인 |

---

## 4. 이슈 목록 (Epic → Story 계층)

---

## EPIC-00. 프로젝트 기반 구축

| Field | Value |
| --- | --- |
| Priority | P0 |
| Iteration | Sprint 1 |
| Area | Infra |
| Requirement Type | Chore |
| Labels | `chore`, `priority: p0`, `area: infra` |

### 목표

다른 모든 작업의 선행 조건이 되는 개발 환경, 프로젝트 구조, 외부 API 키 설정을 완료한다. 이 Epic이 완료되어야 FE 구현 작업을 병렬로 시작할 수 있다.

### STORY-00-01. 개발 환경 및 프로젝트 초기 설정

| Field | Value |
| --- | --- |
| Parent | EPIC-00 |
| Priority | P0 |
| Size | S |
| Iteration | Sprint 1 |
| Area | Infra |

Acceptance Criteria:

- [ ] Vite + React + TypeScript 프로젝트가 정상 실행된다
- [ ] ESLint, Prettier 설정이 적용되어 있다
- [ ] Tailwind CSS가 적용되어 있다
- [ ] 환경 변수 파일(`.env.example`)이 작성되어 있다
- [ ] GitHub 리포지터리에 초기 커밋이 푸시되어 있다

Tasks:

- [ ] TASK-00-01-01 Vite + React + TypeScript 프로젝트 스캐폴딩
- [ ] TASK-00-01-02 ESLint + Prettier 설정 및 `.editorconfig` 작성
- [ ] TASK-00-01-03 Tailwind CSS 설치 및 설정
- [ ] TASK-00-01-04 `.env.example` 및 `.gitignore` 작성
- [ ] TASK-00-01-05 GitHub 리포지터리 생성 및 초기 커밋 푸시

### STORY-00-02. 폴더 구조 및 공통 타입 정의

| Field | Value |
| --- | --- |
| Parent | EPIC-00 |
| Priority | P0 |
| Size | S |
| Iteration | Sprint 1 |
| Area | FE |

Acceptance Criteria:

- [ ] `src/` 하위 폴더 구조(components, pages, hooks, store, types, services)가 잡혀 있다
- [ ] `Game`, `Candidate`, `TournamentState` 등 핵심 TypeScript 타입이 정의되어 있다
- [ ] 공통 타입은 단일 파일(`src/types/index.ts`)에서 export된다

Tasks:

- [ ] TASK-00-02-01 `src/` 폴더 구조 설계 및 생성
- [ ] TASK-00-02-02 `Game`, `Candidate`, `Match`, `TournamentState` 타입 정의
- [ ] TASK-00-02-03 공통 타입 파일 export 구조 정리

### STORY-00-03. 외부 게임 API 연동 설정

| Field | Value |
| --- | --- |
| Parent | EPIC-00 |
| Priority | P0 |
| Size | S |
| Iteration | Sprint 1 |
| Area | BE |

Acceptance Criteria:

- [ ] 외부 게임 API(RAWG 등) 계정 및 API 키가 발급되어 있다
- [ ] API 베이스 URL, 인증 헤더를 관리하는 `gameApiClient` 모듈이 작성되어 있다
- [ ] 환경 변수로 API 키를 주입하는 구조가 적용되어 있다
- [ ] 간단한 검색 테스트 호출이 성공한다

Tasks:

- [ ] TASK-00-03-01 외부 게임 API(RAWG 또는 IGDB) 가입 및 API 키 발급
- [ ] TASK-00-03-02 `src/services/gameApiClient.ts` 작성 (axios 또는 fetch 래퍼)
- [ ] TASK-00-03-03 환경 변수 연동 및 로컬 테스트 호출 확인

---

## EPIC-01. 게임 검색 및 후보 관리

| Field | Value |
| --- | --- |
| Priority | P0 |
| Iteration | Sprint 1 |
| Area | FE |
| Requirement Type | Functional |
| Labels | `feature`, `priority: p0`, `area: frontend` |

### 목표

사용자가 게임을 검색하고 결과를 확인한 뒤 토너먼트 후보 목록을 구성하는 전체 흐름을 구현한다. 검색 응답성(1초 이내, NF-01), 세션 내 캐싱(NF-05), 중복 방지(F-04), API 오류 안내(F-11)를 포함한다.

### STORY-01-01. 게임 검색 입력 및 드롭다운 결과 표시 (F-01, F-02, F-12)

| Field | Value |
| --- | --- |
| Parent | EPIC-01 |
| Priority | P0 |
| Size | M |
| Iteration | Sprint 1 |
| Area | FE |

Acceptance Criteria:

- [ ] 검색 입력창에 텍스트를 입력하면 외부 API를 호출하여 결과를 드롭다운으로 표시한다
- [ ] 드롭다운 각 항목에는 게임 썸네일 이미지와 이름이 표시된다
- [ ] 검색어가 공백이거나 비어 있으면 API를 호출하지 않고 드롭다운을 표시하지 않는다 (F-12)
- [ ] 검색 입력 후 1초 이내에 결과 목록이 화면에 표시된다 (NF-01)
- [ ] 동일 검색어의 API 응답은 세션 내에서 재활용되며 중복 호출이 발생하지 않는다 (NF-05)

Tasks:

- [ ] TASK-01-01-01 `SearchInput` 컴포넌트 구현 (입력, debounce, 빈 값 처리)
- [ ] TASK-01-01-02 `SearchDropdown` 컴포넌트 구현 (썸네일 + 이름 목록)
- [ ] TASK-01-01-03 게임 검색 API 호출 함수 `searchGames()` 구현
- [ ] TASK-01-01-04 세션 내 검색 결과 캐싱 로직 구현 (Map 기반)
- [ ] TASK-01-01-05 검색 응답 시간 로컬 측정 및 1초 이내 충족 확인

### STORY-01-02. API 오류 발생 시 사용자 안내 (F-11)

| Field | Value |
| --- | --- |
| Parent | EPIC-01 |
| Priority | P0 |
| Size | S |
| Iteration | Sprint 1 |
| Area | FE |

Acceptance Criteria:

- [ ] 외부 API 호출 실패 시 사용자에게 오류 메시지가 표시된다
- [ ] 오류 발생 후에도 서비스 전반은 정상 동작을 유지한다 (F-11)
- [ ] 네트워크 오류, 4xx, 5xx 응답 모두 처리된다

Tasks:

- [ ] TASK-01-02-01 API 호출 에러 핸들러 구현 (try/catch + 상태 반영)
- [ ] TASK-01-02-02 `ErrorMessage` 컴포넌트 구현 (인라인 오류 메시지 표시)
- [ ] TASK-01-02-03 오류 상태에서 서비스 정상 동작 유지 테스트

### STORY-01-03. 후보 목록 등록 및 중복 방지 (F-03, F-04)

| Field | Value |
| --- | --- |
| Parent | EPIC-01 |
| Priority | P0 |
| Size | M |
| Iteration | Sprint 1 |
| Area | FE |

Acceptance Criteria:

- [ ] 드롭다운에서 게임을 선택하면 후보 목록에 추가된다 (F-03)
- [ ] 이미 후보 목록에 있는 게임을 추가하려 하면 알림이 표시되고 추가되지 않는다 (F-04)
- [ ] 후보 목록은 화면에 게임 썸네일과 이름으로 표시된다
- [ ] 후보 목록에 게임이 추가된 후 검색 드롭다운이 닫힌다

Tasks:

- [ ] TASK-01-03-01 후보 목록 상태 관리 구현 (Zustand store 또는 Context)
- [ ] TASK-01-03-02 후보 등록 액션 구현 (중복 검사 포함)
- [ ] TASK-01-03-03 중복 시 토스트/인라인 알림 컴포넌트 구현
- [ ] TASK-01-03-04 `CandidateList` 컴포넌트 구현 (썸네일 + 이름 + 삭제 버튼)

### STORY-01-04. 후보 목록에서 게임 삭제 (F-05)

| Field | Value |
| --- | --- |
| Parent | EPIC-01 |
| Priority | P0 |
| Size | XS |
| Iteration | Sprint 1 |
| Area | FE |

Acceptance Criteria:

- [ ] 후보 목록의 각 게임에 삭제 버튼이 있다
- [ ] 삭제 버튼 클릭 시 해당 게임이 후보 목록에서 즉시 제거된다 (F-05)
- [ ] 삭제 후 목록이 올바르게 업데이트된다

Tasks:

- [ ] TASK-01-04-01 후보 삭제 액션 구현
- [ ] TASK-01-04-02 삭제 버튼 UI 및 동작 연결

---

## EPIC-02. 토너먼트 진행

| Field | Value |
| --- | --- |
| Priority | P0 |
| Iteration | Sprint 2 |
| Area | FE |
| Requirement Type | Functional |
| Labels | `feature`, `priority: p0`, `area: frontend` |

### 목표

토너먼트 시작 조건 검증부터 1:1 대결 진행, 라운드 자동 구성, 부전승 처리까지 토너먼트 핵심 로직 전체를 구현한다. 짧은 시간 내 연속 클릭 등 비정상 입력에도 데이터 불일치가 없어야 한다 (NF-02).

### STORY-02-01. 토너먼트 시작 조건 검증 및 시작 (F-06)

| Field | Value |
| --- | --- |
| Parent | EPIC-02 |
| Priority | P0 |
| Size | S |
| Iteration | Sprint 2 |
| Area | FE |

Acceptance Criteria:

- [ ] 후보가 2개 이상이면 토너먼트 시작 버튼이 활성화된다 (F-06)
- [ ] 후보가 2개 미만이면 시작 버튼이 비활성화되고 안내 문구가 표시된다 (F-06)
- [ ] 시작 버튼 클릭 시 후보 목록을 무작위 순서로 섞어 첫 라운드를 구성한다
- [ ] 토너먼트 진행 화면으로 전환된다

Tasks:

- [ ] TASK-02-01-01 토너먼트 시작 버튼 활성화/비활성화 로직 구현
- [ ] TASK-02-01-02 후보 목록 무작위 셔플 유틸 구현
- [ ] TASK-02-01-03 첫 라운드 대결 쌍 구성 로직 구현
- [ ] TASK-02-01-04 화면 전환 처리 (검색/후보 화면 → 토너먼트 화면)

### STORY-02-02. 1:1 대결 UI 및 게임 선택 (F-07)

| Field | Value |
| --- | --- |
| Parent | EPIC-02 |
| Priority | P0 |
| Size | M |
| Iteration | Sprint 2 |
| Area | FE |

Acceptance Criteria:

- [ ] 두 게임이 나란히 표시되고, 각 게임의 썸네일과 이름이 보인다 (F-07)
- [ ] 사용자가 한 게임을 선택하면 해당 게임이 승자로 기록된다 (F-07)
- [ ] 선택 후 다음 대결로 자동 전환된다
- [ ] 연속 빠른 클릭 시 한 번만 선택이 처리되고 데이터 불일치가 없다 (NF-02)
- [ ] 현재 라운드 진행 상황(예: "8강 3/4 경기")이 표시된다

Tasks:

- [ ] TASK-02-02-01 `MatchCard` 컴포넌트 구현 (두 게임 카드 + 선택 버튼)
- [ ] TASK-02-02-02 게임 선택 핸들러 구현 (승자 기록, 중복 클릭 방지)
- [ ] TASK-02-02-03 라운드 진행 상황 표시 컴포넌트 구현
- [ ] TASK-02-02-04 선택 후 다음 대결 자동 전환 로직 구현

### STORY-02-03. 라운드 자동 진행 (F-08)

| Field | Value |
| --- | --- |
| Parent | EPIC-02 |
| Priority | P0 |
| Size | S |
| Iteration | Sprint 2 |
| Area | FE |

Acceptance Criteria:

- [ ] 한 라운드의 모든 대결이 완료되면 승자들로 다음 라운드가 자동 구성된다 (F-08)
- [ ] 다음 라운드로 넘어갈 때 라운드 명칭(16강, 8강 등)이 업데이트된다
- [ ] 최종 1개의 게임이 남으면 결과 화면으로 자동 전환된다

Tasks:

- [ ] TASK-02-03-01 라운드 종료 감지 및 다음 라운드 구성 로직 구현
- [ ] TASK-02-03-02 라운드 명칭 자동 계산 유틸 구현 (승자 수 기반)
- [ ] TASK-02-03-03 최종 우승자 감지 및 결과 화면 전환 처리

### STORY-02-04. 부전승 처리 (F-09)

| Field | Value |
| --- | --- |
| Parent | EPIC-02 |
| Priority | P0 |
| Size | S |
| Iteration | Sprint 2 |
| Area | FE |

Acceptance Criteria:

- [ ] 후보 수가 홀수일 때 마지막 게임은 대결 없이 자동으로 다음 라운드에 진출한다 (F-09)
- [ ] 부전승 처리 후 라운드 구성이 올바르게 유지된다
- [ ] 부전승 게임은 UI에서 "부전승"으로 표시되거나 자연스럽게 넘어간다

Tasks:

- [ ] TASK-02-04-01 부전승 감지 로직 구현 (홀수 처리)
- [ ] TASK-02-04-02 부전승 게임 자동 진출 처리 및 다음 라운드 반영
- [ ] TASK-02-04-03 부전승 UI 표시 처리

---

## EPIC-03. 결과 화면 및 재시작

| Field | Value |
| --- | --- |
| Priority | P0 |
| Iteration | Sprint 3 |
| Area | FE |
| Requirement Type | Functional |
| Labels | `feature`, `priority: p0`, `area: frontend` |

### 목표

토너먼트 종료 후 우승 게임을 결과 화면에 표시하고, 사용자가 새 토너먼트를 시작할 수 있는 흐름을 구현한다. 재시작 시 모든 상태가 초기화되어야 한다.

### STORY-03-01. 결과 화면 표시 (F-10)

| Field | Value |
| --- | --- |
| Parent | EPIC-03 |
| Priority | P0 |
| Size | S |
| Iteration | Sprint 3 |
| Area | FE |

Acceptance Criteria:

- [ ] 모든 라운드 종료 후 우승 게임이 결과 화면에 표시된다 (F-10)
- [ ] 결과 화면에 우승 게임 썸네일, 이름, 축하 문구가 표시된다
- [ ] 결과 화면에 "새 토너먼트 시작" 버튼이 있다

Tasks:

- [ ] TASK-03-01-01 `ResultScreen` 컴포넌트 구현 (우승 게임 썸네일, 이름, 메시지)
- [ ] TASK-03-01-02 결과 화면 진입 조건 및 우승자 데이터 전달 처리

### STORY-03-02. 새 토너먼트 시작 (F-13)

| Field | Value |
| --- | --- |
| Parent | EPIC-03 |
| Priority | P0 |
| Size | XS |
| Iteration | Sprint 3 |
| Area | FE |

Acceptance Criteria:

- [ ] "새 토너먼트 시작" 클릭 시 후보 목록과 토너먼트 진행 상태가 모두 초기화된다 (F-13)
- [ ] 초기화 후 검색/후보 등록 화면으로 돌아간다
- [ ] 이전 토너먼트 데이터가 남아 있지 않다

Tasks:

- [ ] TASK-03-02-01 전체 상태 초기화 액션 구현 (후보 목록 + 토너먼트 상태)
- [ ] TASK-03-02-02 초기 화면 전환 처리

---

## EPIC-04. 품질 및 안정성

| Field | Value |
| --- | --- |
| Priority | P0 |
| Iteration | Sprint 3~4 |
| Area | FE |
| Requirement Type | Non-functional |
| Labels | `chore`, `priority: p0` |

### 목표

NF-01~NF-05 비기능 요건을 달성하고, 브라우저 호환성 검증, 배포 환경 구성, QA를 완료한다. 상태 관리 구조가 기능 단위로 분리되어 향후 기능 추가가 용이해야 한다 (NF-04).

### STORY-04-01. 비정상 입력 방지 및 상태 안정성 (NF-02)

| Field | Value |
| --- | --- |
| Parent | EPIC-04 |
| Priority | P0 |
| Size | S |
| Iteration | Sprint 3 |
| Area | FE |

Acceptance Criteria:

- [ ] 짧은 시간 내 연속 클릭 시 게임 선택이 한 번만 처리된다 (NF-02)
- [ ] 중복 클릭, 빠른 입력 등 비정상 시나리오에서 데이터 불일치가 없다 (NF-02)
- [ ] 클릭 직후 버튼이 비활성화되거나 debounce/throttle이 적용된다

Tasks:

- [ ] TASK-04-01-01 게임 선택 버튼에 throttle 또는 일시 비활성화 처리 적용
- [ ] TASK-04-01-02 연속 클릭 시나리오 수동 테스트 및 확인

### STORY-04-02. 상태 관리 기능 단위 분리 (NF-04)

| Field | Value |
| --- | --- |
| Parent | EPIC-04 |
| Priority | P1 |
| Size | S |
| Iteration | Sprint 3 |
| Area | FE |

Acceptance Criteria:

- [ ] 검색/후보 상태, 토너먼트 상태, 결과 상태가 각각 분리된 store/context로 관리된다 (NF-04)
- [ ] 향후 기능(SNS 공유, 랭킹 등) 추가 시 기존 상태를 건드리지 않고 확장 가능하다
- [ ] 상태 구조 문서 또는 주석이 작성되어 있다

Tasks:

- [ ] TASK-04-02-01 상태 구조 설계 리뷰 및 분리 기준 확정
- [ ] TASK-04-02-02 `candidateStore`, `tournamentStore`, `resultStore` 분리 적용
- [ ] TASK-04-02-03 상태 구조 주석 작성

### STORY-04-03. 브라우저 호환성 검증 (NF-03)

| Field | Value |
| --- | --- |
| Parent | EPIC-04 |
| Priority | P0 |
| Size | S |
| Iteration | Sprint 4 |
| Area | FE |

Acceptance Criteria:

- [ ] Chrome, Edge, Firefox 최신 안정 버전에서 주요 기능이 동일하게 동작한다 (NF-03)
- [ ] 각 브라우저에서 검색, 후보 등록, 토너먼트 진행, 결과 확인 흐름이 검증된다

Tasks:

- [ ] TASK-04-03-01 Chrome 최신 버전 기능 검증
- [ ] TASK-04-03-02 Edge 최신 버전 기능 검증
- [ ] TASK-04-03-03 Firefox 최신 버전 기능 검증
- [ ] TASK-04-03-04 발견된 호환성 이슈 수정

### STORY-04-04. 배포 파이프라인 구성

| Field | Value |
| --- | --- |
| Parent | EPIC-04 |
| Priority | P0 |
| Size | S |
| Iteration | Sprint 4 |
| Area | Infra |

Acceptance Criteria:

- [ ] Vercel 또는 GitHub Pages에 프로덕션 배포가 완료된다
- [ ] main 브랜치 push 시 자동 배포가 동작한다
- [ ] 환경 변수(API 키)가 배포 환경에 안전하게 설정되어 있다

Tasks:

- [ ] TASK-04-04-01 Vercel 프로젝트 연결 및 환경 변수 설정
- [ ] TASK-04-04-02 자동 배포 동작 확인
- [ ] TASK-04-04-03 배포된 URL에서 전체 기능 최종 확인

---

## EPIC-05. Backlog — MVP 이후 기능

| Field | Value |
| --- | --- |
| Priority | P2 |
| Iteration | Backlog |
| Area | FE / BE |
| Requirement Type | Functional |
| Labels | `feature`, `priority: p2` |

### 목표

MVP 완료 후 단계적으로 추가할 기능들. 현재 상태 관리 구조가 기능 단위로 분리되어 있으면 (NF-04) 이 Epic들을 독립적으로 추가할 수 있다.

### STORY-05-01. 결과 이미지 생성 및 SNS 공유

| Field | Value |
| --- | --- |
| Parent | EPIC-05 |
| Priority | P2 |
| Size | L |
| Iteration | Backlog |
| Area | FE |

Acceptance Criteria:

- [ ] 결과 화면에서 우승 게임 카드를 이미지로 다운로드할 수 있다
- [ ] SNS 공유 링크(Twitter, Instagram 등)가 제공된다

### STORY-05-02. 게임별 토너먼트 랭킹 통계

| Field | Value |
| --- | --- |
| Parent | EPIC-05 |
| Priority | P2 |
| Size | L |
| Iteration | Backlog |
| Area | FE / BE |

Acceptance Criteria:

- [ ] 게임별 우승 횟수, 선택 횟수 등 통계가 집계된다
- [ ] 랭킹 화면에서 게임 목록과 통계가 표시된다

### STORY-05-03. 사용자 인증 및 소셜 로그인

| Field | Value |
| --- | --- |
| Parent | EPIC-05 |
| Priority | P2 |
| Size | L |
| Iteration | Backlog |
| Area | FE / BE |

Acceptance Criteria:

- [ ] Google, GitHub 등 소셜 로그인이 제공된다
- [ ] 로그인한 사용자의 토너먼트 결과 이력이 저장된다

---

## 5. 이슈 생성 순서

아래 순서로 이슈를 생성해야 의존성 충돌 없이 병렬 작업이 가능하다.

1. **EPIC-00 전체** (Sprint 1 시작 시 최우선) — 모든 FE 작업의 선행 조건
2. STORY-00-01, STORY-00-02, STORY-00-03 (순서대로 또는 병렬)
3. EPIC-00 완료 후 → STORY-01-01 (검색 UI + API 연동)
4. STORY-01-01 완료 후 → STORY-01-02, STORY-01-03 병렬 진행
5. STORY-01-03 완료 후 → STORY-01-04
6. Sprint 2: STORY-02-01 먼저, 이후 STORY-02-02, STORY-02-03, STORY-02-04 순서 또는 병렬
7. Sprint 3: STORY-03-01, STORY-03-02, STORY-04-01, STORY-04-02
8. Sprint 4: STORY-04-03, STORY-04-04 (QA + 배포)

---

## 6. P0 MVP 상세 분해

P0 기능: F-01~F-13 전체 (검색, 후보 관리, 토너먼트, 결과, 재시작, 오류 처리)
비기능: NF-01~NF-05 전체

| 기능 ID | 기능명 | 담당 Story |
| --- | --- | --- |
| F-01 | 게임 검색 | STORY-01-01 |
| F-02 | 검색 결과 표시 | STORY-01-01 |
| F-03 | 후보 등록 | STORY-01-03 |
| F-04 | 중복 등록 방지 | STORY-01-03 |
| F-05 | 후보 삭제 | STORY-01-04 |
| F-06 | 토너먼트 시작 | STORY-02-01 |
| F-07 | 1:1 대결 진행 및 게임 선택 | STORY-02-02 |
| F-08 | 라운드 자동 진행 | STORY-02-03 |
| F-09 | 부전승 처리 | STORY-02-04 |
| F-10 | 결과 화면 표시 | STORY-03-01 |
| F-11 | API 오류 안내 | STORY-01-02 |
| F-12 | 빈 검색어 처리 | STORY-01-01 |
| F-13 | 새 토너먼트 시작 | STORY-03-02 |
| NF-01 | 검색 응답 1초 이내 | STORY-01-01 |
| NF-02 | 비정상 입력 방지 | STORY-04-01 |
| NF-03 | 브라우저 호환성 | STORY-04-03 |
| NF-04 | 상태 관리 기능 단위 분리 | STORY-04-02 |
| NF-05 | 세션 내 캐싱 | STORY-01-01 |

---

## 7. P1 상세 분해

현재 PRD 기준 P1에 해당하는 항목 없음. Sprint 4에서 발견되는 개선 사항은 P1으로 등록.

---

## 8. P2 Backlog 분해

EPIC-05 참고:
- STORY-05-01 결과 이미지 생성 및 SNS 공유 · L · Backlog
- STORY-05-02 게임별 토너먼트 랭킹 통계 · L · Backlog
- STORY-05-03 사용자 인증 및 소셜 로그인 · L · Backlog

---

## 9. 품질, 보안, 배포 이슈

| 분류 | 내용 | 담당 Story |
| --- | --- | --- |
| 보안 | API 키 환경 변수 관리, 클라이언트 노출 방지 | STORY-00-03 |
| 보안 | 배포 환경 환경 변수 설정 | STORY-04-04 |
| 안정성 | 연속 클릭 방지 (throttle/비활성화) | STORY-04-01 |
| 안정성 | API 오류 처리 및 서비스 정상 유지 | STORY-01-02 |
| 호환성 | Chrome, Edge, Firefox 검증 | STORY-04-03 |
| 배포 | Vercel 자동 배포 파이프라인 | STORY-04-04 |
| 확장성 | 상태 기능 단위 분리 (향후 기능 추가 대비) | STORY-04-02 |

---

## 10. 전체 이슈 요약 (nested list)

- **EPIC-00** 프로젝트 기반 구축 · P0 · Sprint 1 · Infra
  - STORY-00-01 개발 환경 및 프로젝트 초기 설정 · S · Sprint 1
  - STORY-00-02 폴더 구조 및 공통 타입 정의 · S · Sprint 1
  - STORY-00-03 외부 게임 API 연동 설정 · S · Sprint 1

- **EPIC-01** 게임 검색 및 후보 관리 · P0 · Sprint 1 · FE
  - STORY-01-01 게임 검색 입력 및 드롭다운 결과 표시 · M · Sprint 1
  - STORY-01-02 API 오류 발생 시 사용자 안내 · S · Sprint 1
  - STORY-01-03 후보 목록 등록 및 중복 방지 · M · Sprint 1
  - STORY-01-04 후보 목록에서 게임 삭제 · XS · Sprint 1

- **EPIC-02** 토너먼트 진행 · P0 · Sprint 2 · FE
  - STORY-02-01 토너먼트 시작 조건 검증 및 시작 · S · Sprint 2
  - STORY-02-02 1:1 대결 UI 및 게임 선택 · M · Sprint 2
  - STORY-02-03 라운드 자동 진행 · S · Sprint 2
  - STORY-02-04 부전승 처리 · S · Sprint 2

- **EPIC-03** 결과 화면 및 재시작 · P0 · Sprint 3 · FE
  - STORY-03-01 결과 화면 표시 · S · Sprint 3
  - STORY-03-02 새 토너먼트 시작 · XS · Sprint 3

- **EPIC-04** 품질 및 안정성 · P0 · Sprint 3~4 · FE/Infra
  - STORY-04-01 비정상 입력 방지 및 상태 안정성 · S · Sprint 3
  - STORY-04-02 상태 관리 기능 단위 분리 · S · Sprint 3
  - STORY-04-03 브라우저 호환성 검증 · S · Sprint 4
  - STORY-04-04 배포 파이프라인 구성 · S · Sprint 4

- **EPIC-05** Backlog — MVP 이후 기능 · P2 · Backlog
  - STORY-05-01 결과 이미지 생성 및 SNS 공유 · L · Backlog
  - STORY-05-02 게임별 토너먼트 랭킹 통계 · L · Backlog
  - STORY-05-03 사용자 인증 및 소셜 로그인 · L · Backlog

---

## 11. 브랜치 예시

실제 GitHub Issue 번호 생성 후 아래 형식으로 브랜치를 생성한다.

```text
chore/1-project-setup
chore/2-folder-structure-types
chore/3-game-api-client-setup
feat/4-game-search-dropdown
feat/5-api-error-handling
feat/6-candidate-register-duplicate
feat/7-candidate-delete
feat/8-tournament-start-condition
feat/9-match-ui-game-select
feat/10-round-auto-progress
feat/11-bye-round-handling
feat/12-result-screen
feat/13-new-tournament-restart
chore/14-click-throttle-stability
chore/15-state-store-separation
chore/16-browser-compatibility
chore/17-deploy-pipeline
```

PR 제목 형식: `[#4] 게임 검색 드롭다운 구현`

---

## 12. MVP 완료 기준

- [ ] F-01 ~ F-13 기능 요구사항 모두 동작 확인
- [ ] NF-01 검색 응답 1초 이내 충족
- [ ] NF-02 연속 클릭 등 비정상 입력 시 데이터 불일치 없음
- [ ] NF-03 Chrome, Edge, Firefox 최신 버전 동작 확인
- [ ] NF-04 상태 관리가 기능 단위로 분리되어 있음
- [ ] NF-05 동일 검색어 중복 API 호출 없음
- [ ] Vercel(또는 GitHub Pages) 프로덕션 배포 완료
- [ ] API 키가 환경 변수로 안전하게 관리됨
- [ ] EPIC-05 기능은 Backlog에만 존재하고 MVP에 포함되지 않음

---

## 13. 분리 원칙

- 한 Story는 1명이 1~2일 안에 완료할 수 있는 단위로 설계했다.
- P0 기능(F-01~F-13)은 모두 Epic → Story → Task까지 분해했다.
- P2 기능(SNS 공유, 랭킹, 인증)은 MVP에 포함하지 않고 EPIC-05 Backlog로 분리했다.
- 외부 API 연동(STORY-00-03)과 공통 타입(STORY-00-02)은 다른 작업의 선행 조건이므로 Sprint 1 첫째에 배치했다.
- 검색 UI(STORY-01-01)와 후보 등록(STORY-01-03)은 공통 타입 정의 후 병렬 착수 가능하도록 설계했다.
- 불확실한 기능(랭킹, 저장)은 Backlog로만 보관하고 MVP 안으로 밀어 넣지 않았다.
