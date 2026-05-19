# GameCup Change Log

> 본 문서는 PRD·UML·UC·기술 스택의 모든 변경 이력을 누적한다.
> 작성 형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 변형. 코드 작업 중 발견된 이탈은 `[Unreleased]` 섹션에 즉시 기록 → 일정 분량 이상 쌓이면 [`../05-process/iteration-update-guide.md`](../05-process/iteration-update-guide.md) 규칙에 따라 새 이터레이션 문서로 분기한다.

---

## [Unreleased — Iteration 4 후보]

코드 작업 중 발견된 PRD/설계 이탈 사항을 누적 기록한다. 충분히 쌓이면 [`../05-process/iteration-template.md`](../05-process/iteration-template.md)를 복사해 `01-prd/iteration-4.md` 등을 분기 생성한다.

### Added
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
- `package.json`: `prepare` 스크립트 추가, `husky` `lint-staged` devDependency 추가, `lint-staged` 설정 블록 추가
- `CLAUDE.md` — 에이전트 로스터를 8개에서 **9개**로 확장(`issue-branch` 추가), 위임 결정 트리·안전 가드레일에 이슈 자동 멘션·브랜치 명명 규칙 추가
- `.claude/agents/github.md` — 이슈 자동 멘션 메커니즘 + 통합 브랜치 `Refs:` 작성 규칙 추가, `issue-branch`와 책임 분담 명시
- `docs/06-setup/git-hooks.md` — `prepare-commit-msg` 동작·스킵 조건·동작 확인 절차 추가

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
