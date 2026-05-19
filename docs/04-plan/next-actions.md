# ✅ 다음 단계 운영 체크리스트 (Next Actions)

> **작성:** 2026.05.19 · **갱신 주기:** 각 단계 완료 시점마다
> **목적:** Phase 0(스캐폴딩) 직후 사용자가 직접 처리해야 할 운영 작업을 나열. Phase 1 진입 시 본 파일을 새로 갱신한다.

---

## 🚨 즉시 (블로킹)

### [ ] 1. GitHub 웹 UI에서 CI 워크플로우 생성

원격 푸시 권한 충돌로 `.github/workflows/ci.yml`은 로컬에서 제거됨(`53a112f`). 동등 워크플로우를 GitHub 웹 UI에서 직접 생성한다.

**진입 경로:** [github.com/GiToon10100011/gameCup](https://github.com/GiToon10100011/gameCup) → **Actions** 탭 → **"set up a workflow yourself"** 또는 **Code → Add file → Create new file** → 경로 `.github/workflows/ci.yml`

**작성할 본문 명세:** [`../06-setup/github-actions.md`](../06-setup/github-actions.md) §4 — 두 잡(`verify`, `hook-verify`)의 단계와 환경 변수가 명세되어 있다. 본 세션에서 작성했던 ci.yml 내용(78줄)도 그대로 붙여넣어도 무방.

**완료 후:** 웹에서 main에 커밋되므로 로컬에서 `git pull --rebase origin main` 실행 후 다음 단계로.

---

### [ ] 2. 로컬 main을 origin/main에 푸시

워크플로우 파일이 제거된 상태에서 푸시.

```bash
git push origin main
```

푸시 대상 3개 커밋:
- `e028f02` — Husky + (제거된) CI 워크플로우 설정
- `a8c577a` — 이슈·PR 템플릿
- `53a112f` — workflows 폴더 제거

> 1번 단계가 먼저 완료되어 원격에 ci.yml이 있다면 `git pull --rebase` 후 푸시한다.

---

### [ ] 3. RAWG API 키 발급 + `.env.local` 설정

`npm run dev`로 검색 동작을 확인하려면 RAWG 키가 필요하다.

**가이드:** [`../06-setup/rawg-api-key.md`](../06-setup/rawg-api-key.md)

```bash
cp .env.local.example .env.local
# .env.local 열어 NEXT_PUBLIC_RAWG_KEY 채우기
```

`.env.local`은 `.gitignore`에 등록되어 커밋되지 않는다.

---

## 🎯 권장 (선택)

### [ ] 4. main 브랜치 보호 규칙

CI 워크플로우 생성 후 활성화.

- **경로:** GitHub repo → **Settings → Branches → Add rule** → 패턴 `main`
- **권장 옵션:**
  - Require a pull request before merging
  - Require status checks to pass: `verify`, `hook-verify`
  - Require branches to be up to date before merging
  - Do not allow bypassing the above settings (관리자 포함)

---

### [ ] 5. Husky pre-commit hook 실제 동작 확인

```bash
# 임의 TS 파일을 의도적으로 lint 위반 상태로 만든 후 커밋 시도
echo "const x: any = 1; export default x;" > src/types/_smoke.ts
git add src/types/_smoke.ts
git commit -m "test: husky smoke"
# → ESLint가 staged 파일에 자동 실행 → `any` 사용 경고/오류로 커밋 차단되어야 함
# 확인 후:
rm src/types/_smoke.ts
git restore --staged src/types/_smoke.ts 2>/dev/null || true
```

---

### [ ] 6. (선택) Vercel 프로젝트 연결

Phase 5(배포)에 정식 도입 예정이지만, 미리 프리뷰 배포를 받고 싶다면 지금 연결 가능.

- [vercel.com](https://vercel.com) → New Project → GitHub 저장소 연결
- 환경 변수에 `NEXT_PUBLIC_RAWG_KEY` 등록
- 도입 시 [`../07-tech-rationale/README.md`](../07-tech-rationale/README.md) §10에 도입 시점 갱신, `docs/06-setup/vercel-deploy.md` 신설 (위임: `docs-setup`)

---

## 📈 그 다음 (Phase 1+)

상세 마일스톤은 이미 문서화되어 있다.

| 단계 | 산출물 | 위치 |
| --- | --- | --- |
| Phase 1: 검색·후보 (F-01~F-05, F-11~F-12) | SearchBar · CandidatePool · searchModule · candidateModule · ErrorBanner | [`./master-plan.md`](./master-plan.md) §7 Phase 1 |
| Phase 2: 토너먼트 (F-06~F-09) | TournamentBoard · MatchCard · tournamentModule | [`./master-plan.md`](./master-plan.md) §7 Phase 2 |
| Phase 3: 결과·재시작 (F-10, F-13) | ResultScreen · resultModule | [`./master-plan.md`](./master-plan.md) §7 Phase 3 |
| Phase 4: 테스트 정비 (UT/IT/ET ≥ 80%) | 단위·통합·E2E 테스트 본문 | [`./master-plan.md`](./master-plan.md) §7 Phase 4 |
| Phase 5: Iteration 4 분기 (결과 저장·공유·랭킹) | Supabase 도입 + UML v2.0 | [`./master-plan.md`](./master-plan.md) §7 Phase 5 |

**위임 트리거 예시:**
- "F-01 구현해줘" → `code` 에이전트
- "PRD를 Iteration 4로 분기" → `docs-prd` 에이전트
- "Supabase 도입" → `docs-tech-rationale` → `docs-setup` → `code` 순서

---

## 📚 참고 — 이미 문서화된 항목 위치

| 항목 | 위치 |
| --- | --- |
| 전체 마스터 플랜 | [`./master-plan.md`](./master-plan.md) |
| 변경 이력 (누적) | [`./changelog.md`](./changelog.md) |
| 이터레이션 갱신 규칙 | [`../05-process/iteration-update-guide.md`](../05-process/iteration-update-guide.md) |
| 새 이터레이션 문서 템플릿 | [`../05-process/iteration-template.md`](../05-process/iteration-template.md) |
| 환경 설정 가이드 인덱스 | [`../06-setup/README.md`](../06-setup/README.md) |
| RAWG API 키 가이드 | [`../06-setup/rawg-api-key.md`](../06-setup/rawg-api-key.md) |
| Git Hooks 가이드 | [`../06-setup/git-hooks.md`](../06-setup/git-hooks.md) |
| GitHub Actions 명세 | [`../06-setup/github-actions.md`](../06-setup/github-actions.md) |
| 기술 스택 도입 근거 | [`../07-tech-rationale/README.md`](../07-tech-rationale/README.md) |
| 서브에이전트 위임 규칙 | [`../../CLAUDE.md`](../../CLAUDE.md) §2 |
| 서브에이전트 정의 본문 | [`../../.claude/agents/`](../../.claude/agents/) |

---

## 🔄 본 문서의 운영 규칙

1. **체크박스 즉시 갱신.** 각 항목 완료 시 `[ ]` → `[x]`로 변경. 일자 기록.
2. **Phase 전환 시 새 버전 작성.** Phase 1 완료 후에는 본 파일을 통째로 다음 단계 액션으로 교체한다(또는 git 이력으로 백업 후 갱신).
3. **블로킹 작업 우선.** 🚨 섹션이 비기 전에는 🎯/📈 단계로 넘어가지 않는다.
