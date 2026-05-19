# 🤖 GitHub Actions CI 워크플로우 가이드

> **도입 시점:** 2026.05.19 (Phase 0 스캐폴딩 마무리)
> **워크플로우 파일:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

---

## 1. 개요

PR/푸시 시점에 코드 품질(lint·typecheck·test·build)과 Husky hook 무결성을 자동 검증한다. 로컬 husky 우회 시도(`--no-verify` 등)가 발생해도 main 브랜치 품질을 보장하는 안전망.

---

## 2. 도입 시점

- **Phase 0 스캐폴딩 마무리** 시점
- 관련 기술 근거: [`../07-tech-rationale/README.md`](../07-tech-rationale/README.md) §GitHub Actions

---

## 3. 사전 요구사항

| 항목 | 비고 |
| --- | --- |
| GitHub 저장소 | 원격 푸시 후 자동 활성화. `github` 에이전트가 `git push -u origin main` 시점에 트리거. |
| Branch protection | (권장) Settings → Branches → `main` 보호 + 본 워크플로우의 `verify` 잡을 필수 통과로 지정 |

---

## 4. 워크플로우 구성

[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)는 2개 잡으로 구성된다.

### 4.1 `verify` — 코드 품질 4종 검증

| 단계 | 명령 | 검증 대상 |
| --- | --- | --- |
| 1 | `npm ci` | 의존성 무결성 (lockfile 일치) |
| 2 | `npm run lint` | ESLint (`next lint`) |
| 3 | `npm run typecheck` | `tsc --noEmit` |
| 4 | `npm test` | Vitest 단위 테스트 |
| 5 | `npm run build` | Next.js 프로덕션 빌드 |

### 4.2 `hook-verify` — Husky/lint-staged 설정 무결성

| 단계 | 검증 내용 |
| --- | --- |
| Pre-commit 존재성 | `.husky/pre-commit`이 실행 가능한지 (`test -x`) |
| lint-staged 호출 가능성 | `npx lint-staged --help` 동작 |
| PR diff 대상 dry run | 베이스 브랜치 대비 변경된 TS/TSX 파일에 ESLint 실행 |

---

## 5. 환경 변수 (워크플로우 내)

| 키 | 값 | 이유 |
| --- | --- | --- |
| `HUSKY` | `0` | CI 환경에서 husky의 prepare 스크립트가 git 환경 차이로 실패하는 것을 방지 |

---

## 6. 트리거 조건

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

- `main` 브랜치로의 직접 푸시
- `main`을 대상으로 하는 PR (open/synchronize/reopened)

추가로 `concurrency`로 동일 ref 진행 중인 워크플로우를 자동 취소 → 빠른 피드백 + 비용 절감.

---

## 7. 검증

워크플로우가 정상 동작하는지 확인하는 방법:

```bash
# 로컬에서 동일 명령을 순서대로 실행해 본다
npm ci
npm run lint
npm run typecheck
npm test
npm run build

# Husky hook 무결성
test -x .husky/pre-commit && echo OK
npx lint-staged --help > /dev/null && echo OK
```

원격에서:
1. PR 생성 → Actions 탭에서 두 잡 모두 ✅
2. main 푸시 → Actions 탭에서 `verify` ✅

---

## 8. 트러블슈팅

| 증상 | 원인 | 해결 |
| --- | --- | --- |
| `npm ci` 실패 (lockfile mismatch) | `package-lock.json`과 `package.json` 불일치 | 로컬에서 `npm install` 후 lockfile 커밋 |
| `npm run lint` 통과되는데 CI 실패 | Node 버전 차이 | 로컬 `nvm use 20` |
| `husky install` 관련 에러 | `HUSKY=0` 미설정 | 워크플로우 env에 `HUSKY: 0` 확인 |
| `Run lint-staged against full diff` 실패 | base 브랜치 fetch 부족 | `fetch-depth: 0` 확인 |
| 캐시 미적용으로 install 느림 | `actions/setup-node` cache 키 충돌 | `cache: "npm"` + `package-lock.json` 존재 확인 |

---

## 9. 향후 확장 (Iteration 4+)

| 추가 잡 | 시점 | 비고 |
| --- | --- | --- |
| `e2e` (Playwright) | Phase 4 | `npx playwright install --with-deps chromium` 추가 |
| `coverage` (Codecov 등) | Phase 4 | `vitest --coverage` 결과 업로드 |
| `preview` (Vercel) | Phase 5 | Vercel for GitHub 연동 시 자동 |
| `release` | Iteration 5+ | semantic-release 또는 changesets |

---

## 10. 참고 자료

- [GitHub Actions 공식 문서](https://docs.github.com/en/actions)
- [actions/setup-node](https://github.com/actions/setup-node)
- [Branch protection rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
