# GameCup Change Log

> 본 문서는 PRD·UML·UC·기술 스택의 모든 변경 이력을 누적한다.
> 작성 형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 변형. 코드 작업 중 발견된 이탈은 `[Unreleased]` 섹션에 즉시 기록 → 일정 분량 이상 쌓이면 [`../05-process/iteration-update-guide.md`](../05-process/iteration-update-guide.md) 규칙에 따라 새 이터레이션 문서로 분기한다.

---

## [Unreleased — Iteration 4 후보]

코드 작업 중 발견된 PRD/설계 이탈 사항을 누적 기록한다. 충분히 쌓이면 [`../05-process/iteration-template.md`](../05-process/iteration-template.md)를 복사해 `01-prd/iteration-4.md` 등을 분기 생성한다.

### Added
- **`tailwind-variants` + `tailwind-merge` 도입** (PR #64 리뷰 피드백): SearchDropdown의 4가지 상태 공통 스타일을 slots/variants로 모듈화. 기술 근거 [`../07-tech-rationale/README.md`](../07-tech-rationale/README.md) §3에 누적, `.env.local.example`에 RAWG BASE_URL override 변수(`NEXT_PUBLIC_RAWG_BASE_URL`) 추가.
- **글로벌 에이전트 `project-bootstrap`** 신규 — 모든 신규 프로젝트의 PRD→이슈 분해·GitHub MCP 등록·docs 구조 자동 부트스트랩 담당. 위치: `~/.claude/agents/project-bootstrap.md` (사용자 레벨, 모든 프로젝트 공용). **프로필 시스템(mini/lite/standard/full)** 도입 — default `lite`, 매번 확인.
- **글로벌 에이전트 `docs-builder`** 신규 — PRD/아이디어 기반 후속 문서(API 명세·용어집·ADR·테스트 계획·페르소나·DB 스키마·모듈 설계·아키텍처 문서 등) 단계적 확장. 전담 영역(PRD/UML/UC)은 기존 에이전트에 위임 안내. 위치: `~/.claude/agents/docs-builder.md`
- **`docs/04-plan/issues.md`** — 루트의 `issues.md`를 docs 트리 안으로 이동·정리 (청사진 위치 표준화)
- **Sprint 1 이슈→브랜치 일괄 분기** (EPIC-01, #1·#5~#22 총 18개 브랜치) dev(55fb47d) 기준 생성
- **신규 에이전트 `issue-branch`** — GitHub Issues/Projects·스프린트 브랜치 운영 담당 ([`../../.claude/agents/issue-branch.md`](../../.claude/agents/issue-branch.md))
- **Husky `prepare-commit-msg` 훅** — 작업 브랜치 커밋 시 제목 끝에 `(#N)` 자동 부착 ([`../../.husky/prepare-commit-msg`](../../.husky/prepare-commit-msg))
- **Sprint 1 이슈-브랜치 매핑 문서** [`./sprint-1-mapping.md`](./sprint-1-mapping.md)
- **운영 체크리스트** [`./next-actions.md`](./next-actions.md) 신설 — Phase 0 직후 사용자가 직접 처리할 블로킹/권장 작업 + Phase 1+ 참조 링크
- **Husky 9.x + lint-staged 15.x** 도입: pre-commit hook(`.husky/pre-commit`)에서 staged TS/TSX 파일에 `eslint --fix --max-warnings=0` 자동 실행
- **GitHub Actions CI 워크플로우** ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)):
  - `verify` 잡: `npm ci` → lint → typecheck → test → build (Node 20, npm 캐시)
  - `hook-verify` 잡: `.husky/pre-commit` 실행 권한 + `lint-staged` 호출 가능성 + PR diff 대상 dry run
- 설정 가이드 [`../06-setup/git-hooks.md`](../06-setup/git-hooks.md), [`../06-setup/github-actions.md`](../06-setup/github-actions.md)
- 기술 근거 [`../07-tech-rationale/README.md`](../07-tech-rationale/README.md) §12 (Husky · lint-staged · GitHub Actions)

### Changed
- **인터페이스 `I` 접두사 + 블록 주석 컨벤션 영구 적용** (사용자 영구 원칙, PR #63 리뷰 + 2026.05.20): TypeScript `interface`는 항상 `I` 접두사(예: `ISearchInputProps`), `type`/컴포넌트는 영향 없음. 새 코드 블록(함수·effect·분기·jsx·테스트)마다 한국어 주석 필수(교육·포트폴리오 목적, 보안 우려 없음). `CLAUDE.md` §5·`.claude/agents/code.md`·글로벌 `project-bootstrap`·사용자 메모리(`feedback_interface_i_prefix.md`, `feedback_block_comments_required.md`)에 명문화.
- **`gh` CLI 우선 + PR/이슈 템플릿 우선 영구 적용** (사용자 영구 지시, 2026.05.20): 이슈·PR 생성·머지·코멘트는 `gh` CLI 1순위(MCP는 fallback). 본문은 `.github/pull_request_template.md`와 `.github/ISSUE_TEMPLATE/*.md` 골격을 우선 따르고 추가 정보 덧붙임. `CLAUDE.md` §9·`.claude/agents/github.md`·글로벌 `project-bootstrap` §9.5와 사용자 메모리(`feedback_gh_cli_preferred.md`, `feedback_use_github_templates.md`)에 명문화.
- **PR 위계 흐름 영구 적용** (사용자 영구 지시, 2026.05.20): Task PR → Story 브랜치, Story PR → Epic 브랜치, Epic PR → dev. Epic/Story 브랜치는 자식 PR이 모이는 통합 베이스로 코드 작성보다는 머지 후 보완 작업만. `CLAUDE.md` §9·`.claude/agents/{issue-branch,github}.md`·`docs/04-plan/sprint-1-mapping.md`에 명문화, 글로벌 `project-bootstrap` §9.5와 사용자 메모리 `feedback_pr_hierarchy_flow.md`에도 저장.
- `package.json`: `prepare` 스크립트 추가, `husky` `lint-staged` devDependency 추가, `lint-staged` 설정 블록 추가
- `CLAUDE.md` — 에이전트 로스터를 8개에서 **9개**로 확장(`issue-branch` 추가), 위임 결정 트리·안전 가드레일에 이슈 자동 멘션·브랜치 명명 규칙 추가
- `.claude/agents/github.md` — 이슈 자동 멘션 메커니즘 + 통합 브랜치 `Refs:` 작성 규칙 추가, `issue-branch`와 책임 분담 명시
- `docs/06-setup/git-hooks.md` — `prepare-commit-msg` 동작·스킵 조건·동작 확인 절차 추가
- `CLAUDE.md` — 글로벌 `project-bootstrap`·`docs-builder` 안내 추가, 위임 결정 트리에 신규 프로젝트 초기화·문서 확장 라우팅 추가
- `.claude/agents/issue-branch.md` · `.claude/agents/github.md` · `docs/04-plan/sprint-1-mapping.md` — `issues.md` 참조 경로를 `docs/04-plan/issues.md`로 갱신
- `docs/README.md` — issues.md 새 위치 + 이슈 청사진 빠른 진입점 추가
- **PR #64 리뷰 반영** (SearchDropdown, 2026.05.20):
  - `src/components/search/SearchDropdown.tsx`: props `games` → `gameArray`(복수형 대신 자료형 명시), `tailwind-variants` slots/variants로 컨테이너·메시지·항목·썸네일·이름 5개 slot 추출
  - `src/lib/externalApiClient.ts`: `RAWG_BASE_URL` 상수를 `NEXT_PUBLIC_RAWG_BASE_URL` env로 분리(미설정 시 공식 호스트 fallback)
  - `src/modules/tournamentModule.ts`: filter/forEach/map 콜백 매개변수 `m` → `match` 명시화
  - `tests/unit/components/search/SearchDropdown.test.tsx`: Vitest/RTL 각 import 심볼·매처 역할을 학습용 주석으로 보강, 신규 props 이름 반영
- **PR #64 후속 리뷰 반영** (variants 분리, 2026.05.20):
  - `src/components/search/SearchDropdown.variants.ts` 신규 — `tv()` 정의를 컴포넌트 파일에서 분리(`dropdownVariants` export)
  - `CLAUDE.md` §5 코딩 컨벤션에 "스타일 variants 분리" 규칙 영구 추가
  - 사용자 메모리 `feedback_variants_separate_file.md` 신설 — 모든 프로젝트 공통 컨벤션화
- **Task #11 — `searchGames()` 단위 테스트** (2026.05.20):
  - `tests/unit/lib/externalApiClient.test.ts` 신규 — `fetchGames` 5건 (정상 정규화 / null thumbnail fallback / HTTP 500 → ExternalApiError / API 키 누락 즉시 throw / BASE_URL override)
  - `tests/unit/searchModule.test.ts` 신규 — `validateQuery`·`search` 8건 (빈/공백 검색어 차단 / 캐시 적중 NF-05 / 캐시 미스 → fetch + 저장 / 동일 검색어 재호출 시 외부 호출 0)
  - 외형(`fetchGames`/`search`)은 이미 UML v1.1과 일치하는 상태로 존재했으며, 본 Task에서 동작 검증을 단위 테스트로 보강
- **Task #12 — 세션 내 검색 결과 캐싱 (Map 기반)** (2026.05.20):
  - `tests/unit/stateStore.cache.test.ts` 신규 (6 tests) — store 레벨 캐시 동작 직접 검증: 초기 undefined / 저장-조회 라운드트립 / 검색어별 격리 / setCache가 새 Map 인스턴스 생성(React 리렌더 트리거) / 동일 검색어 덮어쓰기 / resetAll 후 캐시 비움 + 재사용 가능
  - 캐시 로직 자체(`searchCache: Map<string, IGame[]>` + `getCache`/`setCache`)는 이미 UML v1.1 §StateStore와 일치하게 구현되어 있었으며, 본 Task에서 store 레벨 동작 보증을 추가
- **PR 머지 후 이슈 자동 close 컨벤션 영구화** (사용자 영구 지시, 2026.05.20):
  - `Closes #N` 자동 닫힘은 PR base가 default branch일 때만 동작 → 본 프로젝트의 PR 위계 흐름(Task PR → Story 브랜치)에서는 자동 close 미동작. `github` 에이전트가 머지 직후 본문의 `Closes` 토큰을 파싱해 `gh issue close <N> --reason completed`로 직접 닫고 사용자에게 보고
  - `CLAUDE.md` §9 안전 가드레일 + `.claude/agents/github.md` §PR 절차 4에 명문화
  - 사용자 메모리 `feedback_pr_merge_auto_close.md` 신설 (모든 프로젝트 공통)
  - 밀려 있던 #9, #10, #11 수동 close 완료
- **Task #13 — 검색 응답 시간 측정 (NF-01)** (2026.05.20):
  - `src/utils/measureAsync.ts` 신규 — `measureAsync(fn, onMeasure)` 범용 비동기 시간 측정 유틸 (성공/실패 모두 측정, `performance.now()` 우선, `Date.now()` fallback)
  - `src/modules/searchModule.ts` — `SEARCH_RESPONSE_TIME_BUDGET_MS = 1000` 상수, 모듈 내부 `lastSearchDurationMs` + `getLastSearchDurationMs()` getter, `resetSearchDurationMeasurement()`, search() 캐시 미스 분기에서 `measureAsync`로 응답 시간 측정. 임계치(1000ms) 초과 시 `console.warn`, 그 이하는 `console.debug` (production 환경에서는 로깅 생략)
  - `tests/unit/measureAsync.test.ts` 신규 (3 tests) — 성공/실패/0ms 케이스
  - `tests/unit/searchModule.test.ts` 확장 (+5 tests) — 임계치 상수 / 초기 null / 캐시 미스 시 측정 / NF-01 위반 경고 / 캐시 적중 시 측정 안 함 / 실패 시도 진단용 측정 보존
- **PR #74 (Story #5 통합) 리뷰 반영** (CodeRabbit 30건 중 동작/안전 영향분, 2026.05.21):
  - `src/components/search/SearchDropdown.tsx`: ARIA listbox/option 안 button 중첩 제거 — `<li role="option">`에 `tabIndex`·`onClick`·`onKeyDown` 직접 부여. 형제 파일 import도 `@/components/search/...` alias로 통일
  - `src/lib/externalApiClient.ts`: JSON 파싱 실패·`results` 형태 이상도 `ExternalApiError`로 통일해 상위가 단일 catch로 처리 가능
  - `src/utils/measureAsync.ts`: `onMeasure` 콜백이 throw해도 `fn`의 원래 성공/실패 의미가 오염되지 않도록 `safeMeasure()` 헬퍼로 격리
  - `src/modules/searchModule.ts`: 캐시 적중·빈 검색어 등 외부 호출 없는 분기에서 `lastSearchDurationMs`를 `null`로 명시 리셋 — "마지막 호출" 계약 유지
  - `src/hooks/useSearchQuery.ts`: `normalizedQuery = debouncedQuery.trim()`을 queryKey·queryFn·enabled 세 곳에 동일 적용해 정규화 일관성 확보
  - `.husky/prepare-commit-msg`: 첫 제목 탐색에서 공백 라인도 제외 (`grep -vE '^[[:space:]]*(#|$)'`)
  - `.claude/agents/issue-branch.md`: 이슈 조회·브랜치 생성을 `gh` CLI 1순위·MCP fallback으로 명문화 (`github.md`와 일치)
  - `CLAUDE.md` §5 파일명 규칙: kebab-case 강제가 아니라 카테고리별 관례(모듈/훅=camelCase, 컴포넌트=PascalCase, 문서=kebab-case)로 명확화
  - 문서 markdownlint 경고 정리: 코드 펜스 언어 명시(`text`), 헤더 후 빈 줄, 코드 스팬 공백 제거 (`docs/04-plan/{issues,sprint-1-mapping}.md`, `docs/06-setup/git-hooks.md`, `docs/07-tech-rationale/README.md`, `.claude/agents/github.md`)
  - `tests/unit/components/search/SearchInput.test.tsx`: 호출 횟수(`toHaveBeenCalledTimes(1)`) 단언 추가 — 회귀 방지
  - **기각:** 모든 `//` 주석을 `/* */` 블록 주석으로 강제 변환 제안 — 코드 블록마다 한국어 주석 정책은 형식이 아니라 위치를 강제하므로 현재 혼합 방식 유지 (사용자 결정)
  - **후속 이슈로 분리(#75):** `candidateModule`/`tournamentModule`/`useDebounce`의 `it.todo` 테스트 실구현 — 각 모듈의 본 구현 Task(#17, #23 등)와 함께 진행
- **Task #14 — API 호출 에러 핸들러 (try/catch + 상태 반영)** (Story #6 / F-11, 2026.05.24):
  - `src/store/stateStore.ts`: API 에러 상태 `apiError: IApiError | null` 필드 + `setApiError`/`clearApiError` 액션 추가. `initialState`에 포함돼 `resetAll`에서 함께 초기화. **(UML v1.1 §StateStore 시그니처 변경 → UML v1.2 분기 시 반영 대상)**
  - `src/modules/searchModule.ts`: `toApiError(error: unknown): IApiError` — 임의 throw 값을 표준 에러 형태로 정규화(`ExternalApiError`는 statusCode 보존, 일반 Error는 0, 그 외는 기본 문구). `searchWithErrorHandling(query)` — `search()`를 try/catch로 감싸 성공 시 `clearApiError`+결과 반환, 실패 시 `setApiError`+빈 배열 반환(graceful degradation, #16 오류 상태 안정성). **(UML §SearchModule 시그니처 변경 → UML v1.2 반영 대상)**
  - `src/hooks/useSearchQuery.ts`: `queryFn`을 `search` → `searchWithErrorHandling`로 교체 — 실제 View 호출 경로에서 에러가 store에 반영되도록 연결(ErrorMessage #15가 구독 예정)
  - `tests/unit/stateStore.error.test.ts` 신규 (5 tests) — apiError 초기 null / 반영·조회 / clear·setApiError(null) 해제 / resetAll 초기화
  - `tests/unit/searchModule.error.test.ts` 신규 (8 tests) — toApiError 3종 정규화 / 성공 시 결과+에러 해제 / 실패 시 빈 배열+상태 반영 / 실패 결과 캐시 미저장 / 실패→재시도 성공 복귀
- **Task #15 — ErrorMessage 컴포넌트 (인라인 오류 표시)** (Story #6 / F-11, 2026.05.24):
  - `src/components/ui/ErrorMessage.tsx`: `store.apiError`(Task #14)를 구독해 오류가 있으면 인라인 alert 표시, 없으면 렌더 안 함. `role="alert"`+`aria-live="assertive"`로 즉시 통지, statusCode>0일 때만 보조 코드 표기, 닫기(✕) 버튼은 `clearApiError` 호출. 3계층 준수(View는 store 상태만 구독).
  - `src/components/ui/ErrorMessage.variants.ts`: tailwind-variants 분리(컨벤션). **디자인 기준 `docs/03-design/DESIGN.md`(getdesign `clickhouse`)의 error 토큰 `#ef4444`(red-500 계열)** 적용. 닫기 버튼은 **a11y 오버라이드로 터치 타겟 ≥44×44px(`h-11 w-11`)** — ClickHouse 템플릿 36px가 WCAG 2.5.5 미만이라 인터랙티브 요소는 상향.
  - `tests/unit/components/ui/ErrorMessage.test.tsx` 신규 (6 tests) — null 미렌더 / role=alert 메시지 / statusCode 표기 분기 / 닫기→해제 / dismissible=false.
- **Task #16 — 오류 상태 안정성 테스트** (Story #6 / F-11, 2026.05.25):
  - `tests/unit/error-state-stability.test.tsx` 신규 (5 tests) — searchModule(`searchWithErrorHandling`) + stateStore(`apiError`) + ErrorMessage 컴포넌트 통합 검증: ① API 실패가 예외로 전파되지 않고 `[]`로 안전 응답 ② 오류가 기존 캐시·후보 상태를 훼손하지 않음 ③ 오류→ErrorMessage 자동 표시→성공 검색 시 배너 사라짐(라이브 구독, `act`로 재렌더 flush) ④ 연속 실패에도 매번 응답하며 최신 오류 반영 ⑤ 오류 중에도 후보 등록·삭제 등 다른 store 동작 정상.
  - Story #6(API 오류 안내) 자식 Task #14·#15·#16 **전부 완료** → Epic #1 통합 준비.
- **Story #6 통합 PR #88 리뷰 반영** (CodeRabbit Major 2건, 2026.05.25):
  - **3계층 준수:** `src/hooks/useApiError.ts` 신규 — Presentation(ErrorMessage)이 `stateStore`(Data)를 직접 구독하던 것을 Business 브릿지 훅으로 분리(useSearchQuery와 동일 패턴). `ErrorMessage.tsx`는 `useApiError()`만 의존.
  - **동시 요청 레이스 가드:** `searchModule.ts`에 `latestSearchRequestId` 도입 — `searchWithErrorHandling`이 자기 요청이 최신일 때만 `store`에 상태 반영. 늦게 끝난 과거 실패가 최신 성공의 `clearApiError`를 덮어쓰는 문제 차단. `searchModule.error.test.ts`에 레이스 가드 테스트 1건 추가.
- **Task #17 — 후보 목록 store 검증** (Story #7 / F-04·F-05, 2026.05.25):
  - `tests/unit/stateStore.candidates.test.ts` 신규 (7 tests) — 후보 store(`candidates`/`addCandidate`/`removeCandidate`/`getCandidates`) 동작 검증: 초기 빈 배열 / 등록 성공(true) / **중복 id 등록 거부(false, F-04)** / 서로 다른 id 누적 / 불변 업데이트(새 배열 참조) / 삭제 해당 id만(F-05)·없는 id 무변화 / resetAll 초기화·재등록.
  - 후보 store 자체(`candidates: IGame[]` + 액션)는 이미 UML v1.1 §StateStore와 일치하게 스캐폴딩돼 있었으며, 본 Task에서 store 레벨 동작 보증을 추가(#11/#12와 동일 패턴).
- **Task #18 — 후보 등록 액션(candidateModule.addToPool) 테스트** (Story #7 / F-03·F-04, 2026.05.25):
  - `tests/unit/candidateModule.test.ts` — `it.todo` 스텁을 실테스트로 구현(addToPool 부분): 신규 등록 시 `{ ok: true }`+추가(F-03) / 중복 id 시 `{ ok: false, reason: "duplicate" }`+무시(F-04) / 서로 다른 게임 연속 등록 성공. `removeFromPool`(#21)·`canStartTournament`(토너먼트)는 todo 유지.
  - 등록 액션 `addToPool`(store `addCandidate`를 discriminated union 결과로 래핑)은 Business 레이어에 이미 존재했고, 본 Task에서 동작(특히 F-04 중복 사유 반환) 검증을 추가.
- **Task #19 — 중복 알림 토스트 컴포넌트** (Story #7 / F-04, 2026.05.25):
  - `src/components/candidate/DuplicateToast.tsx` 신규 — `addToPool`이 `{ ok:false, reason:"duplicate" }`일 때 부모가 띄우는 일시 토스트. props 제어(`open`/`message`/`onClose`/`durationMs`), `durationMs`(기본 3s) 후 자동 닫힘. 비-긴급이라 `role="status"`+`aria-live="polite"`.
  - `src/components/candidate/DuplicateToast.variants.ts`: tailwind-variants 분리. **DESIGN.md(clickhouse) warning 토큰 `#f59e0b`(amber 계열)** — 중복은 에러(빨강)가 아닌 "주의"라 amber로 구분.
  - `tests/unit/components/candidate/DuplicateToast.test.tsx` 신규 (5 tests) — open false/true 표시·비표시 / 기본·커스텀 메시지 / durationMs 후 자동 onClose(fake timers) / open=false 시 타이머 미발동. (PR #91 리뷰: 타이머 latest-ref 패턴으로 인라인 onClose 재전달 시 리셋 방지 + 회귀 테스트 1건 추가 → 6 tests)
- **Task #20 — CandidateList 컴포넌트** (Story #7 / F-05, 2026.05.25):
  - `src/hooks/useCandidates.ts` 신규 — 후보 목록을 노출하는 Business 브릿지 훅(useApiError·useSearchQuery와 동일 패턴). 컴포넌트가 store(Data)를 직접 구독하지 않게 함(3계층 준수, PR #88 교훈).
  - `src/components/candidate/CandidateList.tsx` 신규 — 후보 목록을 `[썸네일 | 이름 | 삭제버튼]`으로 렌더. 빈 상태 안내, 썸네일/placeholder 분기(`next/image`), 삭제 버튼은 `onDelete(gameId)` prop으로 위임(동작 연결은 #22). 접근성: 삭제 버튼 터치 타겟 **≥44px**(a11y 오버라이드) + `aria-label`에 게임명 포함, `<ul role="list">` 시맨틱.
  - `src/components/candidate/CandidateList.variants.ts`: tailwind-variants 분리. DESIGN.md neutral 카드 톤 + 삭제 버튼 hover 시 error(red) 톤(destructive 의미).
  - `tests/unit/components/candidate/CandidateList.test.tsx` 신규 (4 tests) — 빈 상태 / 목록·이름 렌더 / 썸네일·placeholder 분기 / 삭제 버튼 onDelete(id) 위임.
  - Story #7(후보 등록·중복 방지) 자식 Task #17·#18·#19·#20 **컴포넌트·로직 전부 완료**(F-03 등록·F-04 중복·F-05 표시) → Story #7 통합 준비.
  - **범위 메모 (PR #93 리뷰):** Story #7 수용기준 중 *"후보 목록에 게임이 추가된 후 검색 드롭다운이 닫힌다"*(issues.md L231)는 컴포넌트 단위가 아니라 **페이지 배선 동작**이다(부모가 `SearchDropdown.isOpen`을 추가 성공 후 닫음). `SearchDropdown`은 `isOpen`을 부모 제어로 두고 있어, 이 닫힘 동작 + onSelect→addToPool→토스트/목록 연결은 **Epic #1 통합(메인 페이지 조립)** 에서 수행한다. 따라서 #17~#20 범위에는 미포함.
- **Task #21 — 후보 삭제 액션(candidateModule.removeFromPool) 테스트** (Story #8 / F-05, 2026.05.25):
  - `tests/unit/candidateModule.test.ts` — `removeFromPool` it.todo를 실테스트로 구현(3): 주어진 id만 제거(F-05) / 없는 id 삭제는 무변화(방어) / 삭제 후 같은 게임 재등록 가능. `canStartTournament`(토너먼트)는 todo 유지.
  - 삭제 액션 `removeFromPool`(store `removeCandidate` 위임)은 Business 레이어에 이미 존재했고, 본 Task에서 동작 검증을 추가. 삭제 버튼 **동작 연결**(CandidateList onDelete → removeFromPool)은 #22.

### Deprecated
- _(없음.)_

### Removed
- _(없음.)_

### Fixed
- _(없음.)_

---

## [Master Plan & Process v1.0] — 2026.05.19

### Added
- 마스터 플랜 [`./master-plan.md`](./master-plan.md) 신규 작성
- 본 changelog 신규 작성
- 이터레이션 갱신 가이드 [`../05-process/iteration-update-guide.md`](../05-process/iteration-update-guide.md) + 템플릿 [`../05-process/iteration-template.md`](../05-process/iteration-template.md) 작성
- 환경 설정 가이드 [`../06-setup/`](../06-setup/) 신설
- 기술 스택 선택 근거 [`../07-tech-rationale/README.md`](../07-tech-rationale/README.md) 신설
- 프로젝트 루트 `CLAUDE.md` + 프로젝트 전용 서브에이전트 8종 (`docs-prd`, `docs-uml`, `docs-usecase`, `docs-changelog`, `docs-setup`, `docs-tech-rationale`, `code`, `github`)
- Next.js 14 + TS + Tailwind + Zustand + TanStack Query v5 + Vitest + Playwright 코드 스캐폴딩 (3계층 6모듈 스켈레톤)

### Changed
- `docs/` 트리를 평면 구조에서 카테고리별 번호 prefix 폴더(`00-overview` ~ `07-tech-rationale`)로 재구성, 모든 한글 파일을 kebab-case 영문으로 개명

---

## [UML v1.2 — Draft] — 2026.05.17

> 본 버전은 외부 작성 후 세션 시작 시점에 발견됨. 코드 스캐폴딩(Phase 0)은 v1.1 구조를 따르며, v1.2 슬라이스 구조 적용은 사용자 승인 후 별도 작업으로 진행한다.

### Changed
- `StateStore` 단일 클래스를 4개 슬라이스(`CacheSlice` / `CandidateSlice` / `TournamentSlice` / `ResultSlice`)로 분리, Facade 패턴 적용
- 액티비티 다이어그램 분기 노드 7개 → 5개로 축소 (방어 분기 제거)
- 다이어그램별로 분산되어 있던 검증 표를 §4 "통합 검증" 섹션으로 통합

### Added
- 전체 플로우 개요 시퀀스 다이어그램 (UC 간 연결성 가시화)
- 비기능 요구사항 커버리지 표 (5/5, 표현 불가 항목은 검증 방식 명시)

---

## [UML v1.1] — 2026.05.12

### Changed
- 상태 다이어그램 → 액티비티 다이어그램 교체 (UC-03 다단계 분기 상세화)

### Added
- 3계층 아키텍처 검증 표 (Presentation/Business/Data 위반 여부 점검)
- 데이터 항목 일관성 검증 표 (모듈 설계서 ↔ 클래스 필드 매핑)

---

## [Iteration 3 / PRD v3.0] — 2026.04.14

> 유즈케이스 도출 중 발견된 4개 문제점(ISS-01~04) 반영.

### Added
- **CL-03:** F-13 (새 토너먼트 시작) 신규 — 결과 화면 사후 흐름 누락 해결 (ISS-01)
- 변경 이력 섹션, 단계형 상세 유즈케이스 문서 [`../02-usecase/stepwise.md`](../02-usecase/stepwise.md) v1.1
- Fully Dressed 유즈케이스 문서 [`../02-usecase/fully-dressed.md`](../02-usecase/fully-dressed.md) v1.0

### Changed
- **CL-01:** F-12 · F-13 (구 번호) 선택 → 핵심 상향 (ISS-02)
- **CL-02:** 구 F-07 + F-08 통합 → 신 F-07 "1:1 대결 진행 및 게임 선택" (ISS-03)
- **CL-04:** NF-05 표현 "결과 재사용" → "세션 내 API 응답 재활용" 명확화 (ISS-04)

### Renumbered
- **CL-05:** 구 F-08~F-13 → 신 F-08~F-13 재번호 (F-07 통합 + F-13 신규 추가 반영)

---

## [Iteration 2 / PRD v2.0] — 2026.04.07

### Changed
- v1.0 → v2.0: 기능/비기능 분리, 요구사항-구현 혼용 제거, 우선순위 재분류
- "주요 사용자" 섹션 추가

### Added
- "AI 활용 기록" 섹션 신규

---

## [Iteration 1 / PRD v1.0] — 2026.03.31

### Added
- PRD 초안 (F-01~F-04)
- 설계 문서 (기술 스택, 시스템 구성도, 컴포넌트·상태 관리·RAWG 연동 설계)
- 테스트 항목 정의서 (UT-01~10, IT-01~05, ET-01~05)
