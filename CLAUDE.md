# GameCup — Claude Code 작업 가이드

> 본 문서는 Claude Code(또는 Claude API 기반 에이전트)가 GameCup 프로젝트에서 작업할 때 참조하는 **마스터 가이드**다.
> 단일 진실 공급원: [`docs/04-plan/master-plan.md`](docs/04-plan/master-plan.md)

---

## 1. 프로젝트 한눈에 보기

- **목적:** 사용자가 직접 토너먼트로 자신의 게임 취향을 가리는 인터랙티브 웹 서비스
- **현재 베이스라인:** PRD Iteration 3 (v3.0) · UML v1.1 · UC v1.0/v1.1
- **스택:** Next.js 14 (App Router) · TypeScript · Tailwind · Zustand · TanStack Query v5 · RAWG API · Vitest · Playwright · (Iteration 4+) Supabase · Sentry · Vercel
- **아키텍처:** 3계층 (Presentation / Business / Data) · 6 모듈

자세한 내용:
- [`docs/04-plan/master-plan.md`](docs/04-plan/master-plan.md) — 마스터 플랜
- [`docs/04-plan/changelog.md`](docs/04-plan/changelog.md) — 누적 변경 이력
- [`docs/01-prd/iteration-3.md`](docs/01-prd/iteration-3.md) — 현 베이스라인 PRD
- [`docs/03-design/uml-v1.1.md`](docs/03-design/uml-v1.1.md) — UML 다이어그램
- [`docs/05-process/iteration-update-guide.md`](docs/05-process/iteration-update-guide.md) — 새 이터레이션 분기 규칙

---

## 2. 작업 위임 규칙 (Subagent Roster)

본 프로젝트는 **9개의 분야별 서브에이전트**를 정의한다. 사용자 요청을 받으면 트리거 키워드와 작업 성격을 매칭해 해당 에이전트에 위임한다. 정의 본문은 [`.claude/agents/`](.claude/agents/).

| 에이전트 | 분야 | 트리거 예시 | 산출물 위치 |
| --- | --- | --- | --- |
| `docs-prd` | PRD 갱신 | "Iteration 4 PRD", "F-XX 추가", "기능 요구사항 변경" | `docs/01-prd/iteration-N.md` |
| `docs-uml` | UML 다이어그램 | "UML v1.2", "클래스 다이어그램 수정", "Supabase 클래스 추가" | `docs/03-design/uml-vX.Y.md` |
| `docs-usecase` | 유즈케이스 | "UC-05 추가", "Fully Dressed 갱신", "단계형 UC 추가" | `docs/02-usecase/{fully-dressed,stepwise}.md` |
| `docs-changelog` | 변경 이력 | "changelog 기록", "Unreleased 정리", "이터레이션 분기 시 항목 이동" | `docs/04-plan/changelog.md` |
| `docs-setup` | 환경 설정 가이드 | "Supabase 설치 가이드", "GCP 설정 안내", "Sentry 도입 절차" | `docs/06-setup/*.md` |
| `docs-tech-rationale` | 기술 선택 근거 | "라이브러리 도입 근거 추가", "왜 X를 썼는지 기록" | `docs/07-tech-rationale/README.md` |
| `code` | 코드 구현 | "F-XX 구현", "모듈 채우기", "리팩토링" | `src/**`, `tests/**` |
| `github` | Git/GitHub 운영 | "커밋", "PR 생성", "푸시", "git init" | (Git 메타데이터·PR) |
| `issue-branch` | 이슈·브랜치 운영 | "Sprint N 브랜치 분기", "이슈 목록", "이슈-브랜치 매핑" | GitHub Issues/Branches |

### 위임 결정 트리

```
사용자 요청
  │
  ├─ "구현"/"버그 수정"/"코드 작성" → code
  ├─ "커밋"/"푸시"/"PR 생성·머지" → github
  ├─ "이슈 목록"/"Sprint N 브랜치"/"이슈-브랜치 매핑" → issue-branch
  ├─ "PRD"/"기능 추가"/"요구사항" → docs-prd
  ├─ "UML"/"클래스/시퀀스/액티비티" → docs-uml
  ├─ "UC"/"유즈케이스" → docs-usecase
  ├─ "changelog"/"이력" → docs-changelog
  ├─ "설치 가이드"/"환경 설정"/"GCP/DB/Supabase 설정" → docs-setup
  ├─ "기술 선택 이유"/"라이브러리 근거" → docs-tech-rationale
  └─ 그 외 → 분류 곤란 시 사용자에게 명확화 요청
```

### 다중 에이전트 작업

- 새 외부 의존성(예: Supabase) 도입은 보통 **여러 에이전트 협업**: `docs-tech-rationale` (근거) → `docs-setup` (설정 가이드) → `docs-prd` (필요 시 PRD 분기) → `docs-uml` (필요 시 클래스 추가) → `code` (구현) → `docs-changelog` (이력) → `github` (커밋).
- 코드 작업 중 PRD 이탈 발견 시: `code` 작업을 마친 뒤 `docs-changelog`에 `[Unreleased]` 항목으로 즉시 기록.

---

## 3. 추가 작업 (코드 외) 안내 문서 의무화

다음 종류의 작업은 **매번 상세 안내 문서를 함께 작성**한다. 작성 위임: `docs-setup`.

| 작업 유형 | 문서 위치 |
| --- | --- |
| 외부 SaaS 계정 발급 (RAWG, Supabase, Sentry, Vercel, GCP 등) | `docs/06-setup/<service>-setup.md` |
| 환경 변수 추가 (.env.local) | 해당 service-setup.md + `.env.local.example` 갱신 |
| 데이터베이스 스키마 생성·마이그레이션 | `docs/06-setup/<db>-schema.md` + 마이그레이션 파일 |
| 브라우저 바이너리·CLI 도구 설치 | `docs/06-setup/<tool>-install.md` |
| CI/CD 파이프라인 설정 | `docs/06-setup/<platform>-cicd.md` |
| GCP/AWS 등 인프라 리소스 생성 | `docs/06-setup/<cloud>-resource.md` |

작성 표준 8개 섹션: **개요 / 도입 시점 / 사전 요구사항 / 단계별 설치·설정 / 환경 변수 / 검증 / 트러블슈팅 / 참고 자료** (상세는 [`docs/06-setup/README.md`](docs/06-setup/README.md)).

---

## 4. 기술 스택·라이브러리 도입 근거 의무화

새 라이브러리·도구·외부 서비스를 도입할 때마다 [`docs/07-tech-rationale/README.md`](docs/07-tech-rationale/README.md)에 다음 정보를 누적한다. 작성 위임: `docs-tech-rationale`.

- **도입 시점** (Iteration / Phase / 날짜)
- **선택 이유** (1~3개 핵심 근거)
- **고려한 대안** + 탈락 이유
- **트레이드오프** (감수하는 단점)
- **교체 비용** (낮음/중간/높음)
- **관련 요구사항** (F-XX / NF-XX / UC-XX)
- **관련 가이드** (06-setup/ 링크)

---

## 5. 코딩 컨벤션

| 항목 | 규칙 |
| --- | --- |
| 파일명 | kebab-case (예: `tournament-module.ts`는 ❌, `tournamentModule.ts`는 ✅ — 모듈은 camelCase. 컴포넌트는 PascalCase) |
| 컴포넌트 | PascalCase + 폴더 분류 (`components/search/SearchBar.tsx`) |
| 모듈/스토어 | camelCase (`searchModule.ts`, `stateStore.ts`) |
| 타입 | PascalCase, `types/` 폴더 집중 (`Game`, `TournamentPair`, `ApiError`) |
| Path alias | `@/*` → `src/*` |
| 3계층 호출 방향 | Presentation → Business → Data (역방향·건너뛰기 금지) |

---

## 6. 테스트 정책

- 단위 테스트(Vitest)는 모든 `modules/`, `utils/`, `store/` 변경 시 추가
- 핵심 로직(셔플·페어 생성·라운드 진행) 커버리지 **≥ 80%**
- 통합 테스트(RTL)는 사용자 시나리오(UC) 단위
- E2E(Playwright)는 Phase 4부터 풀 플로우 (IT-01~05)

---

## 7. 변경 시 즉시 갱신해야 할 파일

코드를 수정했을 때 다음 파일들의 정합성을 확인한다.

| 변경 종류 | 동기화 대상 |
| --- | --- |
| 모듈 메서드 시그니처 변경 | UML v1.x → v1.(x+1) [`docs/03-design/uml-vX.Y.md`](docs/03-design/uml-v1.1.md) |
| 신규 F-XX 또는 NF-XX | PRD 새 이터레이션 또는 changelog `[Unreleased]` |
| 신규 라이브러리 추가 | [`docs/07-tech-rationale/README.md`](docs/07-tech-rationale/README.md) + [`docs/06-setup/`](docs/06-setup/) (필요 시) |
| 새 외부 의존성 | 위 + `.env.local.example` |
| 폴더 구조 변경 | [`docs/04-plan/master-plan.md`](docs/04-plan/master-plan.md) §5 |

---

## 8. 자주 쓰는 명령

```bash
npm install              # 의존성 설치
npm run dev              # 개발 서버 (포트 3000)
npm run build            # 프로덕션 빌드
npm run typecheck        # TS 타입 검사
npm run lint             # ESLint
npm test                 # Vitest 실행
npm run test:coverage    # 커버리지 리포트
npm run e2e              # Playwright (Phase 4 이후)
```

---

## 9. 안전 가드레일

- **릴리즈된 이터레이션 PRD 수정 금지** — 항상 새 파일로 분기
- **`.env.local` 커밋 금지** — `.gitignore`에 포함되어 있음
- **API 키 하드코딩 금지** — 반드시 환경 변수 경유
- **Force push 금지** — `github` 에이전트는 사용자 명시 승인 없이는 force push하지 않음
- **계층 건너뛰기 금지** — Presentation이 `lib/externalApiClient.ts`를 직접 import하지 말 것
- **이슈 자동 멘션** — 작업 브랜치(`<type>/<number>-...`)에서 커밋 시 `.husky/prepare-commit-msg`가 제목에 `(#N)` 자동 부착. 통합 브랜치(`dev`)에서는 본문 `Refs: #N` 또는 PR 본문 `Closes #N`으로 명시 (`github` 에이전트가 처리)
- **브랜치 명명 규칙** — `<type>/<issue-number>-<slug>` (예: `feat/5-game-search-dropdown`). 한글 브랜치명 금지. 일괄 분기는 `issue-branch` 에이전트에 위임

---

> 본 문서가 변경되면 [`docs/04-plan/changelog.md`](docs/04-plan/changelog.md)에 기록한다.
