# 🗺 Sprint 2 — 이슈 ↔ 브랜치 매핑

> **작성:** 2026.05.25
> **출처:** [`./issues.md`](./issues.md) Epic #2 + GitHub Issues #2, #23~#40
> **분기 기준:** `dev` (992ae41 — Epic #1 통합 직후) · **머지 대상:** PR 위계 따름 (아래 §PR 위계 매핑)
> **범위:** **Epic #2 토너먼트 진행 (F-06~F-09)**. Epic #3(결과·재시작)·Epic #4(품질·안정성)는 Sprint 3+.

---

## 🔗 PR 위계 매핑 (부모-자식)

`github` 에이전트가 PR 생성 시 head 이슈 번호에서 부모 브랜치를 자동 결정한다.

| 자식 이슈 (head) | 부모 이슈 (base) | PR base 브랜치 |
| ---: | ---: | --- |
| **Task** #27, #28, #29, #30 | Story #23 | `feat/23-tournament-start` |
| **Task** #31, #32, #33, #34 | Story #24 | `feat/24-match-ui-select` |
| **Task** #35, #36, #37 | Story #25 | `feat/25-round-progression` |
| **Task** #38, #39, #40 | Story #26 | `feat/26-bye-handling` |
| **Story** #23, #24, #25, #26 | Epic #2 | `feat/2-epic-tournament` |
| **Epic** #2 | (통합) | `dev` |

**PR 흐름:** Task PR → Story 브랜치 → Epic 브랜치 → dev. Epic/Story 브랜치는 코드 작성보다 자식 PR이 모이는 **통합 베이스** 역할.

> `dev → main`은 **release 단계나 chore 사항일 때만** (사용자 영구 지시 2026.05.25, `CLAUDE.md` §9). Epic #2가 dev로 머지돼도 자동 dev→main PR을 만들지 않는다.

---

## EPIC-02. 토너먼트 진행 (#2)

| # | 이슈 제목 | 라벨 | 브랜치 |
| ---: | --- | --- | --- |
| 2 | 토너먼트 진행 (Epic) | 🔮 Feature | [`feat/2-epic-tournament`](https://github.com/GiToon10100011/gameCup/tree/feat/2-epic-tournament) |

> Epic 브랜치는 통합용 컨테이너. 자식 Story PR이 모인 뒤 토너먼트 화면 조립·E2E 등 통합 작업을 수행하고 dev로 머지한다.

---

## Story — 토너먼트 진행

| # | 이슈 제목 | 라벨 | 브랜치 |
| ---: | --- | --- | --- |
| 23 | 토너먼트 시작 조건 검증 및 시작 | 🔮 Feature · 🧪 Testing | [`feat/23-tournament-start`](https://github.com/GiToon10100011/gameCup/tree/feat/23-tournament-start) |
| 24 | 1:1 대결 UI 및 게임 선택 | 🔮 Feature · 💡 Enhancement | [`feat/24-match-ui-select`](https://github.com/GiToon10100011/gameCup/tree/feat/24-match-ui-select) |
| 25 | 라운드 자동 진행 | 🔮 Feature | [`feat/25-round-progression`](https://github.com/GiToon10100011/gameCup/tree/feat/25-round-progression) |
| 26 | 부전승 처리 | 🔮 Feature | [`feat/26-bye-handling`](https://github.com/GiToon10100011/gameCup/tree/feat/26-bye-handling) |

---

## Task — Story #23 토너먼트 시작 조건·시작

| # | 이슈 제목 | 라벨 | 브랜치 |
| ---: | --- | --- | --- |
| 27 | 토너먼트 시작 버튼 활성화/비활성화 로직 구현 | 🔮 Feature | [`feat/27-start-button-toggle`](https://github.com/GiToon10100011/gameCup/tree/feat/27-start-button-toggle) |
| 28 | 후보 목록 무작위 셔플 유틸 구현 | 🔮 Feature | [`feat/28-shuffle-util`](https://github.com/GiToon10100011/gameCup/tree/feat/28-shuffle-util) |
| 29 | 첫 라운드 대결 쌍 구성 로직 구현 | 🔮 Feature | [`feat/29-first-round-pairs`](https://github.com/GiToon10100011/gameCup/tree/feat/29-first-round-pairs) |
| 30 | 화면 전환 처리 (검색/후보 화면 → 토너먼트 화면) | 🔮 Feature · 💄 Style | [`feat/30-screen-transition`](https://github.com/GiToon10100011/gameCup/tree/feat/30-screen-transition) |

---

## Task — Story #24 1:1 대결 UI·게임 선택

| # | 이슈 제목 | 라벨 | 브랜치 |
| ---: | --- | --- | --- |
| 31 | `MatchCard` 컴포넌트 구현 (두 게임 카드 + 선택 버튼) | 🔮 Feature | [`feat/31-matchcard-component`](https://github.com/GiToon10100011/gameCup/tree/feat/31-matchcard-component) |
| 32 | 게임 선택 핸들러 구현 (승자 기록, 중복 클릭 방지) | 🔮 Feature | [`feat/32-select-handler`](https://github.com/GiToon10100011/gameCup/tree/feat/32-select-handler) |
| 33 | 라운드 진행 상황 표시 컴포넌트 구현 | 🔮 Feature | [`feat/33-round-progress-indicator`](https://github.com/GiToon10100011/gameCup/tree/feat/33-round-progress-indicator) |
| 34 | 선택 후 다음 대결 자동 전환 로직 구현 | 🔮 Feature | [`feat/34-auto-next-match`](https://github.com/GiToon10100011/gameCup/tree/feat/34-auto-next-match) |

---

## Task — Story #25 라운드 자동 진행

| # | 이슈 제목 | 라벨 | 브랜치 |
| ---: | --- | --- | --- |
| 35 | 라운드 종료 감지 및 다음 라운드 구성 로직 구현 | 🔮 Feature | [`feat/35-round-end-detect`](https://github.com/GiToon10100011/gameCup/tree/feat/35-round-end-detect) |
| 36 | 라운드 명칭 자동 계산 유틸 구현 (승자 수 기반) | 🔮 Feature | [`feat/36-round-name-util`](https://github.com/GiToon10100011/gameCup/tree/feat/36-round-name-util) |
| 37 | 최종 우승자 감지 및 결과 화면 전환 처리 | 🔮 Feature · 💄 Style | [`feat/37-winner-detect-result`](https://github.com/GiToon10100011/gameCup/tree/feat/37-winner-detect-result) |

---

## Task — Story #26 부전승 처리

| # | 이슈 제목 | 라벨 | 브랜치 |
| ---: | --- | --- | --- |
| 38 | 부전승 감지 로직 구현 (홀수 처리) | 🔮 Feature | [`feat/38-bye-detect`](https://github.com/GiToon10100011/gameCup/tree/feat/38-bye-detect) |
| 39 | 부전승 게임 자동 진출 처리 및 다음 라운드 반영 | 🔮 Feature | [`feat/39-bye-advance`](https://github.com/GiToon10100011/gameCup/tree/feat/39-bye-advance) |
| 40 | 부전승 UI 표시 처리 | 🔮 Feature · 💄 Style | [`feat/40-bye-ui`](https://github.com/GiToon10100011/gameCup/tree/feat/40-bye-ui) |

---

## 의존성 (권장 작업 순서)

```text
Epic #1 (검색·후보 관리 — dev 반영 완료)
  ↓
Story #23 (시작 조건·시작): #28 셔플 → #29 첫 라운드 페어 → #27 시작 버튼 → #30 화면 전환
  ↓
Story #24 (1:1 대결 UI): #31 MatchCard → #32 선택 핸들러 → #33 진행 표시 → #34 자동 전환
  ↓
Story #25 (라운드 자동 진행): #35 라운드 종료 감지 → #36 라운드 명칭 유틸 → #37 우승자 감지·결과 전환
  ↓
Story #26 (부전승): #38 감지 → #39 자동 진출 → #40 UI   ← #29/#35와 로직 맞물림(병행 가능)
```

핵심 의존성 주의:

- **`utils/shuffle.ts`(#28)·`utils/buildPairs.ts`(#29)** 는 이미 Phase 0 스캐폴딩에 존재 → 본 Task에서 `tournamentModule` 연결·검증 보강.
- `#28 셔플`, `#29 첫 라운드 페어` → 시작 흐름(#27/#30)보다 먼저 (시작 시 사용).
- `#32 선택 핸들러` → `#34 자동 전환`보다 먼저 (승자 기록 후 전환).
- `#35 라운드 종료 감지` → `#37 우승자 감지`보다 먼저 (라운드 끝나야 우승 판정).
- `#38 부전승 감지` → `#39 진출`·`#40 UI`보다 먼저. 부전승 로직은 `#29 첫 라운드`·`#35 다음 라운드` 구성과 맞물리므로 함께 검토.

---

## 작업 흐름 (Sprint 1과 동일)

### Task 작업 (한 번에 하나씩, 사용자 검사 후 다음)

1. **체크아웃:** `git checkout feat/<N>-...`
2. **상위 Story 브랜치(또는 dev)에서 최신 인프라 반영:** `git merge origin/feat/<상위 Story>` (없으면 `origin/dev`)
3. **구현:** 모듈/컴포넌트/테스트 작성 (3계층·`I` 접두사·블록 주석·variants 분리 컨벤션 준수, UI는 `docs/03-design/DESIGN.md` 참조)
4. **커밋·푸시:** `(#N)` 자동 부착 → `git push -u origin feat/<N>-...`
5. **PR:** `gh pr create --base feat/<상위 Story>-<slug> --body "... Closes #N"` (base는 dev/main이 아닌 상위 Story 브랜치)
6. **CodeRabbit 리뷰 완료 폴링 → 반영 → 사용자 검사 보고** → 머지 → 브랜치 정리 → 다음 Task

### Story / Epic 통합

- Story 통합: 자식 Task PR이 모두 머지된 뒤 `feat/<Story>` → `feat/2-epic-tournament` PR.
- Epic 통합: 자식 Story PR이 모두 머지된 뒤 토너먼트 화면 조립·E2E 보완 후 `feat/2-epic-tournament` → `dev` PR.

---

## 완료 추적

| 상태 | 표기 | 의미 |
| --- | --- | --- |
| 🟡 Open | issue OPEN | 작업 미시작 또는 진행 중 |
| 🟢 Merged | issue CLOSED via PR | PR 머지로 부모 브랜치(Story/Epic/dev)에 반영 |
| 🔴 Blocked | 댓글로 표시 | 외부 의존 또는 사용자 의사결정 필요 |

> 본 표는 `issue-branch` 에이전트가 주기적으로 갱신하거나, Sprint 종료 시 일괄 갱신한다.
