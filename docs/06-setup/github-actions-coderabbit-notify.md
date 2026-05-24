# 🤖 CodeRabbit 리뷰 완료 자동 감지 워크플로 (라벨 + 알림)

> **대상:** `.github/workflows/coderabbit-notify.yml`
> **도입 시점:** Phase 1 / 2026.05.24 (이슈 #81)
> **상태:** 활성 (단, **main 브랜치 도달 후 발동** — §7 참조)

---

## 1. 개요

CodeRabbit(AI 코드 리뷰 봇)이 PR 리뷰를 **완전히 끝낸 순간**을 자동 감지해, 사람이 매번 `gh pr checks`/`gh pr view`로 확인하지 않아도 되게 하는 GitHub Actions 워크플로다.

조건이 충족되면 두 가지만 수행한다(**사용자 선택: "라벨 + 알림만", 코드 수정은 수동**):

1. PR에 **`coderabbit-reviewed`** 라벨 부착 → `gh pr list --label coderabbit-reviewed`로 "검토 준비된 PR"을 한눈에 필터링
2. 저장소 소유자를 멘션하는 **알림 코멘트 1회** → "이제 `리뷰 확인`을 입력하면 됩니다"

> 코드를 자동 수정·재푸시하는 **auto-fix 업그레이드**는 §7에 별도 문서화(현재는 비활성).

---

## 2. 도입 시점

- **Phase 1 / 2026.05.24**, 이슈 #81. PR이 쌓이며 "CodeRabbit이 리뷰를 끝냈는지"를 매번 수동 확인하는 비용이 커진 것이 계기.
- 사용자 지시: ① "리뷰가 **완전히** 완료됐을 때만" 진행 → **체크가 pending이 아니라 success일 때만** 동작하도록 게이트. ② 인증은 향후 auto-fix 대비 **OAuth 구독 토큰**(`CLAUDE_CODE_OAUTH_TOKEN`)을 사용(현 라벨+알림 모드는 `GITHUB_TOKEN`만 사용).

---

## 3. 사전 요구사항

- 저장소에 **CodeRabbit GitHub App**이 설치되어 PR마다 리뷰/체크를 남기고 있을 것 (이미 충족 — `CodeRabbit` 체크가 PR에 표시됨).
- 워크플로 파일이 **default 브랜치(`main`)** 에 존재할 것 → §7 활성화 조건 필수 확인.
- 라벨 `coderabbit-reviewed` 는 워크플로가 없으면 자동 생성하므로 사전 생성 불필요.
- (auto-fix 업그레이드 시에만) `CLAUDE_CODE_OAUTH_TOKEN` 시크릿 — §5 참조.

---

## 4. 단계별 설치/설정

### 4.1 워크플로 파일

`.github/workflows/coderabbit-notify.yml` (본 PR에 포함). 핵심 구조:

```yaml
on:
  pull_request_review:
    types: [submitted]   # CodeRabbit 리뷰 제출
  issue_comment:
    types: [created]     # 리뷰 없이 요약 코멘트만 남기는 경우 포착
  check_suite:
    types: [completed]   # 체크가 리뷰보다 늦게 끝날 때 재평가 (게이트 핵심)
```

### 4.2 "완전히 완료" 감지 로직 (이 가이드의 핵심)

CodeRabbit은 "리뷰 끝!"이라는 **단일 이벤트를 주지 않는다.** 대신 다음 3가지 신호를 남긴다.

| 신호 | 이벤트 | 한계 |
| --- | --- | --- |
| 리뷰 제출 | `pull_request_review (submitted)` | 지적이 없으면 리뷰 없이 코멘트만 남길 때가 있음 |
| 요약/노액션 코멘트 | `issue_comment (created)` | 코멘트만으로는 "체크까지 끝났는지" 모름 |
| **`CodeRabbit` 상태 체크** | pending → **success** 전환 | **가장 신뢰할 완료 신호** |

따라서 워크플로는 위 세 이벤트 중 무엇으로 깨어나든, **head SHA의 모든 체크 상태를 직접 조회**해 게이트한다.

```text
이벤트 발생 → 대상 PR·head SHA 해석
          → head SHA의 체크 종합 상태는? (checksState)
               · 같은 체크의 과거 런 제거 (app.id+name별 최신 1개만 평가)
               · 이 SHA에 CodeRabbit 체크 런이 없으면 → pending (이 커밋 미리뷰)
               · 최신 런 중 미완료 있으면 → pending (다른 이벤트가 다시 깨움)
               · 최신 런/상태 중 실패 있으면 → failure (실패는 사용자가 직접 인지 — 알림 보류)
               · 그 외 → success → 진행
          → 이 커밋 SHA로 이미 알렸는가? (마커 dedup, 있으면 skip)
          → 라벨 부착 + 알림 코멘트 1회
```

- **head SHA 결박(PR #82 리뷰 반영):** "CodeRabbit이 **이 커밋을** 리뷰했는지"를 PR 단위 활동이 아니라 **head SHA의 CodeRabbit 체크 런 존재**로 판정한다. 이전 커밋의 봇 활동으로 새 커밋이 통과하거나, 체크가 0개인데 success가 되는 문제를 차단.
- **최신 런만 평가:** `checks.listForRef`가 같은 체크의 과거 런(재시도 전 실패 등)을 함께 반환할 수 있어, `app.id + name` 키로 **최신 1개**만 남겨 pending/failure를 계산한다.
- **체크 종합:** Checks API(`checks.listForRef`, GitHub Actions·CodeRabbit 등) + Statuses API(`getCombinedStatusForRef`, GitGuardian 등 레거시 상태)를 **모두** 본다.
- **재평가 보장:** 리뷰가 체크보다 먼저 와도 `check_suite: completed`가 나중에 깨워 success를 다시 판정한다.
- **중복 방지:** 알림 코멘트에 `<!-- crnotify:<headSHA> -->` 마커를 심고, 같은 커밋엔 1회만. 새 커밋(새 리뷰 라운드)엔 다시 알림.
- **무한 루프 없음:** 알림 코멘트는 `GITHUB_TOKEN`으로 작성 → GitHub 정책상 그 코멘트가 다시 워크플로를 트리거하지 않는다.

### 4.3 권한 (최소 권한)

```yaml
permissions:
  pull-requests: write   # 코멘트
  issues: write          # 라벨 (라벨은 issues API)
  checks: read           # 체크 런 조회
  statuses: read         # 커밋 상태 조회
  contents: read
```

---

## 5. 환경 변수 / 시크릿

| 시크릿 | 필요 시점 | 발급 방법 |
| --- | --- | --- |
| (없음) | **현재 라벨+알림 모드** | 내장 `GITHUB_TOKEN`만 사용 — 별도 설정 불필요 |
| `CLAUDE_CODE_OAUTH_TOKEN` | **auto-fix 업그레이드 시에만** | 로컬에서 `claude setup-token` 실행 → 출력 토큰을 저장소 **Settings → Secrets and variables → Actions → New repository secret** 에 등록. Pro/Max 구독을 그대로 사용하므로 별도 API 과금 없음 |

> 라벨+알림만 쓰는 동안에는 `CLAUDE_CODE_OAUTH_TOKEN` 을 등록하지 않아도 워크플로가 정상 동작한다. auto-fix로 전환할 때 등록한다.

---

## 6. 검증

1. **문법 검증:** 푸시 후 GitHub **Actions** 탭에 `CodeRabbit Notify` 워크플로가 인식되는지 확인.
2. **발동 검증(main 도달 후):** 임의 PR을 열어 CodeRabbit 리뷰가 끝나고 모든 체크가 success가 되면
   - PR에 `coderabbit-reviewed` 라벨이 붙는지
   - `🤖 CodeRabbit 리뷰 + 모든 체크 통과 완료` 알림 코멘트가 **1회** 달리는지
3. **게이트 검증:** 체크가 pending인 동안에는 라벨·코멘트가 **달리지 않아야** 한다 (Actions 로그에 `체크 상태=pending — 아직 알림 보류`).
4. **dedup 검증:** 같은 커밋에서 리뷰·요약·check_suite 이벤트가 여러 번 와도 알림 코멘트는 1개여야 한다.
5. **라벨 필터:** `gh pr list --label coderabbit-reviewed` 로 준비된 PR 목록 확인.

---

## 7. 트러블슈팅

### 7.1 워크플로가 전혀 발동하지 않는다 (가장 흔한 함정)

`pull_request_review`·`issue_comment`·`check_suite` 이벤트 워크플로는 **default 브랜치(`main`)의 워크플로 정의로만 실행**된다 ([GitHub 공식 문서](https://docs.github.com/actions/using-workflows/events-that-trigger-workflows)). 본 저장소는 **default = `main`**, 통합 = `dev` 구조라, 이 파일이 `dev`에만 있으면 **발동하지 않는다.**

→ **해결:** 본 워크플로가 `main`에 도달해야 한다. 옵션:
- (A) 본 PR을 `dev`에 머지 후, 별도 `dev → main` PR로 올린다(권장 — 기존 protected 흐름 유지).
- (B) 활성화가 급하면 본 PR의 base를 예외적으로 `main`으로 둔다(사용자 승인 필요).

### 7.2 알림이 두 번 달린다

마커 dedup이 작동하려면 알림 코멘트의 `<!-- crnotify:<sha> -->` 가 보존돼야 한다. 코멘트를 수동 삭제하면 다음 이벤트에서 재알림될 수 있다.

### 7.3 체크가 실패했는데 알림이 안 온다

의도된 동작이다. 사용자 지시에 따라 **success일 때만** 알린다. 실패 체크는 GitHub가 별도 알림을 주므로 중복을 피한다. 실패 시에도 알리고 싶다면 워크플로의 `state !== 'success'` 분기를 조정한다.

### 7.4 auto-fix로 업그레이드하려면

라벨+알림 잡에 더해, 아래 잡을 추가하고 `CLAUDE_CODE_OAUTH_TOKEN`(§5)을 등록한다. **액션 가능한 코멘트가 있을 때만** 헤드리스로 수정·재푸시하도록 가드한다.

```yaml
  autofix:
    needs: notify
    if: ${{ false }}   # ← 준비되면 조건으로 교체 (예: 특정 라벨/문구 게이트)
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.ref }}
      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          prompt: "이 PR의 CodeRabbit 리뷰 코멘트를 확인하고 타당한 지적만 수정한 뒤 커밋·푸시하라."
```

> 무한 루프 주의: Claude의 커밋이 다시 CodeRabbit 리뷰 → 본 워크플로를 깨울 수 있다. auto-fix 잡에는 라운드 제한(예: 라벨 카운터)·`[skip ci]`·봇 커밋 무시 가드를 반드시 둔다.

---

## 8. 참고 자료

- [GitHub Actions — Events that trigger workflows](https://docs.github.com/actions/using-workflows/events-that-trigger-workflows) (default 브랜치 실행 규칙)
- [`actions/github-script`](https://github.com/actions/github-script)
- [Checks API](https://docs.github.com/rest/checks/runs) · [Statuses API](https://docs.github.com/rest/commits/statuses)
- [`anthropics/claude-code-action`](https://github.com/anthropics/claude-code-action) (auto-fix 업그레이드)
- 관련: [`github-actions.md`](./github-actions.md) (CI: lint·typecheck·test·build)
