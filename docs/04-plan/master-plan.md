# GameCup — 마스터 프로젝트 계획 (Master Plan)

> **버전:** v1.0 · **작성일:** 2026.05.19 · **베이스라인:** PRD Iteration 3 (v3.0) · UML v1.1 · UC v1.0/v1.1

본 문서는 GameCup 프로젝트의 단일 진실 공급원(Single Source of Truth)이다.
변경 이력은 [`changelog.md`](./changelog.md)에 누적되며, 다음 이터레이션 분기 시점·규칙은 [`../05-process/iteration-update-guide.md`](../05-process/iteration-update-guide.md)를 따른다.

---

## 목차

1. 프로젝트 개요
2. 현재 베이스라인
3. 확정 기술 스택
4. 아키텍처 (3계층 · 6모듈)
5. 코드베이스 폴더 구조
6. 요구사항 → 구현 단위 매핑
7. 마일스톤 (Phase)
8. 테스트 전략
9. 이터레이션 갱신 프로세스 요약
10. 서브에이전트 위임 규칙

---

## 1. 프로젝트 개요

| 항목 | 내용 |
| --- | --- |
| **이름** | GameCup: World Cup of My Life Games |
| **목표** | 사용자가 직접 토너먼트로 자신의 게임 취향을 가리고 결과를 공유하는 인터랙티브 서비스 구축 |
| **타겟 사용자** | Steam 등 게임 플랫폼 사용자, SNS에서 취향을 공유하는 커뮤니티 사용자 |
| **핵심 가치** | 빠른 게임 검색 + 토너먼트 방식의 직관적·재미있는 취향 선별 |
| **출처 문서** | [`../00-overview/project-idea.md`](../00-overview/project-idea.md) |

---

## 2. 현재 베이스라인

| 산출물 | 버전 | 파일 |
| --- | --- | --- |
| **PRD** | v3.0 (Iteration 3) | [`../01-prd/iteration-3.md`](../01-prd/iteration-3.md) |
| **유즈케이스 (Fully Dressed)** | v1.0 | [`../02-usecase/fully-dressed.md`](../02-usecase/fully-dressed.md) |
| **유즈케이스 (Stepwise)** | v1.1 | [`../02-usecase/stepwise.md`](../02-usecase/stepwise.md) |
| **UML (코드 기준)** | v1.1 | [`../03-design/uml-v1.1.md`](../03-design/uml-v1.1.md) |
| **UML (Draft)** | v1.2 (2026.05.17) | [`../03-design/uml-v1.2.md`](../03-design/uml-v1.2.md) — StateStore 4-슬라이스 분리·통합 검증 섹션. 아직 코드에 미반영 |
| **변경 이력** | rolling | [`./changelog.md`](./changelog.md) |

---

## 3. 확정 기술 스택

근거 상세는 [`../07-tech-rationale/README.md`](../07-tech-rationale/README.md) 참조 (도입 시점·이유 누적).

| 분류 | 기술 | 핵심 도입 이유 (요약) |
| --- | --- | --- |
| Framework | Next.js 14 (App Router) | 파일 기반 라우팅 + SSR/SSG + API Route 통합 |
| Language | TypeScript (strict) | RAWG API 응답 타입 안전 |
| Styling | Tailwind CSS | 토너먼트 반응형 + 빠른 레이아웃 |
| State (Memory) | Zustand | UML `StateStore` 1:1 매핑, 보일러플레이트 최소화 |
| Server Cache | TanStack Query v5 | 동일 검색어 캐싱(NF-05) + 무한 스크롤 |
| Backend/DB (Iteration 4+) | Supabase | 인증·DB·스토리지 일체형 |
| External API | RAWG | 50만+ 게임 + 고화질 썸네일 |
| Unit Test | Vitest | TS·ESM·jsdom 친화, 빠른 실행 |
| E2E Test | Playwright | 풀 플로우 회귀 |
| Deploy | Vercel | Next.js 1급 호환 |
| Error Tracking | Sentry | 런타임 예외 + API 실패 모니터링 |

---

## 4. 아키텍처 (3계층 · 6모듈)

UML v1.1과 1:1 매핑. 계층 건너뛰기 금지(Presentation → Business → Data 단방향).

| 계층 | 책임 | 구성 요소 |
| --- | --- | --- |
| **Presentation** | 입력/출력 | `app/*`, `components/*` (SearchView · CandidateView · TournamentView · ResultView) |
| **Business** | 도메인 로직 | `modules/searchModule.ts`, `candidateModule.ts`, `tournamentModule.ts`, `resultModule.ts` |
| **Data** | 상태/외부 | `store/stateStore.ts` (메모리), `lib/externalApiClient.ts` (RAWG 게이트웨이) |

---

## 5. 코드베이스 폴더 구조

```
gameCup/
├── CLAUDE.md                    # 프로젝트 가이드 + 서브에이전트 로스터
├── .claude/agents/              # 프로젝트 전용 서브에이전트 8종
├── docs/                        # 본 문서가 속한 트리 (§9 참조)
├── src/
│   ├── app/                     # Presentation · Next.js 라우트
│   │   ├── layout.tsx
│   │   ├── providers.tsx
│   │   ├── page.tsx             # 검색 + 후보 등록 (F-01~F-05, F-11~F-12)
│   │   ├── tournament/page.tsx  # 토너먼트 (F-06~F-09)
│   │   └── result/page.tsx      # 결과 (F-10, F-13)
│   ├── components/              # Presentation · 재사용 UI
│   │   ├── search/{SearchBar,SearchResults}.tsx
│   │   ├── candidate/{CandidatePool,GameCard}.tsx
│   │   ├── tournament/{TournamentBoard,MatchCard}.tsx
│   │   ├── result/ResultScreen.tsx
│   │   └── ui/ErrorBanner.tsx
│   ├── modules/                 # Business
│   │   ├── searchModule.ts
│   │   ├── candidateModule.ts
│   │   ├── tournamentModule.ts
│   │   └── resultModule.ts
│   ├── store/stateStore.ts      # Data (Zustand)
│   ├── lib/externalApiClient.ts # Data (RAWG)
│   ├── hooks/{useDebounce,useSearchQuery}.ts
│   ├── types/game.ts            # Game / TournamentPair / ApiError
│   └── utils/{shuffle,buildPairs}.ts
└── tests/
    ├── unit/{shuffle,buildPairs,candidateModule,tournamentModule,useDebounce}.test.ts
    └── e2e/full-flow.spec.ts
```

---

## 6. 요구사항 → 구현 단위 매핑

PRD Iteration 3 v3.0 기준. 모든 F-/NF- 항목은 코드 위치를 가져야 한다.

| ID | 기능 | UC | 구현 위치 |
| --- | --- | --- | --- |
| F-01 | 게임 검색 | UC-01 | `hooks/useSearchQuery.ts` → `modules/searchModule.ts` → `lib/externalApiClient.ts` |
| F-02 | 검색 결과 표시 | UC-01 | `components/search/SearchResults.tsx` |
| F-03 | 후보 등록 | UC-02 | `modules/candidateModule.ts::addToPool` |
| F-04 | 중복 등록 방지 | UC-02 | `modules/candidateModule.ts::isDuplicate` |
| F-05 | 후보 삭제 | UC-02 | `modules/candidateModule.ts::removeFromPool` |
| F-06 | 토너먼트 시작 | UC-03 | `modules/tournamentModule.ts::startTournament` (`canStartTournament` 가드) |
| F-07 | 1:1 대결 + 선택 | UC-03 | `components/tournament/TournamentBoard.tsx` + `tournamentModule.ts::selectWinner` |
| F-08 | 라운드 자동 진행 | UC-03 | `tournamentModule.ts::advanceRound` + `isComplete` |
| F-09 | 부전승 처리 | UC-03 | `utils/buildPairs.ts` + `tournamentModule.ts::handleBye` (`TournamentPair.isBye`) |
| F-10 | 결과 화면 | UC-04 | `app/result/page.tsx` + `components/result/ResultScreen.tsx` + `resultModule.ts::getWinner` |
| F-11 | API 오류 안내 | UC-01 | `lib/externalApiClient.ts::handleError` + `components/ui/ErrorBanner.tsx` |
| F-12 | 빈 검색어 처리 | UC-01 | `modules/searchModule.ts::validateQuery` |
| F-13 | 새 토너먼트 시작 | UC-04 | `resultModule.ts::startNewTournament` → `stateStore.resetAll` |
| NF-01 | 응답성 (1초) | - | `hooks/useDebounce.ts` (300ms) + TanStack Query 캐시 히트 |
| NF-02 | 안정성 (중복 입력) | - | `tournamentModule.ts` 입력 잠금 플래그 (구현 시) |
| NF-03 | 브라우저 호환성 | - | Next.js / Tailwind 기본 호환 행렬 + Playwright 시나리오 |
| NF-04 | 확장성 (모듈 분리) | - | 3계층 디렉터리 분리 자체로 충족 |
| NF-05 | 외부 호출 최소화 | UC-01 | `stateStore.searchCache` + TanStack Query staleTime |

---

## 7. 마일스톤 (Phase)

| Phase | 목표 | 주요 산출물 | 검증 |
| --- | --- | --- | --- |
| **0. Scaffolding** | Next.js + TS + Tailwind + Zustand + TanStack Query 초기화, 3계층 디렉터리·타입·스토어 스켈레톤 | `package.json`, `src/*` 스켈레톤, `utils/shuffle.ts`·`buildPairs.ts` 동작 구현 | `npm run typecheck && npm test && npm run build` 통과 |
| **1. 검색·후보** | F-01~F-05, F-11, F-12 구현 | `SearchBar` + `SearchResults` + `CandidatePool` + `searchModule` + `candidateModule` + `externalApiClient` | IT-01·02 통과, 빈 검색어/오류 처리 검증 |
| **2. 토너먼트** | F-06~F-09 구현 | `TournamentBoard` + `MatchCard` + `tournamentModule` 전체 + `stateStore` 라운드 흐름 | IT-03·04, UT-06~08 통과 |
| **3. 결과·재시작** | F-10, F-13 구현 | `ResultScreen` + `resultModule` + `stateStore.resetAll` | IT-05 통과 |
| **4. 테스트 정비** | UT·IT·ET 커버리지 ≥ 80% | 단위·통합·예외 테스트 본문 + Playwright E2E | `vitest --coverage` 통과 |
| **5. Iteration 4 분기** | 결과 저장·공유·랭킹 도입 (Supabase) | 신규 PRD/UML 분기 + Supabase 클래스 추가 | iteration-update-guide 규칙 따름 |

---

## 8. 테스트 전략

기준: `01-prd/iteration-1.md` §3 테스트 항목 정의서. Iteration 3 PRD에 맞춰 ID 재배치.

| 유형 | 도구 | 범위 |
| --- | --- | --- |
| 단위 (Unit) | Vitest + jsdom | `shuffle`, `buildPairs`, 모듈별 로직, `useDebounce` |
| 통합 (Integration) | Vitest + React Testing Library | 검색→후보→토너먼트→결과 풀 플로우 |
| 예외 (Exception) | Vitest | API 500, 빈 검색어, 다중 클릭, 중복 등록 |
| E2E | Playwright | 실 브라우저 시나리오 (IT-01~05) |

**통과 기준:** 단위 커버리지 ≥ 80% (핵심 로직), 정의된 TC 전부 Pass, ESLint·TS 컴파일 에러 0건.

---

## 9. 이터레이션 갱신 프로세스 요약

> 상세 규칙: [`../05-process/iteration-update-guide.md`](../05-process/iteration-update-guide.md)

핵심 원칙:
- **사소한 이탈** → [`changelog.md`](./changelog.md) `Unreleased` 섹션에 항목 추가.
- **표가 통째로 바뀌는 변경** → [`../05-process/iteration-template.md`](../05-process/iteration-template.md)를 복사해 `01-prd/iteration-N.md` 신규 생성.
- **UML 다이어그램 변경** → v1.x 마이너 또는 v2.0 메이저로 분기, 변경 이력 표 갱신.
- **새 외부 의존성·서비스 도입** → [`../06-setup/`](../06-setup/)에 설정 가이드 + [`../07-tech-rationale/README.md`](../07-tech-rationale/README.md)에 선택 근거 누적.

---

## 10. 서브에이전트 위임 규칙

상세는 프로젝트 루트 [`../../CLAUDE.md`](../../CLAUDE.md) 참조.

| 분야 | 에이전트 | 트리거 예시 |
| --- | --- | --- |
| PRD 갱신 | `docs-prd` | "Iteration 4 PRD 만들어줘", "F-XX 추가/변경" |
| UML 갱신 | `docs-uml` | "클래스 다이어그램에 Supabase 추가", "v1.2 갱신" |
| UC 갱신 | `docs-usecase` | "새 UC 추가", "Fully Dressed 갱신" |
| Changelog 관리 | `docs-changelog` | "이번 변경 changelog에 기록", "Unreleased 정리" |
| 설정 가이드 | `docs-setup` | "Supabase 설치 가이드 추가", "GCP 설정 안내 작성" |
| 기술 근거 | `docs-tech-rationale` | "신규 라이브러리 도입 근거 추가" |
| 코드 구현 | `code` | "F-XX 구현해줘", "스토어 채우기" |
| Git/GitHub | `github` | "커밋", "PR 생성", "main 브랜치 푸시" |

---

> 본 문서는 베이스라인 변경 시 §2와 §6 매핑 표를 우선 동기화한다.
