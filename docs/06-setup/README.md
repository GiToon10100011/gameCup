# ⚙️ 환경 설정·초기화 가이드 인덱스

> 본 폴더는 GameCup 프로젝트의 **모든 환경 설정·초기화 절차**를 보관한다.
> 코드 외에 추가로 수행해야 하는 작업(외부 API 키 발급, 인프라 설정, DB 초기화 등)은 **새 의존성이 도입될 때마다** 이 폴더에 가이드 파일을 추가한다.

---

## 작성 원칙

1. **재현 가능성:** 새 팀원이 zero-state에서 가이드만 따라 환경을 재현할 수 있어야 한다.
2. **상세성:** "왜 이 단계를 수행하는지"까지 서술. 단순 명령어 나열 금지.
3. **검증 단계 포함:** 각 가이드 말미에 "정상 동작 확인" 검증 절차 명시.
4. **버전 명시:** Node/패키지/외부 SaaS 버전을 명시해 미래의 호환성 추적이 가능하게 한다.
5. **시크릿 분리:** API 키·토큰은 반드시 `.env.local`에 두고, 공유 가능한 placeholder는 `.env.local.example`에 둔다.

---

## 가이드 목록

| 파일 | 대상 | 도입 시점 | 상태 |
| --- | --- | --- | --- |
| [`initial-setup.md`](./initial-setup.md) | 로컬 개발 환경 (Node, npm, 의존성, dev 서버) | Iteration 3 / 2026.05.19 | 활성 |
| [`rawg-api-key.md`](./rawg-api-key.md) | RAWG API 키 발급 + `.env.local` 설정 | Iteration 1 / 2026.03.31 | 활성 |
| [`git-hooks.md`](./git-hooks.md) | Husky + lint-staged 로컬 hook 설정 | Iteration 3 / 2026.05.19 | 활성 |
| [`github-actions.md`](./github-actions.md) | GitHub Actions CI 워크플로우 (lint·typecheck·test·build·hook 무결성) | Iteration 3 / 2026.05.19 | 활성 |
| [`supabase-setup.md`](./supabase-setup.md) | Supabase 프로젝트 생성·매직 링크 인증·DB 스키마(tournaments·tournament_results·public_shares)·RLS 정책·환경 변수 | Iteration 4 / 2026.05.25 | 활성 |
| `sentry-setup.md` | Sentry DSN 발급·Next.js 통합·소스맵 업로드 | Iteration 4 (예정) | 미작성 |
| `vercel-deploy.md` | Vercel 연동·환경 변수·프리뷰 배포 | Iteration 4 (예정) | 미작성 |
| `playwright-e2e.md` | Playwright 브라우저 바이너리 설치·로컬 실행 | Phase 4 (테스트 정비) | 미작성 |
| [`linear-cycles.md`](./linear-cycles.md) | Linear Cycle(Sprint) cadence 초기화 (4주·일요일 시작·첫 사이클 2026-05-24·웹 UI 절차) | Phase 0 후속 / 2026.05.21 | 활성 |
| [`github-actions-coderabbit-notify.md`](./github-actions-coderabbit-notify.md) | CodeRabbit 리뷰 완료 자동 감지 → 라벨 + 알림 (체크 success 게이트, 향후 auto-fix 업그레이드) | Phase 1 / 2026.05.24 | 활성 (main 도달 후 발동) |

> 새 외부 의존성·도구 도입 시 본 표에 행을 추가한 뒤 `docs-setup` 에이전트에 가이드 작성을 위임한다.

---

## 신규 가이드 작성 시 표준 섹션

새 가이드 파일을 만들 때 다음 8개 섹션을 모두 포함한다.

1. **개요** — 이 의존성이 무엇이며 GameCup에서 어떤 역할을 하는지
2. **도입 시점** — 어느 이터레이션/Phase에서 왜 도입되었는지 + [`../07-tech-rationale/README.md`](../07-tech-rationale/README.md) 해당 섹션 링크
3. **사전 요구사항** — 계정·결제·승인 등 사전 조건
4. **단계별 설치/설정** — 명령어·스크린샷 위치·UI 클릭 경로
5. **환경 변수** — 키 이름·예시 값(가짜)·`.env.local`/`.env.local.example` 반영 방법
6. **검증** — 정상 동작 확인 명령어 또는 페이지
7. **트러블슈팅** — 알려진 함정 + 우회법
8. **참고 자료** — 공식 문서 링크
